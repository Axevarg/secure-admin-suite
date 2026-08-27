import { pool } from "../config/db.js";






// ============================================
// OBTENER trabajadores de una obra (unificado: internos + de contratista)
// ============================================
export const getTrabajadoresObra = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        ta.id,
        ta.obra_id,
        ta.fecha_inicio,
        ta.fecha_fin,
        ta.rol,
        ta.activo,
        ta.contratista_id,
        c.nombre AS contratista_nombre,
        COALESCE(t.nombre, tc.nombre) AS nombre,
        COALESCE(t.telefono, tc.telefono) AS telefono,
        e.nombre AS especialidad,
        CASE WHEN ta.trabajador_contratista_id IS NOT NULL THEN 'contratista' ELSE 'interno' END AS origen
      FROM trabajadores_asignados ta
      LEFT JOIN trabajadores t ON t.id = ta.trabajador_id
      LEFT JOIN trabajadores_contratistas tc ON tc.id = ta.trabajador_contratista_id
      LEFT JOIN contratistas c ON c.id = ta.contratista_id
      LEFT JOIN especialidades e ON e.id = t.especialidad_id
      WHERE ta.obra_id = $1 AND ta.activo = true
      ORDER BY ta.id DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo trabajadores de la obra" });
  }
};

// ============================================
// LISTAR contratistas + sus trabajadores, marcando quiénes ya están en esta obra
// ============================================
export const getContratistasParaAsignar = async (req, res) => {
  try {
    const { id } = req.params; // obra_id

    const result = await pool.query(`
      SELECT 
        c.id AS contratista_id,
        c.nombre AS contratista_nombre,
        c.empresa,
        tc.id AS trabajador_contratista_id,
        tc.nombre AS trabajador_nombre,
        tc.puesto,
        tc.telefono,
        (ta.id IS NOT NULL) AS asignado,
        ta.id AS asignacion_id
      FROM contratistas c
      JOIN trabajadores_contratistas tc 
        ON tc.contratista_id = c.id AND tc.activo = true
      LEFT JOIN trabajadores_asignados ta
        ON ta.trabajador_contratista_id = tc.id
        AND ta.obra_id = $1
        AND ta.activo = true
      WHERE c.activo = true
      ORDER BY c.nombre, tc.nombre
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo contratistas disponibles" });
  }
};

// ============================================
// ASIGNAR un trabajador de contratista a la obra
// ============================================
export const asignarTrabajadorDeContratista = async (req, res) => {
  try {
    const { id } = req.params; // obra_id
    const { trabajador_contratista_id } = req.body;

    const tcRes = await pool.query(
      `SELECT contratista_id FROM trabajadores_contratistas WHERE id=$1`,
      [trabajador_contratista_id]
    );

    if (tcRes.rows.length === 0) {
      return res.status(404).json({ error: "Trabajador no encontrado" });
    }

    const contratistaId = tcRes.rows[0].contratista_id;

    const result = await pool.query(`
      INSERT INTO trabajadores_asignados (obra_id, trabajador_contratista_id, contratista_id, activo)
      VALUES ($1,$2,$3,true)
      ON CONFLICT (obra_id, trabajador_contratista_id) 
        WHERE trabajador_contratista_id IS NOT NULL AND activo = true
      DO NOTHING
      RETURNING *
    `, [id, trabajador_contratista_id, contratistaId]);

    res.json(result.rows[0] || { message: "Ya estaba asignado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error asignando trabajador de contratista" });
  }
};
export const asignarTrabajador = async (req, res) => {
  try {
    const { id } = req.params; // obra_id
    const { trabajador_id, fecha_inicio, rol } = req.body;

    if (!trabajador_id) {
      return res.status(400).json({
        error: "Selecciona un trabajador"
      });
    }

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

    const fechaInicio = fecha_inicio || null;

    // 🧱 2. INSERTAR ASIGNACIÓN
    const result = await pool.query(`
      INSERT INTO trabajadores_asignados 
      (obra_id, trabajador_id, fecha_inicio, rol, activo)
      VALUES ($1,$2,$3,$4,true)
      RETURNING *
    `, [id, trabajador_id, fechaInicio, rol || null]);

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

    const fechaFin = fecha_fin || null;

    const result = await pool.query(`
      UPDATE trabajadores_asignados
      SET 
        fecha_fin = $1,
        rol = $2,
        activo = $3
      WHERE id = $4
      RETURNING *
    `, [fechaFin, rol, activo, id]);

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
