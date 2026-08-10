import { pool } from "../config/db.js";

/* ==============================
   GET TODOS
============================== */
export const getProveedores = async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM proveedores WHERE activo=true ORDER BY nombre "
  );
  res.json(result.rows);
};

/* ==============================
   CREAR
============================== */
export const createProveedor = async (req, res) => {
  try {
    const {
      nombre,
      rfc,
      telefono,
      email,
      direccion,
      banco,
      clabe,
      titular_cuenta
    } = req.body;

    const result = await pool.query(
      `INSERT INTO proveedores
      (nombre, rfc, telefono, email, direccion, banco, clabe, titular_cuenta)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [nombre, rfc, telefono, email, direccion, banco, clabe, titular_cuenta]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ==============================
   ACTUALIZAR
============================== */
export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      rfc,
      telefono,
      email,
      direccion,
      banco,
      clabe,
      titular_cuenta,
      activo
    } = req.body;

    const result = await pool.query(
      `UPDATE proveedores SET
        nombre=$1,
        rfc=$2,
        telefono=$3,
        email=$4,
        direccion=$5,
        banco=$6,
        clabe=$7,
        titular_cuenta=$8,
        activo=$9
       WHERE id=$10
       RETURNING *`,
      [nombre, rfc, telefono, email, direccion, banco, clabe, titular_cuenta, activo, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ==============================
   DELETE (SOFT DELETE)
============================== */
export const deleteProveedor = async (req, res) => {
  const { id } = req.params;

  await pool.query(
    "UPDATE proveedores SET activo=false WHERE id=$1",
    [id]
  );

  res.json({ message: "Proveedor desactivado" });
};


export const getResumenProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Total comprado: suma de remesas (montos totales) donde el proveedor participa,
    // sin duplicar si tiene varios detalles en la misma remesa
    const comprado = await pool.query(
      `
      SELECT COALESCE(SUM(monto_total), 0) AS total, COUNT(*) AS num_remesas
      FROM (
        SELECT DISTINCT r.id, r.monto_total
        FROM remesas r
        JOIN remesa_detalles rd ON rd.remesa_id = r.id
        WHERE rd.proveedor_id = $1
      ) sub
      `,
      [id]
    );

    // Total pagado de verdad: movimientos confirmados tipo gasto asociados a este
    // proveedor. Si el movimiento es a crédito, solo cuenta lo efectivamente
    // abonado — el monto total del movimiento aún no salió del banco.
    const pagado = await pool.query(
      `
      SELECT
        COALESCE(SUM(
          CASE WHEN m.forma_pago = 'credito' THEN COALESCE(ab.total_abonado, 0)
               ELSE m.monto
          END
        ), 0) AS total,
        COUNT(*) AS num_pagos
      FROM movimientos_bancarios m
      LEFT JOIN (
        SELECT movimiento_id, SUM(monto) AS total_abonado
        FROM abonos_movimientos
        GROUP BY movimiento_id
      ) ab ON ab.movimiento_id = m.id
      WHERE m.proveedor_id = $1 AND m.tipo = 'gasto' AND m.estado = 'confirmado'
      `,
      [id]
    );

    // Pagos en proceso (registrados pero aún no confirmados)
    const enProceso = await pool.query(
      `
      SELECT COALESCE(SUM(monto), 0) AS total, COUNT(*) AS num
      FROM movimientos_bancarios
      WHERE proveedor_id = $1 AND tipo = 'gasto' AND estado = 'pendiente'
      `,
      [id]
    );

    // Deuda por órdenes: remesas de este proveedor que aún no llegan a
    // 'pagada' ni 'recibida' (todavía no se ha generado/confirmado el pago)
    const deudaOrdenes = await pool.query(
      `
      SELECT COALESCE(SUM(monto_total), 0) AS total, COUNT(*) AS num_remesas
      FROM (
        SELECT DISTINCT r.id, r.monto_total
        FROM remesas r
        JOIN remesa_detalles rd ON rd.remesa_id = r.id
        WHERE rd.proveedor_id = $1
          AND r.estado NOT IN ('pagada', 'recibida')
      ) sub
      `,
      [id]
    );

    // Deuda por créditos parciales: movimientos ya confirmados (su remesa,
    // si tenía, ya se marcó 'pagada') pero a crédito y con saldo aún sin
    // abonar. Esta deuda NO aparece en deudaOrdenes porque la remesa ya
    // cambió de estado al confirmarse el movimiento, sin importar si el
    // crédito sigue abierto.
    const deudaCreditos = await pool.query(
      `
      SELECT
        COALESCE(SUM(m.monto - COALESCE(ab.total_abonado, 0)), 0) AS total,
        COUNT(*) AS num
      FROM movimientos_bancarios m
      LEFT JOIN (
        SELECT movimiento_id, SUM(monto) AS total_abonado
        FROM abonos_movimientos
        GROUP BY movimiento_id
      ) ab ON ab.movimiento_id = m.id
      WHERE m.proveedor_id = $1
        AND m.tipo = 'gasto'
        AND m.estado = 'confirmado'
        AND m.forma_pago = 'credito'
        AND (m.monto - COALESCE(ab.total_abonado, 0)) > 0.01
      `,
      [id]
    );

    // Historial de pagos (movimientos bancarios) — incluye abonado/pendiente
    // por movimiento para poder mostrar el avance de cada crédito
    const historialPagos = await pool.query(
      `
      SELECT
        m.id,
        m.monto,
        m.concepto,
        m.fecha_movimiento,
        m.fecha_confirmacion,
        m.estado,
        m.factura_uuid,
        m.forma_pago,
        m.num_cuotas,
        c.nombre AS cuenta_nombre,
        rm.folio AS remesa_folio,
        u.name AS confirmado_por,
        COALESCE(ab.total_abonado, 0) AS monto_abonado,
        CASE WHEN m.forma_pago = 'credito'
             THEN m.monto - COALESCE(ab.total_abonado, 0)
             ELSE NULL
        END AS saldo_pendiente
      FROM movimientos_bancarios m
      LEFT JOIN cuentas_bancarias c ON c.id = m.cuenta_id
      LEFT JOIN remesas rm ON rm.id = m.remesa_id
      LEFT JOIN users u ON u.id = m.confirmado_por
      LEFT JOIN (
        SELECT movimiento_id, SUM(monto) AS total_abonado
        FROM abonos_movimientos
        GROUP BY movimiento_id
      ) ab ON ab.movimiento_id = m.id
      WHERE m.proveedor_id = $1 AND m.tipo = 'gasto' AND m.estado != 'cancelado'
      ORDER BY COALESCE(m.fecha_confirmacion, m.created_at) DESC
      `,
      [id]
    );

    // Historial de órdenes de compra (remesas)
    const historialRemesas = await pool.query(
      `
      SELECT DISTINCT
        r.id,
        r.folio,
        r.monto_total,
        r.estado,
        r.created_at,
        o.nombre AS obra
      FROM remesas r
      JOIN remesa_detalles rd ON rd.remesa_id = r.id
      LEFT JOIN requisiciones req ON req.id = r.requisicion_id
      LEFT JOIN obras o ON o.id = req.obra_id
      WHERE rd.proveedor_id = $1
      ORDER BY r.created_at DESC
      `,
      [id]
    );

    const totalComprado = Number(comprado.rows[0].total);
    const totalPagado = Number(pagado.rows[0].total);
    const totalEnProceso = Number(enProceso.rows[0].total);
    const totalDeudaOrdenes = Number(deudaOrdenes.rows[0].total);
    const totalDeudaCreditos = Number(deudaCreditos.rows[0].total);
    const totalDeuda = totalDeudaOrdenes + totalDeudaCreditos;

    // Saldo a favor: si se pagó más de lo que se le ha comprado en órdenes activas
    // (caso raro, pero útil detectarlo — por ejemplo doble pago o remesa cancelada tras pagarse)
    const saldoAFavor = totalPagado > totalComprado ? totalPagado - totalComprado : 0;

    res.json({
      resumen: {
        total_comprado: totalComprado,
        num_remesas: Number(comprado.rows[0].num_remesas),
        total_pagado: totalPagado,
        num_pagos: Number(pagado.rows[0].num_pagos),
        total_en_proceso: totalEnProceso,
        num_en_proceso: Number(enProceso.rows[0].num),
        deuda_pendiente: totalDeuda,
        deuda_ordenes_pendientes: totalDeudaOrdenes,
        num_remesas_pendientes: Number(deudaOrdenes.rows[0].num_remesas),
        deuda_creditos_parciales: totalDeudaCreditos,
        num_creditos_pendientes: Number(deudaCreditos.rows[0].num),
        saldo_a_favor: saldoAFavor,
      },
      historial_pagos: historialPagos.rows,
      historial_remesas: historialRemesas.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener resumen del proveedor" });
  }
};