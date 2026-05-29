import { pool } from "../config/db.js";


// 🔹 GET
export const getContratistas = async (req,res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        e.nombre AS especialidad
      FROM contratistas c
      LEFT JOIN especialidades e ON e.id = c.especialidad_id
      ORDER BY c.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({message:"Error obteniendo contratistas"});
  }
};


// 🔹 CREATE
export const createContratista = async (req,res) => {
  try {
    const {nombre,telefono,correo,empresa,especialidad_id} = req.body;

    await pool.query(`
      INSERT INTO contratistas
      (nombre,telefono,correo,empresa,especialidad_id)
      VALUES ($1,$2,$3,$4,$5)
    `,[nombre,telefono,correo,empresa,especialidad_id]);

    res.json({message:"Contratista creado"});
  } catch (err) {
    console.error(err);
    res.status(500).json({message:"Error creando contratista"});
  }
};


// 🔹 UPDATE
export const updateContratista = async (req,res) => {
  try {
    const {id} = req.params;
    const {nombre,telefono,correo,empresa,especialidad_id,activo} = req.body;

    await pool.query(`
      UPDATE contratistas SET
      nombre=$1,
      telefono=$2,
      correo=$3,
      empresa=$4,
      especialidad_id=$5,
      activo=$6
      WHERE id=$7
    `,[nombre,telefono,correo,empresa,especialidad_id,activo,id]);

    res.json({message:"Contratista actualizado"});
  } catch (err) {
    console.error(err);
    res.status(500).json({message:"Error actualizando"});
  }
};


// 🔹 DELETE (soft delete)
export const deleteContratista = async (req,res) => {
  try {
    const {id} = req.params;

    await pool.query(`
      UPDATE contratistas SET activo=false WHERE id=$1
    `,[id]);

    res.json({message:"Contratista desactivado"});
  } catch (err) {
    console.error(err);
    res.status(500).json({message:"Error eliminando"});
  }
};