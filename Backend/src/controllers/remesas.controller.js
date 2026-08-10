import { pool } from "../config/db.js";

//////////////////////////////////////////////////////////
// OBTENER REQUISICIONES AUTORIZADAS SIN REMESA
//////////////////////////////////////////////////////////
export const getRequisicionesSinRemesa = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.folio,
        o.nombre AS obra,
        r.partida,
        r.fecha,
        r.cotizacion_url,
        r.requiere_factura,
        r.forma_pago,
        r.condiciones_pago
      FROM requisiciones r
      LEFT JOIN obras o ON o.id = r.obra_id
      WHERE r.estado = 'cotizada'
      AND r.cotizacion_url IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM remesas rm 
        WHERE rm.requisicion_id = r.id
      )
      ORDER BY r.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////////
// DETALLES DE REQUISICION (PARA ELEGIR PROVEEDORES)
//////////////////////////////////////////////////////////
export const getDetallesRequisicion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
     SELECT 
  rd.id,
  rd.insumo_id,
  i.descripcion AS insumo,
  rd.cantidad,
  rd.fecha_requerida,
  ei.costo_unitario AS precio_estimado 
FROM requisicion_detalle rd
LEFT JOIN insumos i ON i.id = rd.insumo_id
LEFT JOIN insumos ei 
       ON ei.id = rd.insumo_id
WHERE rd.requisicion_id = $1
ORDER BY rd.id
    `,
      [id],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////////
// CREAR REMESAS AUTOMATICAS AGRUPADAS POR PROVEEDOR
//////////////////////////////////////////////////////////
export const generarRemesas = async (req, res) => {
  const { reqId } = req.params;
  const { detalles, usuario_id } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reqCheck = await client.query(
      "SELECT * FROM requisiciones WHERE id=$1 AND estado='cotizada'",
      [reqId],
    );

    if (reqCheck.rows.length === 0)
      return res.status(400).json({ message: "Requisición no autorizada" });

    // ✅ Sacar obra_id Y solicito_id del mismo query que ya tenemos
    const obraId = reqCheck.rows[0].obra_id;
    const solicitoId = reqCheck.rows[0].usuario_id; // quien creó la requisición

    // Agrupar detalles por proveedor
    const proveedores = {};
    detalles.forEach((d) => {
      if (!proveedores[d.proveedor_id]) proveedores[d.proveedor_id] = [];
      proveedores[d.proveedor_id].push(d);
    });

    const remesasCreadas = [];

    for (const proveedorId in proveedores) {
      const seq = await client.query("SELECT nextval('remesas_folio_seq')");
      const folio = seq.rows[0].nextval;

      // 1. Calcular monto total ANTES del INSERT
      let montoTotal = 0;
      for (const d of proveedores[proveedorId]) {
        const detalleReq = await client.query(
          "SELECT cantidad FROM requisicion_detalle WHERE id=$1",
          [d.detalle_id],
        );
        if (detalleReq.rows[0]) {
          montoTotal += detalleReq.rows[0].cantidad * d.precio;
        }
      }

      // 2. INSERT con solicito_id y elaboro_id separados
      const remesa = await client.query(
        `
        INSERT INTO remesas(
          folio,
          requisicion_id,
          obra_id,
          fecha_elaboracion,
          fecha,
          solicito_id,
          elaboro_id,
          monto_total,
          estado,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,NOW(),NOW(),$4,$5,$6,'pendiente',NOW(),NOW())
        RETURNING *
        `,
        [folio, reqId, obraId, solicitoId, usuario_id, montoTotal],
        //                               ↑ de la req  ↑ usuario logueado
      );

      const remesaId = remesa.rows[0].id;

      // 3. Insertar detalles de la remesa
      for (const d of proveedores[proveedorId]) {
        const detalleReq = await client.query(
          `
          SELECT rd.*, i.descripcion AS insumo
          FROM requisicion_detalle rd
          LEFT JOIN insumos i ON i.id = rd.insumo_id
          WHERE rd.id = $1
          `,
          [d.detalle_id],
        );

        const det = detalleReq.rows[0];
        if (!det) throw new Error(`Detalle ${d.detalle_id} no encontrado`);

        const subtotal = det.cantidad * d.precio;

        await client.query(
          `
          INSERT INTO remesa_detalles(
            remesa_id,
            requisicion_detalle_id,
            proveedor_id,
            insumo_id,
            cantidad,
            precio_unitario,
            subtotal
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          `,
          [
            remesaId,
            det.id,
            proveedorId,
            det.insumo_id,
            det.cantidad,
            d.precio,
            subtotal,
          ],
        );
      }

      remesasCreadas.push(remesa.rows[0]);
    }

    await client.query("COMMIT");
    res.json(remesasCreadas);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

//////////////////////////////////////////////////////////
// LISTAR REMESAS
//////////////////////////////////////////////////////////
export const getRemesas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        rm.id,
        rm.folio,
        rm.estado,
        rm.monto_total,
        rm.created_at,
        o.nombre AS obra,
        STRING_AGG(DISTINCT p.nombre, ', ') AS proveedor
      FROM remesas rm
      LEFT JOIN requisiciones r ON r.id = rm.requisicion_id
      LEFT JOIN obras o ON o.id = r.obra_id
      LEFT JOIN remesa_detalles rd ON rd.remesa_id = rm.id
      LEFT JOIN proveedores p ON p.id = rd.proveedor_id
      GROUP BY rm.id, rm.folio, rm.estado, rm.monto_total, rm.created_at, o.nombre
      ORDER BY rm.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////////
// DETALLE COMPLETO DE REMESA
//////////////////////////////////////////////////////////
export const getRemesa = async (req, res) => {
  try {
    const { id } = req.params;

    const remesa = await pool.query(
      `
      SELECT 
        rm.*,
        o.nombre AS obra,
        us.name AS solicito,
        ue.name AS elaboro,
        ua.name AS autorizo
      FROM remesas rm
      LEFT JOIN requisiciones r ON r.id = rm.requisicion_id
      LEFT JOIN obras o ON o.id = r.obra_id
      LEFT JOIN users us ON us.id = rm.solicito_id
      LEFT JOIN users ue ON ue.id = rm.elaboro_id
      LEFT JOIN users ua ON ua.id = rm.autorizo_id
      WHERE rm.id = $1
    `,
      [id],
    );

    const detalles = await pool.query(
      `
      SELECT 
        rd.cantidad,
        rd.precio_unitario,
        rd.subtotal,
        i.descripcion AS insumo,
        p.nombre AS proveedor,
        p.banco,
        p.clabe
      FROM remesa_detalles rd
      LEFT JOIN insumos i ON i.id = rd.insumo_id
      LEFT JOIN proveedores p ON p.id = rd.proveedor_id
      WHERE rd.remesa_id = $1
    `,
      [id],
    );

    res.json({
      remesa: remesa.rows[0],
      detalles: detalles.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////////
// AUTORIZAR REMESA
//////////////////////////////////////////////////////////
export const autorizarRemesa = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    const result = await pool.query(
      `
      UPDATE remesas
      SET estado='autorizada',
          autorizo_id=$1,
          fecha_autorizacion=NOW()
      WHERE id=$2
      RETURNING *
    `,
      [usuario_id, id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////////
// MARCAR PAGADA
//////////////////////////////////////////////////////////
export const marcarPagada = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE remesas
      SET estado='pagada'
      WHERE id=$1
      RETURNING *
    `,
      [id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////////
// MARCAR RECIBIDA (ENTRADA A ALMACEN DESPUES)
//////////////////////////////////////////////////////////
export const marcarRecibida = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE remesas
      SET estado='recibida'
      WHERE id=$1
      RETURNING *
    `,
      [id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////////
// MARCAR PENDIENTE DE PAGO (autorizada -> pendiente_pago)
//////////////////////////////////////////////////////////
export const marcarPendientePago = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { usuario_id, concepto } = req.body;

    // Traemos la remesa + proveedor + condiciones de pago de la requisición origen
    const remesaRes = await client.query(
      `
      SELECT 
        r.*,
        STRING_AGG(DISTINCT p.nombre, ', ') AS proveedor,
        MAX(rd.proveedor_id) AS proveedor_id,
        req.forma_pago AS req_forma_pago,
        req.condiciones_pago AS req_condiciones_pago,
        req.requiere_factura AS req_requiere_factura
      FROM remesas r
      LEFT JOIN remesa_detalles rd ON rd.remesa_id = r.id
      LEFT JOIN proveedores p ON p.id = rd.proveedor_id
      LEFT JOIN requisiciones req ON req.id = r.requisicion_id
      WHERE r.id = $1
      GROUP BY r.id, req.forma_pago, req.condiciones_pago, req.requiere_factura
      `,
      [id],
    );

    if (!remesaRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Remesa no encontrada" });
    }

    const remesa = remesaRes.rows[0];

    if (remesa.estado !== "autorizada") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Solo se puede marcar como pendiente de pago una remesa autorizada",
      });
    }

    // Armamos observaciones incluyendo lo que ya se capturó en la cotización
    const partesObservaciones = [
      remesa.proveedor ? `Proveedor: ${remesa.proveedor}` : null,
      remesa.req_requiere_factura !== null
        ? `Requiere factura: ${remesa.req_requiere_factura ? "Sí" : "No"}`
        : null,
      remesa.req_condiciones_pago ? `Condiciones: ${remesa.req_condiciones_pago}` : null,
    ].filter(Boolean);

    const observaciones = `Remesa marcada como pendiente de pago${
      partesObservaciones.length ? " — " + partesObservaciones.join(" | ") : ""
    }`;

    // Registramos el movimiento en estado 'pendiente', sin cuenta asignada aún,
    // heredando forma_pago desde la requisición cotizada
    const movResult = await client.query(
  `
  INSERT INTO movimientos_bancarios (
    tipo,
    cuenta_id,
    monto,
    concepto,
    fecha_movimiento,
    estado,
    observaciones,
    created_by,
    proveedor_id,
    forma_pago,
    remesa_id
  )
  VALUES ('gasto', NULL, $1, $2, NOW(), 'pendiente', $3, $4, $5, $6, $7)
  RETURNING *
  `,
  [
    remesa.monto_total,
    concepto || `Pago remesa HGZ.${remesa.folio}`,
    observaciones,
    usuario_id,
    remesa.proveedor_id,
    remesa.req_forma_pago || null,
    remesa.id, // ← nuevo
  ],
);

    const updated = await client.query(
      `
      UPDATE remesas
      SET estado = 'pendiente_pago',
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    await client.query("COMMIT");
    res.json({
      remesa: updated.rows[0],
      movimiento: movResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({
      message: "Error al marcar la remesa como pendiente de pago",
    });
  } finally {
    client.release();
  }
};