import { pool } from "../config/db.js";


// 🔹 GET
export const getContratistas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        e.nombre AS especialidad,
        COUNT(tc.id) FILTER (WHERE tc.activo = true) AS trabajadores_count
      FROM contratistas c
      LEFT JOIN especialidades e ON e.id = c.especialidad_id
      LEFT JOIN trabajadores_contratistas tc ON tc.contratista_id = c.id
      GROUP BY c.id, e.nombre
      ORDER BY c.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo contratistas" });
  }
};


// 🔹 CREATE
export const createContratista = async (req, res) => {
  try {
    const { nombre, telefono, correo, empresa, especialidad_id } = req.body;

    await pool.query(`
      INSERT INTO contratistas
      (nombre,telefono,correo,empresa,especialidad_id)
      VALUES ($1,$2,$3,$4,$5)
    `, [nombre, telefono, correo, empresa, especialidad_id]);

    res.json({ message: "Contratista creado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando contratista" });
  }
};


// 🔹 UPDATE
export const updateContratista = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo, empresa, especialidad_id, activo } = req.body;

    await pool.query(`
      UPDATE contratistas SET
      nombre=$1,
      telefono=$2,
      correo=$3,
      empresa=$4,
      especialidad_id=$5,
      activo=$6
      WHERE id=$7
    `, [nombre, telefono, correo, empresa, especialidad_id, activo, id]);

    res.json({ message: "Contratista actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error actualizando" });
  }
};


// 🔹 DELETE (soft delete)
export const deleteContratista = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE contratistas SET activo=false WHERE id=$1
    `, [id]);

    res.json({ message: "Contratista desactivado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error eliminando" });
  }
};


// ============================================
// 🔹 TRABAJADORES DE CONTRATISTA
// ============================================

// 🔹 GET trabajadores de un contratista
export const getTrabajadoresByContratista = async (req, res) => {
  try {
    const { contratistaId } = req.params;

    const result = await pool.query(
      `SELECT * FROM trabajadores_contratistas WHERE contratista_id=$1 ORDER BY created_at DESC`,
      [contratistaId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo trabajadores" });
  }
};

// 🔹 CREATE trabajador
export const createTrabajadorContratista = async (req, res) => {
  try {
    const { contratistaId } = req.params;
    const { nombre, puesto, telefono, curp } = req.body;

    const result = await pool.query(
      `INSERT INTO trabajadores_contratistas (contratista_id, nombre, puesto, telefono, curp)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [contratistaId, nombre, puesto, telefono, curp]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando trabajador" });
  }
};

// 🔹 UPDATE trabajador
export const updateTrabajadorContratista = async (req, res) => {
  try {
    const { trabajadorId } = req.params;
    const { nombre, puesto, telefono, curp, activo } = req.body;

    const result = await pool.query(
      `UPDATE trabajadores_contratistas SET
        nombre=$1, puesto=$2, telefono=$3, curp=$4, activo=$5
       WHERE id=$6
       RETURNING *`,
      [nombre, puesto, telefono, curp, activo, trabajadorId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error actualizando trabajador" });
  }
};

// 🔹 DELETE trabajador (soft delete)
export const deleteTrabajadorContratista = async (req, res) => {
  try {
    const { trabajadorId } = req.params;

    await pool.query(`UPDATE trabajadores_contratistas SET activo=false WHERE id=$1`, [trabajadorId]);

    res.json({ message: "Trabajador desactivado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error eliminando trabajador" });
  }
};