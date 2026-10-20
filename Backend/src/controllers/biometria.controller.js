import { pool } from "../config/db.js";

// El reconocimiento facial se hace en el teléfono. Aquí solo se guardan
// los vectores (embeddings) de rostro y se entregan a la app por obra.

const DIMENSIONES_MIN = 64;
const DIMENSIONES_MAX = 1024;

export const tieneAccesoObra = async (userId, obraId) => {
  const userRes = await pool.query(
    "SELECT all_obras FROM users WHERE id=$1",
    [userId]
  );

  if (userRes.rows.length === 0) return false;
  if (userRes.rows[0].all_obras) return true;

  const access = await pool.query(
    "SELECT 1 FROM user_obras WHERE user_id=$1 AND obra_id=$2",
    [userId, obraId]
  );

  return access.rows.length > 0;
};

// Valida el vector y lo normaliza (longitud 1) para comparar por coseno.
const normalizarEmbedding = (embedding) => {
  if (!Array.isArray(embedding)) return null;
  if (embedding.length < DIMENSIONES_MIN || embedding.length > DIMENSIONES_MAX) return null;
  if (!embedding.every((v) => typeof v === "number" && Number.isFinite(v))) return null;

  const norma = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
  if (norma === 0) return null;

  return embedding.map((v) => v / norma);
};

/* ========================================
   GET trabajadores de la obra con su rostro
   (la app los guarda cifrados para trabajar sin internet)
======================================== */
export const getRostrosObra = async (req, res) => {
  try {
    const { obraId } = req.params;

    if (!(await tieneAccesoObra(req.user.id, obraId))) {
      return res.status(403).json({ message: "No tienes acceso a esta obra" });
    }

    const { rows } = await pool.query(
      `
      SELECT
        t.id AS trabajador_id,
        t.nombre,
        e.nombre AS especialidad,
        r.embedding,
        r.modelo,
        r.creado_en AS rostro_registrado_en
      FROM trabajadores_asignados ta
      JOIN trabajadores t ON t.id = ta.trabajador_id
      LEFT JOIN especialidades e ON e.id = t.especialidad_id
      LEFT JOIN trabajador_rostros r ON r.trabajador_id = t.id
      WHERE ta.obra_id = $1
        AND ta.activo = true
      ORDER BY t.nombre ASC
    `,
      [obraId]
    );

    res.json({
      obra_id: Number(obraId),
      generado_en: new Date().toISOString(),
      trabajadores: rows,
    });
  } catch (err) {
    console.error("ERROR GET ROSTROS OBRA:", err);
    res.status(500).json({ message: "Error al obtener rostros de la obra" });
  }
};

/* ========================================
   PUT rostro de un trabajador (registra o reemplaza)
======================================== */
export const guardarRostro = async (req, res) => {
  try {
    const { id } = req.params;
    const { embedding, modelo, muestras, consentimiento } = req.body;

    if (consentimiento !== true) {
      return res.status(400).json({
        message: "Se requiere el consentimiento del trabajador para registrar su rostro",
      });
    }

    const vector = normalizarEmbedding(embedding);
    if (!vector) {
      return res.status(400).json({ message: "El vector de rostro no es válido" });
    }

    if (typeof modelo !== "string" || !modelo.trim() || modelo.length > 60) {
      return res.status(400).json({ message: "El modelo es obligatorio" });
    }

    const trabajador = await pool.query(
      "SELECT id FROM trabajadores WHERE id=$1",
      [id]
    );
    if (trabajador.rows.length === 0) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO trabajador_rostros
        (trabajador_id, embedding, modelo, muestras, consentimiento_fecha, creado_por)
      VALUES ($1, $2, $3, $4, NOW(), $5)
      ON CONFLICT (trabajador_id) DO UPDATE SET
        embedding = EXCLUDED.embedding,
        modelo = EXCLUDED.modelo,
        muestras = EXCLUDED.muestras,
        consentimiento_fecha = EXCLUDED.consentimiento_fecha,
        creado_por = EXCLUDED.creado_por,
        creado_en = NOW()
      RETURNING trabajador_id, modelo, muestras, consentimiento_fecha, creado_en
    `,
      [
        id,
        vector,
        modelo.trim(),
        Number.isInteger(muestras) && muestras > 0 ? Math.min(muestras, 20) : 1,
        String(req.user.id),
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("ERROR GUARDAR ROSTRO:", err);
    res.status(500).json({ message: "Error al guardar el rostro" });
  }
};

/* ========================================
   DELETE rostro de un trabajador (derecho de cancelación)
======================================== */
export const eliminarRostro = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      "DELETE FROM trabajador_rostros WHERE trabajador_id=$1",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "El trabajador no tiene rostro registrado" });
    }

    res.json({ message: "Rostro eliminado" });
  } catch (err) {
    console.error("ERROR ELIMINAR ROSTRO:", err);
    res.status(500).json({ message: "Error al eliminar el rostro" });
  }
};
