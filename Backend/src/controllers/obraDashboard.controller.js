import { pool } from "../config/db.js";

export const getDashboardObra = async (req, res) => {
  try {
    const { id } = req.params;

    // ===============================
    // REQUISICIONES POR ESTADO
    // ===============================
    const reqEstados = await pool.query(
      `
      SELECT estado, COUNT(*)::int AS count
      FROM requisiciones
      WHERE obra_id = $1
      GROUP BY estado
    `,
      [id],
    );

    // ===============================
    // REMESAS POR ESTADO
    // ===============================
    const remEstados = await pool.query(
      `
      SELECT estado, COUNT(*)::int AS count
      FROM remesas
      WHERE obra_id = $1
      GROUP BY estado
    `,
      [id],
    );

// ===============================
// TOTAL REQUISICIONES $ (todas)
// ===============================
const totalReq = await pool.query(`
  SELECT COALESCE(SUM(rd.cantidad * i.costo_unitario),0)::float AS total
  FROM requisiciones r
  JOIN requisicion_detalle rd ON rd.requisicion_id = r.id
  JOIN insumos i ON i.id = rd.insumo_id AND i.obra_id = r.obra_id
  WHERE r.obra_id = $1
  AND r.estado = 'autorizada'
`, [id]);

    // ===============================
    // TOTAL REMESAS (conteo)
    // ===============================
    const totalRem = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM remesas
      WHERE obra_id = $1
    `,
      [id],
    );

    // ===============================
    // INSUMOS SOLICITADOS
    // ===============================
    const insumosSolicitados = await pool.query(
      `
      SELECT COALESCE(SUM(rd.cantidad),0)::int AS total
      FROM requisiciones r
      JOIN requisicion_detalle rd ON rd.requisicion_id = r.id
      WHERE r.obra_id = $1
    `,
      [id],
    );

    // ===============================
    // 💰 PRESUPUESTO TOTAL (INSUMOS)
    // ===============================
const presupuesto = await pool.query(
  `
  SELECT COALESCE(SUM(importe),0)::float AS total
  FROM insumos
  WHERE obra_id = $1
  AND categoria_id = 1
  `,
  [id],
);

    // ===============================
    // 📦 REQUISITADO APROBADO $
    // ===============================
    const requisitadoAprobado = await pool.query(
      `
  SELECT COALESCE(SUM(rd.cantidad * i.costo_unitario),0)::float AS total
  FROM requisiciones r
  JOIN requisicion_detalle rd ON rd.requisicion_id = r.id
  JOIN insumos i ON i.id = rd.insumo_id AND i.obra_id = r.obra_id
  WHERE r.obra_id = $1
  AND r.estado = 'autorizada'
`,
      [id],
    );

    // ===============================
    // 📊 % PRESUPUESTO CONSUMIDO
    // ===============================
    const presupuestoTotal = presupuesto.rows[0].total;
    const requisitado = requisitadoAprobado.rows[0].total;

    const porcentajeConsumido =
      presupuestoTotal === 0
        ? 0
        : Number(((requisitado / presupuestoTotal) * 100).toFixed(2));

    // ===============================
    // ACTIVIDAD RECIENTE
    // ===============================
    const actividad = await pool.query(
      `
      SELECT 
        'Remesa creada' AS accion,
        CONCAT('HGZ.', r.folio) AS detalle,
        r.created_at AS fecha
      FROM remesas r
      WHERE r.obra_id = $1

      UNION ALL

      SELECT 
        'Requisición enviada' AS accion,
        req.folio AS detalle,
        req.created_at AS fecha
      FROM requisiciones req
      WHERE req.obra_id = $1

      ORDER BY fecha DESC
      LIMIT 5
    `,
      [id],
    );

    res.json({
      ok: true,
      data: {
        gastoTotal: totalReq.rows[0].total,
        totalRequisiciones: totalReq.rows[0].total,
        totalRemesas: totalRem.rows[0].total,
        insumosSolicitados: insumosSolicitados.rows[0].total,
        requisicionesEstado: reqEstados.rows,
        remesasEstado: remEstados.rows,
        actividad: actividad.rows,

        presupuestoTotal,
        requisitadoAprobado: requisitado,
        porcentajeConsumido,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error dashboard obra" });
  }
};
