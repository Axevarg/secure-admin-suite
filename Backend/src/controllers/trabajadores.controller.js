import { pool } from "../config/db.js";

/* ========================================
   GET trabajadores (con especialidad)
======================================== */
export const getTrabajadores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        e.nombre AS especialidad
      FROM trabajadores t
      LEFT JOIN especialidades e 
        ON e.id = t.especialidad_id
      ORDER BY t.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("ERROR GET TRABAJADORES:", error);
    res.status(500).json({ message: "Error al obtener trabajadores" });
  }
};

/* ========================================
   CREATE trabajador
======================================== */

export const createTrabajador = async (req, res) => {
  try {
    const { nombre, telefono, correo, especialidad_id } = req.body;

    const result = await pool.query(
      `INSERT INTO trabajadores 
        (nombre, telefono, correo, especialidad_id, activo)
       VALUES ($1,$2,$3,$4,true)
       RETURNING *`,
      [nombre, telefono, correo, especialidad_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR CREATE TRABAJADOR:", error);
    res.status(500).json({ message: "Error al crear trabajador" });
  }
};

/* ========================================
   UPDATE trabajador
======================================== */
export const updateTrabajador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo, especialidad_id, activo } = req.body;

    const result = await pool.query(
      `UPDATE trabajadores
       SET nombre=$1,
           telefono=$2,
           correo=$3,
           especialidad_id=$4,
           activo=$5
       WHERE id=$6
       RETURNING *`,
      [nombre, telefono, correo, especialidad_id, activo, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR UPDATE TRABAJADOR:", error);
    res.status(500).json({ message: "Error al actualizar trabajador" });
  }
};

/* ========================================
   DELETE trabajador (soft delete)
======================================== */
export const deleteTrabajador = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE trabajadores SET activo=false WHERE id=$1",
      [id]
    );

    res.json({ message: "Trabajador desactivado" });
  } catch (error) {
    console.error("ERROR DELETE TRABAJADOR:", error);
    res.status(500).json({ message: "Error al eliminar trabajador" });
  }
};


export const getTrabajadoresDisponibles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.nombre,
        t.telefono,
        e.nombre AS especialidad
      FROM trabajadores t
      LEFT JOIN especialidades e ON e.id = t.especialidad_id
      WHERE t.activo = true
      AND t.id NOT IN (
        SELECT trabajador_id
        FROM trabajadores_asignados
        WHERE activo = true
      )
      ORDER BY t.nombre ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo trabajadores disponibles" });
  }
};