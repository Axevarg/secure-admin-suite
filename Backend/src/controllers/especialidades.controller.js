import { pool } from "../config/db.js";

/* ===============================
   GET ALL
=============================== */
export const getEspecialidades = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM especialidades WHERE activo = TRUE ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("ERROR GET ESPECIALIDADES:", err);
    res.status(500).json({ message: "Error al obtener especialidades" });
  }
};

/* ===============================
   CREATE
=============================== */
export const createEspecialidad = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const result = await pool.query(
      `INSERT INTO especialidades (nombre, descripcion, activo)
       VALUES ($1, $2, true) RETURNING *`,
      [nombre, descripcion]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR CREATE ESPECIALIDAD:", error);
    res.status(500).json({ message: "Error al crear especialidad" });
  }
};

/* ===============================
   UPDATE
=============================== */
export const updateEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const result = await pool.query(
      `UPDATE especialidades
       SET nombre=$1, descripcion=$2, activo=$3
       WHERE id=$4 RETURNING *`,
      [nombre, descripcion, activo, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR UPDATE ESPECIALIDAD:", error);
    res.status(500).json({ message: "Error al actualizar especialidad" });
  }
};

/* ===============================
   DELETE LOGICO
=============================== */
export const deleteEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE especialidades SET activo=false WHERE id=$1",
      [id]
    );

    res.json({ message: "Especialidad desactivada" });
  } catch (error) {
    console.error("ERROR DELETE ESPECIALIDAD:", error);
    res.status(500).json({ message: "Error al eliminar especialidad" });
  }
};