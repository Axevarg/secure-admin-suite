import { pool } from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================
   CONFIG MULTER - COTIZACIONES
========================================= */
const COTIZACIONES_DIR = path.join(__dirname, "..", "..", "uploads", "cotizaciones");
if (!fs.existsSync(COTIZACIONES_DIR)) {
  fs.mkdirSync(COTIZACIONES_DIR, { recursive: true });
}

const cotizacionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COTIZACIONES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitizamos: nada del nombre original entra al filename final, solo id + timestamp
    const safeName = `cotizacion_${req.params.id}_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png"];

export const uploadCotizacion = multer({
  storage: cotizacionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(new Error("Formato no permitido. Solo se aceptan PDF, JPG o PNG."));
    }
    cb(null, true);
  },
}).single("cotizacion");

/* =========================================
   GET REQUISICIONES PENDIENTES (ENVIADAS)
========================================= */
export const getRequisicionesPendientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.folio,
        r.partida,
        r.estado,
        r.created_at AS fecha_envio,
        o.nombre AS obra,
        u.name AS solicitado_por
      FROM requisiciones r
      LEFT JOIN obras o ON o.id = r.obra_id
      LEFT JOIN users u ON u.id = r.usuario_id
      WHERE r.estado = 'enviada'
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   🟢 GET REQUISICIONES APROBADAS (autorizadas, aún sin cotizar)
========================================= */
export const getRequisicionesAprobadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.folio,
        r.partida,
        r.estado,
        r.created_at AS fecha_envio,
        r.cotizacion_url,
        r.cotizacion_subida_at,
        o.nombre AS obra,
        u.name AS solicitado_por
      FROM requisiciones r
      LEFT JOIN obras o ON o.id = r.obra_id
      LEFT JOIN users u ON u.id = r.usuario_id
      WHERE r.estado = 'autorizada'
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   🧾 GET REQUISICIONES COTIZADAS
========================================= */
export const getRequisicionesCotizadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.folio,
        r.partida,
        r.estado,
        r.created_at AS fecha_envio,
        r.cotizacion_url,
        r.cotizacion_subida_at,
        r.requiere_factura,
        r.forma_pago,
        r.condiciones_pago,
        o.nombre AS obra,
        u.name AS solicitado_por
      FROM requisiciones r
      LEFT JOIN obras o ON o.id = r.obra_id
      LEFT JOIN users u ON u.id = r.usuario_id
      WHERE r.estado = 'cotizada'
      ORDER BY r.cotizacion_subida_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   🔴 GET REQUISICIONES RECHAZADAS
========================================= */
export const getRequisicionesRechazadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.folio,
        r.partida,
        r.estado,
        r.motivo_rechazo,
        r.created_at AS fecha_envio,
        o.nombre AS obra,
        u.name AS solicitado_por
      FROM requisiciones r
      LEFT JOIN obras o ON o.id = r.obra_id
      LEFT JOIN users u ON u.id = r.usuario_id
      WHERE r.estado = 'rechazada'
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   GET DETALLE PARA MODAL
   (usa r.* asi que ya trae cotizacion_url, requiere_factura, forma_pago, etc.)
========================================= */
export const getRequisicionParaAprobacion = async (req, res) => {
  try {
    const { id } = req.params;

    const requisicion = await pool.query(`
      SELECT 
        r.*,
        r.created_at AS fecha_envio,
        o.nombre AS obra,
        u.name AS solicitado_por
      FROM requisiciones r
      LEFT JOIN obras o ON o.id = r.obra_id
      LEFT JOIN users u ON u.id = r.usuario_id
      WHERE r.id = $1
    `, [id]);

    const detalles = await pool.query(`
      SELECT 
        rd.id,
        rd.cantidad,
        rd.fecha_requerida,
        i.descripcion,
        i.unidad
      FROM requisicion_detalle rd
      LEFT JOIN insumos i ON i.id = rd.insumo_id
      WHERE rd.requisicion_id = $1
    `, [id]);

    res.json({
      requisicion: requisicion.rows[0],
      detalles: detalles.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================
   AUTORIZAR
========================================= */
export const autorizarRequisicion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE requisiciones
       SET estado='autorizada'
       WHERE id=$1
       RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Requisición no encontrada" });
    }

    await client.query(
      `INSERT INTO aprobaciones_requisiciones
       (requisicion_id, usuario_id, accion, comentario)
       VALUES ($1,$2,'autorizada','Requisición autorizada')`,
      [id, usuarioId]
    );

    await client.query("COMMIT");
    res.json({ message: "Requisición autorizada" });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

/* =========================================
   RECHAZAR
========================================= */
export const rechazarRequisicion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioId = req.user.id;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE requisiciones
       SET estado='rechazada', motivo_rechazo=$2
       WHERE id=$1
       RETURNING *`,
      [id, motivo]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Requisición no encontrada" });
    }

    await client.query(
      `INSERT INTO aprobaciones_requisiciones
       (requisicion_id, usuario_id, accion, comentario)
       VALUES ($1,$2,'rechazada',$3)`,
      [id, usuarioId, motivo]
    );

    await client.query("COMMIT");
    res.json({ message: "Requisición rechazada" });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

/* =========================================
   🧾 COTIZAR (autorizada -> cotizada)
   También sirve para EDITAR una cotización ya existente
   (si la requisición ya está en estado 'cotizada', el archivo es opcional:
   si no se manda uno nuevo, se conserva el que ya había).
   Nota: esta función va DESPUÉS de que multer (uploadCotizacion)
   ya corrió como middleware en la ruta, dejando el archivo (si vino) en req.file
========================================= */
export const cotizarRequisicion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const { requiere_factura, forma_pago, condiciones_pago } = req.body;

    if (forma_pago !== "contado" && forma_pago !== "credito") {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: "forma_pago debe ser 'contado' o 'credito'" });
    }

    if (requiere_factura !== "true" && requiere_factura !== "false") {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: "requiere_factura debe ser 'true' o 'false'" });
    }

    const existente = await client.query(
      `SELECT estado, cotizacion_url FROM requisiciones WHERE id = $1`,
      [id]
    );

    if (!existente.rows.length) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: "Requisición no encontrada" });
    }

    const estadoActual = existente.rows[0].estado;
    const esEdicion = estadoActual === "cotizada";

    if (estadoActual !== "autorizada" && !esEdicion) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        message: "Solo se puede cotizar una requisición autorizada",
      });
    }

    if (!esEdicion && !req.file) {
      return res.status(400).json({ message: "Debes adjuntar el archivo de cotización" });
    }

    const cotizacionAnterior = existente.rows[0].cotizacion_url;
    const cotizacionUrl = req.file
      ? `/uploads/cotizaciones/${req.file.filename}`
      : cotizacionAnterior;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE requisiciones
       SET estado = 'cotizada',
           cotizacion_url = $2,
           cotizacion_subida_at = COALESCE($3, cotizacion_subida_at),
           requiere_factura = $4,
           forma_pago = $5,
           condiciones_pago = $6
       WHERE id = $1
       RETURNING *`,
      [
        id,
        cotizacionUrl,
        req.file ? new Date() : null,
        requiere_factura === "true",
        forma_pago,
        condiciones_pago || null,
      ]
    );

    await client.query(
      `INSERT INTO aprobaciones_requisiciones
       (requisicion_id, usuario_id, accion, comentario)
       VALUES ($1,$2,$3,$4)`,
      [
        id,
        usuarioId,
        esEdicion ? "cotizacion_actualizada" : "cotizada",
        `Factura: ${requiere_factura === "true" ? "Sí" : "No"} | Pago: ${
          forma_pago === "contado" ? "Contado" : "Crédito"
        }${condiciones_pago ? " - " + condiciones_pago : ""}`,
      ]
    );

    await client.query("COMMIT");

    // Si se subió un archivo nuevo y ya había uno previo, borramos el viejo (best-effort)
    if (req.file && cotizacionAnterior) {
      const rutaAnterior = path.join(__dirname, "..", "..", cotizacionAnterior.replace(/^\//, ""));
      fs.unlink(rutaAnterior, () => {});
    }

    res.json({
      message: esEdicion ? "Cotización actualizada" : "Requisición cotizada correctamente",
      requisicion: result.rows[0],
    });

  } catch (err) {
    await client.query("ROLLBACK");
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

/* =========================================
   HISTORIAL
========================================= */
export const getHistorialRequisicion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        a.id,
        a.accion,
        a.comentario,
        a.created_at,
        u.name as usuario
      FROM aprobaciones_requisiciones a
      LEFT JOIN users u ON u.id = a.usuario_id
      WHERE requisicion_id = $1
      ORDER BY a.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};