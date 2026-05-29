import { pool } from "../config/db.js";
import multer from "multer";
import fs from "fs";

// ── MULTER ──────────────────────────────────────────────
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

// ── CUENTAS ─────────────────────────────────────────────
export const getCuentas = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.*,
        u.name AS creador,
        COALESCE(SUM(CASE WHEN m.tipo='ingreso'      AND m.estado!='cancelado' THEN m.monto ELSE 0 END), 0) AS total_ingresos,
        COALESCE(SUM(CASE WHEN m.tipo='gasto'        AND m.estado!='cancelado' THEN m.monto ELSE 0 END), 0) AS total_gastos,
        COALESCE(SUM(CASE WHEN m.tipo='transferencia' AND m.cuenta_id=c.id     AND m.estado!='cancelado' THEN m.monto ELSE 0 END), 0) AS total_salidas_transferencia,
        COALESCE(SUM(CASE WHEN m.tipo='transferencia' AND m.cuenta_destino_id=c.id AND m.estado!='cancelado' THEN m.monto ELSE 0 END), 0) AS total_entradas_transferencia
      FROM cuentas_bancarias c
      LEFT JOIN users u ON u.id = c.created_by
      LEFT JOIN movimientos_bancarios m ON m.cuenta_id = c.id OR m.cuenta_destino_id = c.id
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `);

    // Calcular balance en JS para claridad
    const cuentas = rows.map(c => ({
      ...c,
      balance: Number(c.saldo_inicial)
            + Number(c.total_ingresos)
            + Number(c.total_entradas_transferencia)
            - Number(c.total_gastos)
            - Number(c.total_salidas_transferencia),
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
        cd.nombre AS cuenta_destino_nombre,
        cat.nombre AS categoria_nombre,
        u.name    AS creador,
        COUNT(ev.id) AS num_evidencias
      FROM movimientos_bancarios m
      LEFT JOIN cuentas_bancarias c   ON c.id  = m.cuenta_id
      LEFT JOIN cuentas_bancarias cd  ON cd.id = m.cuenta_destino_id
      LEFT JOIN categorias_movimientos cat ON cat.id = m.categoria_id
      LEFT JOIN users u               ON u.id  = m.created_by
      LEFT JOIN evidencias_movimientos ev ON ev.movimiento_id = m.id
      WHERE ${where.join(" AND ")}
      GROUP BY m.id, c.nombre, cd.nombre, cat.nombre, u.name
      ORDER BY m.fecha_movimiento DESC, m.created_at DESC
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
  fecha_movimiento,
  estado,
  observaciones,
} = req.body;

const created_by = req.user?.id;

    // ─────────────────────────────────────────
    // TRANSFERENCIA
    // ─────────────────────────────────────────
    if (tipo === "transferencia") {

      if (!cuenta_destino_id) {
        throw new Error("Cuenta destino requerida");
      }

      // 👇 SALE dinero de la cuenta origen
      await client.query(
        `
        INSERT INTO movimientos_bancarios
        (
          tipo,
          cuenta_id,
          cuenta_destino_id,
          monto,
          concepto,
          categoria_id,
          fecha_movimiento,
          estado,
          observaciones,
          created_by
        )
        VALUES
        ('gasto',$1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
        [
          cuenta_id,
          cuenta_destino_id,
          monto,
          concepto,
          categoria_id ?? null,
          fecha_movimiento,
          estado ?? "confirmado",
          observaciones ?? null,
          created_by,
        ]
      );

      // 👇 ENTRA dinero a la cuenta destino
      const { rows } = await client.query(
        `
        INSERT INTO movimientos_bancarios
        (
          tipo,
          cuenta_id,
          cuenta_destino_id,
          monto,
          concepto,
          categoria_id,
          fecha_movimiento,
          estado,
          observaciones,
          created_by
        )
        VALUES
        ('ingreso',$1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
        `,
        [
          cuenta_destino_id,
          cuenta_id,
          monto,
          concepto,
          categoria_id ?? null,
          fecha_movimiento,
          estado ?? "confirmado",
          observaciones ?? null,
          created_by,
        ]
      );

      await client.query("COMMIT");

      return res.json(rows[0]);
    }

    // ─────────────────────────────────────────
    // INGRESO / GASTO NORMAL
    // ─────────────────────────────────────────
    const { rows } = await client.query(
      `
      INSERT INTO movimientos_bancarios
      (
        tipo,
        cuenta_id,
        cuenta_destino_id,
        monto,
        concepto,
        categoria_id,
        fecha_movimiento,
        estado,
        observaciones,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        tipo,
        cuenta_id,
        cuenta_destino_id ?? null,
        monto,
        concepto,
        categoria_id ?? null,
        fecha_movimiento,
        estado ?? "confirmado",
        observaciones ?? null,
        created_by,
      ]
    );

    await client.query("COMMIT");

    res.json(rows[0]);

  } catch (err) {

    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      msg: "Error al crear movimiento",
    });

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
          COALESCE(SUM(CASE WHEN tipo='gasto'   THEN monto END),0) AS gastos_mes
        FROM movimientos_bancarios
        WHERE estado != 'cancelado'
          AND date_trunc('month', fecha_movimiento) = date_trunc('month', CURRENT_DATE)
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto END),0) AS total_ingresos,
          COALESCE(SUM(CASE WHEN tipo='gasto'   THEN monto END),0) AS total_gastos
        FROM movimientos_bancarios
        WHERE estado != 'cancelado'
      `),
    ]);

    // ← suma los saldos iniciales de todas las cuentas al balance total
    const saldosIniciales = Number(cuentas.rows[0].suma_saldos_iniciales);

    res.json({
      cuentas_activas: Number(cuentas.rows[0].cuentas_activas),
      ingresos_mes:    Number(mesActual.rows[0].ingresos_mes),
      gastos_mes:      Number(mesActual.rows[0].gastos_mes),
      balance_mes:     Number(mesActual.rows[0].ingresos_mes) - Number(mesActual.rows[0].gastos_mes),
      total_ingresos:  Number(historico.rows[0].total_ingresos),
      total_gastos:    Number(historico.rows[0].total_gastos),
      // ↓ ahora sí incluye el dinero inicial
      dinero_en_bancos: saldosIniciales
                      + Number(historico.rows[0].total_ingresos)
                      - Number(historico.rows[0].total_gastos),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error dashboard" });
  }
};

// ── EVIDENCIAS ───────────────────────────────────────────
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