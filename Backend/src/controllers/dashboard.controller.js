import { pool } from "../config/db.js";

export const getDashboardGlobal = async (req, res) => {
  try {

    // ===============================
    // OBRAS ACTIVAS
    // ===============================
    const obrasActivas = await pool.query(`
      SELECT COUNT(*) FROM obras 
      WHERE status_id = '2'
    `);

    // ===============================
    // TRABAJADORES ACTIVOS
    // ===============================
    const trabajadores = await pool.query(`
      SELECT COUNT(*) FROM trabajadores 
      WHERE activo = true
    `);

    // ===============================
    // CONTRATISTAS ACTIVOS
    // ===============================
    const contratistas = await pool.query(`
      SELECT COUNT(*) FROM contratistas 
      WHERE activo = true
    `);

    const personalTotal =
      Number(trabajadores.rows[0].count) +
      Number(contratistas.rows[0].count);

    // ===============================
    // REQUISICIONES PENDIENTES DE AUTORIZAR
    // ===============================
    const requisicionesPendientes = await pool.query(`
      SELECT COUNT(*) 
      FROM requisiciones 
      WHERE estado = 'enviada'
    `);

    // ===============================
    // REMESAS PAGADAS (material entregado)
    // ===============================
    const materialesEntregados = await pool.query(`
      SELECT COUNT(*) 
      FROM remesas 
      WHERE estado = 'pagada' OR estado = 'recibida'
    `);

    // ===============================
    // ÚLTIMAS ACTIVIDADES (timeline real)
    // ===============================
   const actividad = await pool.query(`
  SELECT 
    'Remesa creada' AS accion,
    CONCAT('HGZ.', r.folio, ' por ', u.name) AS detalle,
    r.created_at AS fecha
  FROM remesas r
  LEFT JOIN users u ON u.id = r.elaboro_id

  UNION ALL

  SELECT 
    'Requisición enviada' AS accion,
    CONCAT(req.folio, ' por ', u.name) AS detalle,
    req.created_at AS fecha
  FROM requisiciones req
  LEFT JOIN users u ON u.id = req.usuario_id
  WHERE req.created_at IS NOT NULL

  ORDER BY fecha DESC
  LIMIT 5
`);

    // ===============================
    // RESPONSE FINAL
    // ===============================
    res.json({
      stats: {
        obras_activas: Number(obrasActivas.rows[0].count),
        personal_activo: personalTotal,
        requisiciones_pendientes: Number(requisicionesPendientes.rows[0].count),
        materiales_entregados: Number(materialesEntregados.rows[0].count)
      },
      actividad: actividad.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};