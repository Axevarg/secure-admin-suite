import { pool } from "../config/db.js";
import { obtenerUnidadesAccesibles, puedeAdministrarObra } from "../utils/unidades.js";

const normalizarNombre = (nombre) =>
  typeof nombre === "string" ? nombre.trim().replace(/\s+/g, " ") : "";

export const getTodasLasUnidades = async (req, res) => {
  try {
    const user = await pool.query("SELECT all_obras FROM users WHERE id=$1", [req.user.id]);
    if (!user.rows.length) return res.status(404).json({ message: "Usuario no encontrado" });

    const { rows } = user.rows[0].all_obras
      ? await pool.query(
          `SELECT u.id, u.obra_id, u.nombre, o.nombre AS obra_nombre
           FROM obra_unidades u JOIN obras o ON o.id=u.obra_id
           WHERE u.activa=true ORDER BY o.nombre, u.nombre`
        )
      : await pool.query(
          `SELECT DISTINCT u.id, u.obra_id, u.nombre, o.nombre AS obra_nombre
           FROM user_obras uo
           JOIN obras o ON o.id=uo.obra_id
           JOIN obra_unidades u ON u.obra_id=o.id AND u.activa=true
           LEFT JOIN user_obra_unidades au
             ON au.user_id=uo.user_id AND au.obra_id=uo.obra_id AND au.unidad_id=u.id
           WHERE uo.user_id=$1 AND (uo.all_unidades=true OR au.unidad_id IS NOT NULL)
           ORDER BY o.nombre, u.nombre`,
          [req.user.id]
        );

    res.json(rows);
  } catch (err) {
    console.error("GET UNIDADES ERROR:", err);
    res.status(500).json({ message: "Error al obtener unidades" });
  }
};

export const getUnidadesObra = async (req, res) => {
  try {
    const { obraId } = req.params;
    const administra = await puedeAdministrarObra(req.user.id, obraId);
    const unidades = administra
      ? (await pool.query(
          `SELECT id, obra_id, nombre FROM obra_unidades
           WHERE obra_id=$1 AND activa=true ORDER BY nombre`,
          [obraId]
        )).rows
      : await obtenerUnidadesAccesibles(req.user.id, obraId);
    if (unidades === null) return res.status(403).json({ message: "No tienes acceso a esta obra" });
    res.json({ obra_id: Number(obraId), unidades });
  } catch (err) {
    console.error("GET UNIDADES OBRA ERROR:", err);
    res.status(500).json({ message: "Error al obtener unidades de la obra" });
  }
};

export const crearUnidadObra = async (req, res) => {
  try {
    const { obraId } = req.params;
    const nombre = normalizarNombre(req.body?.nombre);
    if (!nombre || nombre.length > 100) {
      return res.status(400).json({ message: "El nombre es obligatorio y no debe exceder 100 caracteres" });
    }
    if (!(await puedeAdministrarObra(req.user.id, obraId))) {
      return res.status(403).json({ message: "No tienes permiso para administrar las unidades de esta obra" });
    }

    const { rows } = await pool.query(
      `INSERT INTO obra_unidades (obra_id, nombre)
       VALUES ($1,$2) RETURNING id, obra_id, nombre, activa`,
      [obraId, nombre]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Ya existe una unidad con ese nombre en esta obra" });
    console.error("CREATE UNIDAD ERROR:", err);
    res.status(500).json({ message: "Error al crear la unidad" });
  }
};

export const actualizarUnidadObra = async (req, res) => {
  try {
    const { unidadId } = req.params;
    const unidadRes = await pool.query("SELECT id, obra_id FROM obra_unidades WHERE id=$1", [unidadId]);
    const unidad = unidadRes.rows[0];
    if (!unidad) return res.status(404).json({ message: "Unidad no encontrada" });
    if (!(await puedeAdministrarObra(req.user.id, unidad.obra_id))) {
      return res.status(403).json({ message: "No tienes permiso para administrar esta unidad" });
    }

    const nombre = req.body?.nombre === undefined ? undefined : normalizarNombre(req.body.nombre);
    if (nombre !== undefined && (!nombre || nombre.length > 100)) {
      return res.status(400).json({ message: "El nombre es obligatorio y no debe exceder 100 caracteres" });
    }
    if (req.body?.activa === false) {
      const referencias = await pool.query(
        `SELECT
          EXISTS (SELECT 1 FROM trabajadores_asignados WHERE unidad_id=$1 AND activo=true) AS trabajadores,
          EXISTS (SELECT 1 FROM user_obra_unidades WHERE unidad_id=$1) AS usuarios`,
        [unidadId]
      );
      if (referencias.rows[0].trabajadores || referencias.rows[0].usuarios) {
        return res.status(409).json({ message: "Reasigna primero a los trabajadores y usuarios de esta unidad" });
      }
    }

    const { rows } = await pool.query(
      `UPDATE obra_unidades SET
         nombre=COALESCE($1,nombre),
         activa=COALESCE($2,activa)
       WHERE id=$3
       RETURNING id, obra_id, nombre, activa`,
      [nombre ?? null, typeof req.body?.activa === "boolean" ? req.body.activa : null, unidadId]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Ya existe una unidad con ese nombre en esta obra" });
    console.error("UPDATE UNIDAD ERROR:", err);
    res.status(500).json({ message: "Error al actualizar la unidad" });
  }
};
