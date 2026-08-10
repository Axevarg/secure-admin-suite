import { pool } from "../config/db.js";
import multer from "multer";
import fs from "fs";

// ── MULTER (evidencias de movimientos) ──────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/movimientos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
  },
});
export const upload = multer({ storage });

// ── MULTER (comprobantes de abonos) ─────────────────────
const abonoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/abonos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
  },
});
export const uploadAbono = multer({ storage: abonoStorage });

// ── CUENTAS ─────────────────────────────────────────────
// Cada movimiento afecta el saldo de su propia cuenta_id según su tipo.
// Los movimientos a crédito solo aportan lo efectivamente abonado, no el
// monto total. La comisión bancaria siempre se descuenta completa e
// inmediata (no espera a los abonos), porque el banco la cobra al momento.
export const getCuentas = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.*,
        u.name AS creador,
        COALESCE(ing.total, 0) AS total_ingresos,
        COALESCE(gas.total, 0) AS total_gastos,
        COALESCE(com.total, 0) AS total_comisiones
      FROM cuentas_bancarias c
      LEFT JOIN users u ON u.id = c.created_by
      LEFT JOIN (
        SELECT m.cuenta_id,
               SUM(CASE WHEN m.forma_pago = 'credito' THEN COALESCE(ab.total_abonado, 0) ELSE m.monto END) AS total
        FROM movimientos_bancarios m
        LEFT JOIN (
          SELECT movimiento_id, SUM(monto) AS total_abonado
          FROM abonos_movimientos
          GROUP BY movimiento_id
        ) ab ON ab.movimiento_id = m.id
        WHERE m.tipo = 'ingreso' AND m.estado = 'confirmado'
        GROUP BY m.cuenta_id
      ) ing ON ing.cuenta_id = c.id
      LEFT JOIN (
        SELECT m.cuenta_id,
               SUM(CASE WHEN m.forma_pago = 'credito' THEN COALESCE(ab.total_abonado, 0) ELSE m.monto END) AS total
        FROM movimientos_bancarios m
        LEFT JOIN (
          SELECT movimiento_id, SUM(monto) AS total_abonado
          FROM abonos_movimientos
          GROUP BY movimiento_id
        ) ab ON ab.movimiento_id = m.id
        WHERE m.tipo = 'gasto' AND m.estado = 'confirmado'
        GROUP BY m.cuenta_id
      ) gas ON gas.cuenta_id = c.id
      LEFT JOIN (
        SELECT cuenta_id, SUM(monto_comision) AS total
        FROM movimientos_bancarios
        WHERE tiene_comision = true AND estado = 'confirmado'
        GROUP BY cuenta_id
      ) com ON com.cuenta_id = c.id
      ORDER BY c.created_at DESC
    `);

    const cuentas = rows.map(c => ({
      ...c,
      balance: Number(c.saldo_inicial)
            + Number(c.total_ingresos)
            - Number(c.total_gastos)
            - Number(c.total_comisiones),
    }));

    res.json(cuentas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener cuentas" });
  }
};

export const crearCuenta = async (req, res) => {
  try {
    const { nombre, banco, numero_cuenta, clabe, saldo_inicial } = req.body;
    const created_by = req.user?.id ?? null;
    const { rows } = await pool.query(
      `INSERT INTO cuentas_bancarias (nombre,banco,numero_cuenta,clabe,saldo_inicial,created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nombre, banco, numero_cuenta, clabe, saldo_inicial ?? 0, created_by]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al crear cuenta" });
  }
};

export const toggleCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE cuentas_bancarias SET activa = NOT activa, updated_at = NOW()
       WHERE id=$1 RETURNING *`, [id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
};

// ── MOVIMIENTOS ──────────────────────────────────────────
export const getMovimientos = async (req, res) => {
  try {
    const { cuenta_id, tipo, desde, hasta, categoria_id, estado, q } = req.query;

    let where = ["m.estado != 'cancelado'"];
    const params = [];
    let i = 1;

    if (cuenta_id)    { where.push(`(m.cuenta_id=$${i} OR m.cuenta_destino_id=$${i})`); params.push(cuenta_id); i++; }
    if (tipo)         { where.push(`m.tipo=$${i++}`);         params.push(tipo); }
    if (desde)        { where.push(`m.fecha_movimiento>=$${i++}`); params.push(desde); }
    if (hasta)        { where.push(`m.fecha_movimiento<=$${i++}`); params.push(hasta); }
    if (categoria_id) { where.push(`m.categoria_id=$${i++}`); params.push(categoria_id); }
    if (estado)       { where.push(`m.estado=$${i++}`);       params.push(estado); }
    if (q)            { where.push(`m.concepto ILIKE $${i++}`); params.push(`%${q}%`); }

    const { rows } = await pool.query(`
      SELECT
        m.*,
        c.nombre  AS cuenta_nombre,
        c.banco   AS cuenta_banco,
        cd.nombre AS cuenta_destino_nombre,
        cat.nombre AS categoria_nombre,
        p.nombre AS proveedor_nombre,
        u.name    AS creador,
        uc.name   AS confirmado_por_nombre,
        rm.folio  AS remesa_folio,
        COUNT(ev.id) AS num_evidencias,
        COALESCE(ab.total_abonado, 0) AS monto_abonado,
        CASE WHEN m.forma_pago = 'credito'
             THEN m.monto - COALESCE(ab.total_abonado, 0)
             ELSE NULL
        END AS saldo_pendiente
      FROM movimientos_bancarios m
      LEFT JOIN cuentas_bancarias c   ON c.id  = m.cuenta_id
      LEFT JOIN cuentas_bancarias cd  ON cd.id = m.cuenta_destino_id
      LEFT JOIN categorias_movimientos cat ON cat.id = m.categoria_id
      LEFT JOIN proveedores p ON p.id = m.proveedor_id
      LEFT JOIN users u               ON u.id  = m.created_by
      LEFT JOIN users uc              ON uc.id = m.confirmado_por
      LEFT JOIN remesas rm            ON rm.id = m.remesa_id
      LEFT JOIN evidencias_movimientos ev ON ev.movimiento_id = m.id
      LEFT JOIN (
        SELECT movimiento_id, SUM(monto) AS total_abonado
        FROM abonos_movimientos
        GROUP BY movimiento_id
      ) ab ON ab.movimiento_id = m.id
      WHERE ${where.join(" AND ")}
      GROUP BY m.id, c.nombre, c.banco, cd.nombre, cat.nombre, u.name, uc.name, p.nombre, rm.folio, ab.total_abonado
      ORDER BY COALESCE(m.fecha_confirmacion, m.created_at) DESC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener movimientos" });
  }
};

export const crearMovimiento = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      tipo,
      cuenta_id,
      cuenta_destino_id,
      monto,
      concepto,
      categoria_id,
      proveedor_id,
      fecha_movimiento,
      estado,
      observaciones,
      factura_uuid,
      forma_pago,
      num_cuotas,
      tiene_comision,
      monto_comision,
    } = req.body;
    const created_by = req.user?.id;

    if (tipo === "transferencia") {
      if (!cuenta_destino_id) throw new Error("Cuenta destino requerida");

      await client.query(
        `
        INSERT INTO movimientos_bancarios
        (tipo, cuenta_id, cuenta_destino_id, monto, concepto, categoria_id,
         fecha_movimiento, estado, observaciones, created_by,
         tiene_comision, monto_comision)
        VALUES ('gasto',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          cuenta_id, cuenta_destino_id, monto, concepto, categoria_id ?? null,
          fecha_movimiento, estado ?? "confirmado", observaciones ?? null, created_by,
          tiene_comision ?? false, tiene_comision ? monto_comision ?? 0 : null,
        ]
      );

      const { rows } = await client.query(
        `
        INSERT INTO movimientos_bancarios
        (tipo, cuenta_id, cuenta_destino_id, monto, concepto, categoria_id,
         fecha_movimiento, estado, observaciones, created_by)
        VALUES ('ingreso',$1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
        `,
        [
          cuenta_destino_id, cuenta_id, monto, concepto, categoria_id ?? null,
          fecha_movimiento, estado ?? "confirmado", observaciones ?? null, created_by,
        ]
      );

      await client.query("COMMIT");
      return res.json(rows[0]);
    }

    // Validación: num_cuotas solo tiene sentido si forma_pago = credito
    const cuotasFinal = forma_pago === "credito" ? (num_cuotas || null) : null;

    const { rows } = await client.query(
      `INSERT INTO movimientos_bancarios
       (tipo, cuenta_id, cuenta_destino_id, monto, concepto, categoria_id,
        proveedor_id, fecha_movimiento, estado, observaciones, created_by,
        factura_uuid, forma_pago, num_cuotas, tiene_comision, monto_comision)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        tipo, cuenta_id, cuenta_destino_id ?? null, monto, concepto, categoria_id ?? null,
        proveedor_id ?? null, fecha_movimiento, estado ?? "confirmado", observaciones ?? null, created_by,
        factura_uuid || null, forma_pago || null, cuotasFinal,
        tiene_comision ?? false, tiene_comision ? monto_comision ?? 0 : null,
      ]
    );

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error al crear movimiento" });
  } finally {
    client.release();
  }
};

export const cancelarMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE movimientos_bancarios SET estado='cancelado', updated_at=NOW()
       WHERE id=$1 RETURNING *`, [id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: "Error al cancelar" });
  }
};

// ── DASHBOARD ────────────────────────────────────────────
// ← La comisión bancaria ahora cuenta como gasto: se suma a gastos_mes,
// total_gastos y se descuenta de dinero_en_bancos, igual que en getCuentas.
export const getDashboard = async (req, res) => {
  try {
    const [cuentas, mesActual, historico] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) FILTER (WHERE activa) AS cuentas_activas,
               COALESCE(SUM(saldo_inicial), 0) AS suma_saldos_iniciales
        FROM cuentas_bancarias
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto END),0) AS ingresos_mes,
          COALESCE(SUM(CASE WHEN tipo='gasto'   THEN monto END),0) AS gastos_mes_base,
          COALESCE(SUM(CASE WHEN tiene_comision THEN monto_comision END),0) AS comisiones_mes
        FROM movimientos_bancarios
        WHERE estado = 'confirmado' 
          AND date_trunc('month', fecha_movimiento) = date_trunc('month', CURRENT_DATE)
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto END),0) AS total_ingresos,
          COALESCE(SUM(CASE WHEN tipo='gasto'   THEN monto END),0) AS total_gastos_base,
          COALESCE(SUM(CASE WHEN tiene_comision THEN monto_comision END),0) AS total_comisiones
        FROM movimientos_bancarios
        WHERE estado = 'confirmado'
      `),
    ]);

    const saldosIniciales = Number(cuentas.rows[0].suma_saldos_iniciales);

    const gastosMes = Number(mesActual.rows[0].gastos_mes_base) + Number(mesActual.rows[0].comisiones_mes);
    const totalGastos = Number(historico.rows[0].total_gastos_base) + Number(historico.rows[0].total_comisiones);

    res.json({
      cuentas_activas: Number(cuentas.rows[0].cuentas_activas),
      ingresos_mes:    Number(mesActual.rows[0].ingresos_mes),
      gastos_mes:      gastosMes,
      balance_mes:     Number(mesActual.rows[0].ingresos_mes) - gastosMes,
      total_ingresos:  Number(historico.rows[0].total_ingresos),
      total_gastos:    totalGastos,
      dinero_en_bancos: saldosIniciales
                      + Number(historico.rows[0].total_ingresos)
                      - totalGastos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error dashboard" });
  }
};

// ── EVIDENCIAS (movimientos) ─────────────────────────────
export const getEvidenciasMovimiento = async (req, res) => {
  try {
    const { movimientoId } = req.params;
    const { rows } = await pool.query(
      `SELECT e.*, u.name AS subido_por
       FROM evidencias_movimientos e
       LEFT JOIN users u ON u.id = e.uploaded_by
       WHERE e.movimiento_id = $1 ORDER BY e.created_at DESC`,
      [movimientoId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
};

export const subirEvidenciaMovimiento = async (req, res) => {
  try {
    const { movimiento_id } = req.body;
    const uploaded_by = req.user?.id ?? null;
    if (!req.files?.length) return res.status(400).json({ msg: "Sin archivos" });

    const insertados = [];
    for (const file of req.files) {
      const tipo = file.mimetype.includes("pdf") ? "pdf"
                 : file.mimetype.includes("xml") ? "xml" : "foto";
      const url = `/uploads/movimientos/${file.filename}`;
      const { rows } = await pool.query(
        `INSERT INTO evidencias_movimientos (movimiento_id,file_url,file_name,tipo,uploaded_by)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [movimiento_id, url, file.originalname, tipo, uploaded_by]
      );
      insertados.push(rows[0]);
    }
    res.json(insertados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al subir" });
  }
};

export const getCategorias = async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categorias_movimientos ORDER BY tipo, nombre");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
};

export const getProveedores = async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM proveedores WHERE activo=true ORDER BY nombre"
  );
  res.json(result.rows);
};

export const actualizarMovimiento = async (req, res) => {
  try {
    const { id } = req.params;

    const actual = await pool.query(
      `SELECT estado, monto, remesa_id FROM movimientos_bancarios WHERE id=$1`,
      [id]
    );

    if (!actual.rows.length) {
      return res.status(404).json({ msg: "Movimiento no encontrado" });
    }

    if (actual.rows[0].estado !== "pendiente") {
      return res.status(400).json({ msg: "Solo los movimientos pendientes pueden editarse" });
    }

    const {
      concepto,
      monto,
      categoria_id,
      proveedor_id,
      observaciones,
      fecha_movimiento,
      cuenta_id,
      forma_pago,
      num_cuotas,
      tiene_comision,
      monto_comision,
    } = req.body;

    const esDeRemesa = !!actual.rows[0].remesa_id;
    const montoFinal = esDeRemesa ? actual.rows[0].monto : monto;

    const cuotasFinal = forma_pago === "credito" ? (num_cuotas || null) : null;

    const { rows } = await pool.query(
      `
      UPDATE movimientos_bancarios
      SET
        concepto=$1,
        monto=$2,
        categoria_id=$3,
        proveedor_id=$4,
        observaciones=$5,
        fecha_movimiento=$6,
        cuenta_id=$7,
        forma_pago=$8,
        num_cuotas=$9,
        tiene_comision=$10,
        monto_comision=$11,
        updated_at=NOW()
      WHERE id=$12
      RETURNING *
      `,
      [
        concepto, montoFinal, categoria_id || null, proveedor_id || null, observaciones, fecha_movimiento,
        cuenta_id || null, forma_pago || null, cuotasFinal,
        tiene_comision ?? false, tiene_comision ? monto_comision ?? 0 : null,
        id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al actualizar movimiento" });
  }
};

export const confirmarMovimiento = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const confirmado_por = req.user?.id ?? null;

    const actual = await client.query(
      "SELECT estado, cuenta_id, remesa_id FROM movimientos_bancarios WHERE id=$1",
      [id]
    );

    if (!actual.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "No encontrado" });
    }

    if (actual.rows[0].estado !== "pendiente") {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Solo se pueden confirmar movimientos pendientes" });
    }

    if (!actual.rows[0].cuenta_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Debes asignar una cuenta bancaria antes de confirmar" });
    }

    const { rows } = await client.query(
      `UPDATE movimientos_bancarios
       SET estado='confirmado', fecha_confirmacion=NOW(), confirmado_por=$2, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, confirmado_por]
    );

    const remesaId = actual.rows[0].remesa_id;
    if (remesaId) {
      await client.query(
        `UPDATE remesas
         SET estado='pagada', updated_at=NOW()
         WHERE id=$1 AND estado='pendiente_pago'`,
        [remesaId]
      );
    }

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error al confirmar" });
  } finally {
    client.release();
  }
};

export const actualizarFacturaUuid = async (req, res) => {
  try {
    const { id } = req.params;
    const { factura_uuid } = req.body;

    const actual = await pool.query(
      `SELECT estado FROM movimientos_bancarios WHERE id=$1`,
      [id]
    );

    if (!actual.rows.length) {
      return res.status(404).json({ msg: "Movimiento no encontrado" });
    }

    if (actual.rows[0].estado !== "confirmado") {
      return res.status(400).json({
        msg: "El UUID de factura solo puede agregarse una vez que el pago esté confirmado",
      });
    }

    const { rows } = await pool.query(
      `UPDATE movimientos_bancarios
       SET factura_uuid=$1, updated_at=NOW()
       WHERE id=$2
       RETURNING *`,
      [factura_uuid || null, id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al actualizar UUID de factura" });
  }
};

// ── ABONOS (pagos parciales a crédito) ───────────────────
export const getAbonosMovimiento = async (req, res) => {
  try {
    const { movimientoId } = req.params;
    const { rows } = await pool.query(
      `SELECT a.*, u.name AS registrado_por,
              COUNT(e.id) AS num_evidencias
       FROM abonos_movimientos a
       LEFT JOIN users u ON u.id = a.created_by
       LEFT JOIN evidencias_abonos e ON e.abono_id = a.id
       WHERE a.movimiento_id = $1
       GROUP BY a.id, u.name
       ORDER BY a.fecha_abono DESC, a.created_at DESC`,
      [movimientoId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener abonos" });
  }
};

export const crearAbono = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { movimientoId } = req.params;
    const { monto, fecha_abono, observaciones } = req.body;
    const created_by = req.user?.id ?? null;

    const actual = await client.query(
      `SELECT monto, forma_pago, estado,
              COALESCE((SELECT SUM(monto) FROM abonos_movimientos WHERE movimiento_id=$1), 0) AS abonado
       FROM movimientos_bancarios WHERE id=$1`,
      [movimientoId]
    );

    if (!actual.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Movimiento no encontrado" });
    }

    const mov = actual.rows[0];

    if (mov.forma_pago !== "credito") {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Solo los movimientos a crédito reciben abonos" });
    }

    if (mov.estado !== "confirmado") {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "El movimiento debe estar confirmado antes de registrar abonos" });
    }

    const montoAbono = Number(monto);
    if (!montoAbono || montoAbono <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Monto de abono inválido" });
    }

    const saldoPendiente = Number(mov.monto) - Number(mov.abonado);
    if (montoAbono > saldoPendiente + 0.01) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: `El abono excede el saldo pendiente ($${saldoPendiente.toFixed(2)})` });
    }

    const { rows } = await client.query(
      `INSERT INTO abonos_movimientos (movimiento_id, monto, fecha_abono, observaciones, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [movimientoId, montoAbono, fecha_abono || new Date().toISOString().split("T")[0], observaciones || null, created_by]
    );

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error al registrar abono" });
  } finally {
    client.release();
  }
};

export const eliminarAbono = async (req, res) => {
  try {
    const { abonoId } = req.params;
    await pool.query(`DELETE FROM abonos_movimientos WHERE id=$1`, [abonoId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al eliminar abono" });
  }
};

export const getEvidenciasAbono = async (req, res) => {
  try {
    const { abonoId } = req.params;
    const { rows } = await pool.query(
      `SELECT e.*, u.name AS subido_por
       FROM evidencias_abonos e
       LEFT JOIN users u ON u.id = e.uploaded_by
       WHERE e.abono_id = $1 ORDER BY e.created_at DESC`,
      [abonoId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
};

export const subirEvidenciaAbono = async (req, res) => {
  try {
    const { abono_id } = req.body;
    const uploaded_by = req.user?.id ?? null;
    if (!req.files?.length) return res.status(400).json({ msg: "Sin archivos" });

    const insertados = [];
    for (const file of req.files) {
      const tipo = file.mimetype.includes("pdf") ? "pdf"
                 : file.mimetype.includes("xml") ? "xml" : "foto";
      const url = `/uploads/abonos/${file.filename}`;
      const { rows } = await pool.query(
        `INSERT INTO evidencias_abonos (abono_id,file_url,file_name,tipo,uploaded_by)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [abono_id, url, file.originalname, tipo, uploaded_by]
      );
      insertados.push(rows[0]);
    }
    res.json(insertados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al subir" });
  }
};