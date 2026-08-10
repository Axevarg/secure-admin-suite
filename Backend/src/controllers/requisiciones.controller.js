import { pool } from "../config/db.js";

/* =====================================================
   🔥 VALIDAR STOCK DISPONIBLE POR OBRA
   Solo aplica a renglones tipo="insumo".
   Los renglones tipo="indirecto" no tienen stock fijo:
   solo verificamos que el concepto exista en la obra.
===================================================== */
const validarStockDisponible = async (client, obraId, detalles) => {
  const renglonesInsumo = detalles.filter((d) => d.tipo !== "indirecto");
  const renglonesIndirecto = detalles.filter((d) => d.tipo === "indirecto");

  for (const item of renglonesInsumo) {
    const stock = await client.query(
      `
      SELECT
        i.descripcion,

        i.cantidad AS presupuesto,

        COALESCE(SUM(DISTINCT io.cantidad),0) AS extras,

        COALESCE(SUM(rd.cantidad),0) AS consumido,

        (i.cantidad 
          + COALESCE(SUM(DISTINCT io.cantidad),0) 
          - COALESCE(SUM(rd.cantidad),0)
        ) AS disponible

      FROM insumos i

      /* 🔥 EXTRAS */
      LEFT JOIN inventario_obra io 
        ON io.insumo_id = i.id 
        AND io.obra_id = i.obra_id

      /* 🔥 CONSUMOS */
      LEFT JOIN requisicion_detalle rd 
        ON rd.insumo_id = i.id

      LEFT JOIN requisiciones r 
        ON r.id = rd.requisicion_id
        AND (r.estado IS NULL OR r.estado != 'rechazada')

      WHERE i.id = $1
      AND i.obra_id = $2

      GROUP BY i.descripcion, i.cantidad
    `,
      [item.item_id, obraId],
    );

    if (stock.rows.length === 0)
      throw new Error("Insumo no encontrado en la obra");

    const disponible = Number(stock.rows[0].disponible);
    const descripcion = stock.rows[0].descripcion;

    if (item.cantidad > disponible) {
      throw new Error(
        `Stock insuficiente de "${descripcion}". Disponible: ${disponible}`,
      );
    }
  }

  for (const item of renglonesIndirecto) {
    const check = await client.query(
      `SELECT id FROM indirectos_obra WHERE id = $1 AND obra_id = $2`,
      [item.item_id, obraId],
    );
    if (check.rows.length === 0)
      throw new Error("El concepto de indirecto no existe en esta obra");
  }
};

/* =====================================================
   LISTAR REQUISICIONES POR OBRA
===================================================== */
export const getRequisicionesObra = async (req, res) => {
  try {
    const { obraId } = req.params;
    const usuario_id = req.user.id; // 👈 usuario logueado

    const result = await pool.query(
      `
      SELECT 
        r.id,
        r.folio,
        r.partida,
        r.estado,
        r.created_at,
        r.motivo_rechazo,
        u.name AS solicitante
      FROM requisiciones r
      LEFT JOIN users u ON u.id = r.usuario_id
      WHERE r.obra_id = $1
      AND r.usuario_id = $2   -- 🔥 FILTRO NUEVO
      ORDER BY r.id DESC
      `,
      [obraId, usuario_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   CREAR REQUISICION + DETALLES
   detalles: [{ tipo: "insumo"|"indirecto", item_id, cantidad, fecha_requerida }]
===================================================== */
export const crearRequisicion = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { obraId } = req.params;
    const { partida, detalles } = req.body;
    const usuario_id = req.user.id;

    if (!partida) throw new Error("La partida es obligatoria");
    if (!detalles || detalles.length === 0)
      throw new Error("Debe agregar al menos un insumo");

    /* NORMALIZAR TIPO (por compatibilidad con payloads viejos que mandaban insumo_id) */
    const detallesNorm = detalles.map((d) => ({
      tipo: d.tipo === "indirecto" ? "indirecto" : "insumo",
      item_id: d.item_id ?? d.insumo_id,
      cantidad: d.cantidad,
      fecha_requerida: d.fecha_requerida || null,
    }));

    /* VALIDAR DUPLICADOS (por tipo + id, un mismo id puede repetirse entre tablas distintas) */
    const claves = detallesNorm.map((d) => `${d.tipo}:${d.item_id}`);
    if (claves.length !== new Set(claves).size)
      throw new Error("No puedes repetir insumos");

    /* GENERAR FOLIO SEGURO */
    const seq = await client.query(`
      SELECT nextval('requisiciones_id_seq') as numero
    `);

    const numero = seq.rows[0].numero;
    const folio = `REQ-${numero}`;

    /* CREAR REQUISICION */
    const reqResult = await client.query(
      `
      INSERT INTO requisiciones
      (id, folio, obra_id, usuario_id, partida, estado)
      VALUES ($1,$2,$3,$4,$5,'borrador')
      RETURNING id
    `,
      [numero, folio, obraId, usuario_id, partida],
    );

    const requisicionId = reqResult.rows[0].id;

    /* 🔥 VALIDAR PRESUPUESTO / EXISTENCIA */
    await validarStockDisponible(client, obraId, detallesNorm);

    /* INSERTAR DETALLES */
    for (const item of detallesNorm) {
      await client.query(
        `
        INSERT INTO requisicion_detalle
        (requisicion_id, insumo_id, indirecto_id, tipo, cantidad, fecha_requerida)
        VALUES ($1,$2,$3,$4,$5,$6)
      `,
        [
          requisicionId,
          item.tipo === "insumo" ? item.item_id : null,
          item.tipo === "indirecto" ? item.item_id : null,
          item.tipo,
          item.cantidad,
          item.fecha_requerida,
        ],
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Requisición creada correctamente",
      folio,
      requisicionId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

/* =====================================================
   OBTENER DETALLE DE REQUISICION
===================================================== */
export const getDetalleRequisicion = async (req, res) => {
  try {
    const { id } = req.params;

    const reqResult = await pool.query(
      `
      SELECT 
        r.id,
        r.folio,
        r.partida,
        LOWER(r.estado) AS estado,
        r.created_at,
        u.name AS solicitante
      FROM requisiciones r
      LEFT JOIN users u ON u.id = r.usuario_id
      WHERE r.id = $1
    `,
      [id],
    );

    const detResult = await pool.query(
      `
      SELECT 
        d.id,
        d.cantidad,
        d.fecha_requerida,
        d.tipo,
        d.insumo_id,
        d.indirecto_id,
        COALESCE(i.descripcion, ind.nombre) AS descripcion,
        COALESCE(i.unidad, ind.unidad) AS unidad,

        i.cantidad AS presupuesto,

        COALESCE((
          SELECT SUM(io.cantidad)
          FROM inventario_obra io
          WHERE io.insumo_id = i.id
          AND io.obra_id = r.obra_id
        ),0) AS extras

      FROM requisicion_detalle d
      LEFT JOIN insumos i ON i.id = d.insumo_id
      LEFT JOIN indirectos_obra ind ON ind.id = d.indirecto_id
      JOIN requisiciones r ON r.id = d.requisicion_id

      WHERE d.requisicion_id = $1
    `,
      [id],
    );

    res.json({
      requisicion: reqResult.rows[0],
      detalles: detResult.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */
export const cambiarEstadoReq = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (estado === "enviada") {
      await pool.query(
        `
        UPDATE requisiciones 
        SET 
          estado = 'enviada',
          motivo_rechazo = NULL,
          created_at = NOW()
        WHERE id = $1
      `,
        [id],
      );
    } else {
      await pool.query("UPDATE requisiciones SET estado=$1 WHERE id=$2", [
        estado,
        id,
      ]);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   EDITAR REQUISICION (SOLO BORRADOR)
===================================================== */
export const editarRequisicion = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { partida, detalles } = req.body;

    const check = await client.query(
      "SELECT estado, obra_id FROM requisiciones WHERE id=$1",
      [id],
    );

    if (!check.rows[0]) throw new Error("Requisición no encontrada");
    const estadoActual = check.rows[0].estado;

    if (estadoActual !== "borrador" && estadoActual !== "rechazada")
      throw new Error(
        "Solo puedes editar requisiciones en borrador o rechazadas",
      );

    const obraId = check.rows[0].obra_id;

    if (partida) {
      await client.query("UPDATE requisiciones SET partida=$1 WHERE id=$2", [
        partida,
        id,
      ]);
    }

    if (detalles && detalles.length > 0) {
      const detallesNorm = detalles.map((d) => ({
        tipo: d.tipo === "indirecto" ? "indirecto" : "insumo",
        item_id: d.item_id ?? d.insumo_id,
        cantidad: d.cantidad,
        fecha_requerida: d.fecha_requerida || null,
      }));

      /* VALIDAR DUPLICADOS */
      const claves = detallesNorm.map((d) => `${d.tipo}:${d.item_id}`);
      if (claves.length !== new Set(claves).size)
        throw new Error("No puedes repetir insumos");

      /* 🔥 VALIDAR PRESUPUESTO / EXISTENCIA */
      await validarStockDisponible(client, obraId, detallesNorm);

      /* REEMPLAZAR DETALLES */
      await client.query(
        "DELETE FROM requisicion_detalle WHERE requisicion_id=$1",
        [id],
      );

      for (const item of detallesNorm) {
        await client.query(
          `
          INSERT INTO requisicion_detalle
          (requisicion_id, insumo_id, indirecto_id, tipo, cantidad, fecha_requerida)
          VALUES ($1,$2,$3,$4,$5,$6)
        `,
          [
            id,
            item.tipo === "insumo" ? item.item_id : null,
            item.tipo === "indirecto" ? item.item_id : null,
            item.tipo,
            item.cantidad,
            item.fecha_requerida,
          ],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true, message: "Requisición actualizada" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

// ======================================================
// REQUISICIONES AUTORIZADAS SIN REMESA
// ======================================================
export const getRequisicionesAprobadasSinRemesa = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.folio,
        r.proveedor_id,
        p.nombre AS proveedor,
        r.obra_id,
        o.nombre AS obra,
        r.partida,
        r.total,
        r.fecha
      FROM requisiciones r
      LEFT JOIN proveedores p ON p.id = r.proveedor_id
      LEFT JOIN obras o ON o.id = r.obra_id
      WHERE r.estado = 'autorizada'
      AND NOT EXISTS (
        SELECT 1 
        FROM remesas rm 
        WHERE rm.requisicion_id = r.id
      )
      ORDER BY r.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};