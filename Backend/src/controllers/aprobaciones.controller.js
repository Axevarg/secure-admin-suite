import { pool } from "../config/db.js";

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
   🟢 GET REQUISICIONES APROBADAS
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