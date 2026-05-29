import { pool } from "../config/db.js";
import multer from "multer";
import fs from "fs";

// =============================
// CONFIG MULTER
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/evidencias";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname.replace(/\s/g, "_");
    cb(null, unique);
  },
});

export const upload = multer({ storage });


// =============================
// SUBIR EVIDENCIA (solo remesas aprobadas)
// =============================
export const subirEvidenciaRemesa = async (req, res) => {
  try {
    const { remesa_id } = req.body;
    const usuario_id = req.user?.id || null;

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ msg: "Archivos requeridos" });

    const remesa = await pool.query(
      "SELECT estado FROM remesas WHERE id=$1", [remesa_id]
    );
    if (!remesa.rows.length)
      return res.status(404).json({ msg: "Remesa no existe" });

    const estadosValidos = ["aprobado", "recibida"];
    if (!estadosValidos.includes(remesa.rows[0].estado))
      return res.status(400).json({ msg: "Estado de remesa no permite evidencias" });

    const insertadas = [];
    for (const file of req.files) {
      const tipo = file.mimetype.includes("pdf") ? "pdf" : "foto";
      const url = `/uploads/evidencias/${file.filename}`;
      const result = await pool.query(
        `INSERT INTO evidencias_remesa (remesa_id,nombre_archivo,url,tipo,usuario_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [remesa_id, file.originalname, url, tipo, usuario_id]
      );
      insertadas.push(result.rows[0]);
    }

    res.json(insertadas);
  } catch (err) {
    console.error("ERROR SUBIR EVIDENCIA:", err);
    res.status(500).json({ msg: "Error al subir evidencia" });
  }
};


// =============================
// LISTAR EVIDENCIAS DE REMESA
// =============================
export const getEvidenciasRemesa = async (req, res) => {
  try {
    const remesaId = Number(req.params.remesaId);

    if (isNaN(remesaId)) {
      return res.status(400).json({ msg: "remesaId inválido" });
    }

    const data = await pool.query(
      `SELECT 
        e.id,
        e.nombre_archivo,
        e.url,
        e.tipo,
        e.created_at,
        u.name as usuario
      FROM evidencias_remesa e
      LEFT JOIN users u ON u.id = e.usuario_id
      WHERE e.remesa_id = $1
      ORDER BY e.created_at DESC`,
      [remesaId]
    );

    res.json(data.rows);
  } catch (err) {
    console.error("ERROR GET EVIDENCIAS:", err);
    res.status(500).json({ msg: "Error al obtener evidencias" });
  }
};


// =============================
// ELIMINAR EVIDENCIA
// =============================
export const eliminarEvidencia = async (req, res) => {
  try {
    const { id } = req.params;

    const evidencia = await pool.query(
      "SELECT url FROM evidencias_remesa WHERE id=$1",
      [id]
    );

    if (!evidencia.rows.length)
      return res.status(404).json({ msg: "No existe" });

    // borrar archivo físico
    const filePath = "." + evidencia.rows[0].url;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query("DELETE FROM evidencias_remesa WHERE id=$1", [id]);

    res.json({ msg: "Eliminado" });
  } catch (err) {
    console.error("ERROR ELIMINAR:", err);
    res.status(500).json({ msg: "Error al eliminar" });
  }
};

// GET REMESAS POR OBRA
// evidencias.controller.js
export const getRemesasPorObra = async (req, res) => {
  try {
    const { obraId } = req.params;

    const data = await pool.query(
      `SELECT 
        r.id,
        r.folio,
        r.monto_total AS monto,
        r.estado,
        r.created_at,
        o.nombre AS obra_nombre,
        u.name AS elaboro_nombre
       FROM remesas r
       LEFT JOIN obras o ON o.id = r.obra_id
       LEFT JOIN users u ON u.id::text = r.elaboro_id::text
       WHERE r.obra_id = $1
       ORDER BY r.created_at DESC`,
      [obraId]
    );

    res.json(data.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener remesas" });
  }
};