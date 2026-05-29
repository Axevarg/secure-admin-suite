import { pool } from "../config/db.js";


// ============================================
// OBTENER trabajadores de una obra
// ============================================



export const getTrabajadoresObra = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        ta.*,
        t.nombre,
        t.telefono,
        e.nombre AS especialidad
      FROM trabajadores_asignados ta
      JOIN trabajadores t ON t.id = ta.trabajador_id
      LEFT JOIN especialidades e ON e.id = t.especialidad_id
      WHERE ta.obra_id = $1
      ORDER BY ta.id DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo trabajadores de la obra" });
  }
};

export const asignarTrabajador = async (req, res) => {
  try {
    const { id } = req.params; // obra_id
    const { trabajador_id, fecha_inicio, rol } = req.body;

    // 🔎 1. VERIFICAR SI YA ESTÁ ASIGNADO A OTRA OBRA
    const check = await pool.query(`
      SELECT *
      FROM trabajadores_asignados
      WHERE trabajador_id = $1
      AND activo = true
      LIMIT 1
    `, [trabajador_id]);

    if (check.rows.length > 0) {
      return res.status(400).json({
        error: "Este trabajador ya está asignado a otra obra activa"
      });
    }

        // 🔥 FIX CRÍTICO
    if (!fecha_inicio || fecha_inicio === "") {
      fecha_inicio = null;
    }

    // 🧱 2. INSERTAR ASIGNACIÓN
    const result = await pool.query(`
      INSERT INTO trabajadores_asignados 
      (obra_id, trabajador_id, fecha_inicio, rol, activo)
      VALUES ($1,$2,$3,$4,true)
      RETURNING *
    `, [id, trabajador_id, fecha_inicio, rol]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error asignando trabajador" });
  }
};

export const updateAsignacionTrabajador = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_fin, rol, activo } = req.body;

  // 🔥 FIX FECHA FIN
    if (!fecha_fin || fecha_fin === "") {
      fecha_fin = null;
    }

    const result = await pool.query(`
      UPDATE trabajadores_asignados
      SET 
        fecha_fin = $1,
        rol = $2,
        activo = $3
      WHERE id = $4
      RETURNING *
    `, [fecha_fin, rol, activo, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando asignación" });
  }
};

export const deleteAsignacionTrabajador = async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM trabajadores_asignados WHERE id=$1",
      [req.params.id]
    );
    res.json({ message: "Asignación eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando asignación" });
  }
};


export const getContratistasObra = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        ca.*,
        c.nombre,
        c.telefono,
        c.correo,
        e.nombre AS especialidad
      FROM contratistas_asignados ca
      JOIN contratistas c ON c.id = ca.contratista_id
      LEFT JOIN especialidades e ON e.id = c.especialidad_id
      WHERE ca.obra_id = $1
      ORDER BY ca.id DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo contratistas de la obra" });
  }
};

export const asignarContratista = async (req, res) => {
  try {
    const { id } = req.params; // obra_id
    const { contratista_id, fecha_inicio, servicio } = req.body;

    const result = await pool.query(`
      INSERT INTO contratistas_asignados
      (obra_id, contratista_id, fecha_inicio, servicio)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `, [id, contratista_id, fecha_inicio, servicio]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error asignando contratista" });
  }
};


export const updateAsignacionContratista = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_fin, servicio, activo } = req.body;

    const result = await pool.query(`
      UPDATE contratistas_asignados
      SET fecha_fin=$1, servicio=$2, activo=$3
      WHERE id=$4
      RETURNING *
    `, [fecha_fin, servicio, activo, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando asignación" });
  }
};

export const deleteAsignacionContratista = async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM contratistas_asignados WHERE id=$1",
      [req.params.id]
    );
    res.json({ message: "Asignación eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando asignación" });
  }
};