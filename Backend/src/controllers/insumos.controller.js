// controllers/insumos.controller.js
import XLSX from "xlsx";
import { pool } from "../config/db.js";

export const importarInsumosExcel = async (req, res) => {
  const client = await pool.connect();

  try {
    const obraId = req.params.obraId;
    const workbook = XLSX.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", header: 1 });

    let categoriaActual = null;
    let headerRowIndex = -1;
    let colIndex = {};

    // Totales por categoría
    const totales = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const nombresCategoria = {
      1: "Materiales",
      2: "Mano de Obra",
      3: "Herramienta",
      4: "Equipo",
    };

    await client.query("BEGIN");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const textoFila = row.join(" ").toUpperCase().trim();

      // ── Detectar fila de encabezados ──
      if (textoFila.includes("CLAVE") && textoFila.includes("DESCRIPCI")) {
        headerRowIndex = i;
        row.forEach((cell, idx) => {
          const key = String(cell).trim().toUpperCase();
          if (key.includes("CLAVE")) colIndex.clave = idx;
          if (key.includes("DESCRIPCI")) colIndex.descripcion = idx;
          if (key.includes("UNIDAD")) colIndex.unidad = idx;
          if (key.includes("CANTIDAD")) colIndex.cantidad = idx;
          if (key.includes("COSTO")) colIndex.costo = idx;
          if (key.includes("IMPORTE")) colIndex.importe = idx;
        });
        continue;
      }

      // ── Saltar filas de subtotal/totales ANTES de detectar categoría ──
      // Así "Importe de Herramienta" no pisa la categoría actual
      if (textoFila.includes("IMPORTE DE")) continue;
      if (textoFila.includes("IMPORTE TOTAL")) continue;
      if (textoFila.includes("CONCURSANTE")) continue;

      // ── Detectar categorías (exact-ish match para evitar falsos positivos) ──
      // Usamos regex para que solo haga match cuando la celda ES la categoría,
      // no cuando es parte de otra frase
      const primeraCelda = String(row[0] ?? "")
        .trim()
        .toUpperCase();
      const segundaCelda = String(row[1] ?? "")
        .trim()
        .toUpperCase();
      const celdaCategoria = primeraCelda || segundaCelda; // el Excel puede tener col vacía al inicio

      if (/^MATERIALES$/.test(celdaCategoria)) {
        categoriaActual = 1;
        continue;
      }
      if (/^MANO DE OBRA$/.test(celdaCategoria)) {
        categoriaActual = 2;
        continue;
      }
      if (/^HERRAMIENTA$/.test(celdaCategoria)) {
        categoriaActual = 3;
        continue;
      }
      if (/^EQUIPO$/.test(celdaCategoria)) {
        categoriaActual = 4;
        continue;
      }

      if (headerRowIndex === -1) continue;

      // ── Limpiar y leer clave ──
      const limpiarNumero = (n) =>
        Number(String(n).replace(/[$,\s]/g, "")) || 0;

      const clave = String(row[colIndex.clave] ?? "").trim();
      if (!clave || clave === "") continue;

      const descripcion = String(row[colIndex.descripcion] ?? "").trim();
      const unidad = String(row[colIndex.unidad] ?? "").trim();
      const cantidad = limpiarNumero(row[colIndex.cantidad]);
      const costo = limpiarNumero(row[colIndex.costo]);
      const importe = limpiarNumero(row[colIndex.importe]);

      // Acumular totales
      if (categoriaActual) totales[categoriaActual] += importe;

      await client.query(
        `
        INSERT INTO insumos(
          obra_id,
          categoria_id,
          clave,
          descripcion,
          unidad,
          cantidad,
          costo_unitario,
          importe
        )
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      `,
        [
          obraId,
          categoriaActual,
          clave,
          descripcion,
          unidad,
          cantidad,
          costo,
          importe,
        ],
      );
    }

    await client.query("COMMIT");

    // ── Construir resumen de totales ──
    const resumenTotales = Object.entries(totales).map(([id, total]) => ({
      categoria_id: Number(id),
      categoria: nombresCategoria[id],
      total: Number(total.toFixed(2)),
    }));

    const totalGeneral = resumenTotales.reduce((sum, c) => sum + c.total, 0);

    res.json({
      message: "Insumos importados correctamente 🚀",
      totales: resumenTotales,
      total_general: Number(totalGeneral.toFixed(2)),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

export const getInsumosObra = async (req, res) => {
  try {
    const { obraId } = req.params;

    const result = await pool.query(
      `
SELECT 
  i.*,
  c.nombre AS categoria,

  -- lo ya pedido en requisiciones autorizadas
  COALESCE(SUM(
    CASE WHEN r.estado = 'autorizada' THEN rd.cantidad ELSE 0 END
  ),0) AS cantidad_pedida,

  -- inventario extra acumulado
  COALESCE(inv.inventario_extra,0) AS inventario_extra,

  -- lo que realmente falta por comprar
  (
    i.cantidad 
    - COALESCE(SUM(
        CASE WHEN r.estado = 'autorizada' THEN rd.cantidad ELSE 0 END
      ),0)
    - COALESCE(inv.inventario_extra,0)
  ) AS faltante_real

FROM insumos i
JOIN insumo_categorias c ON c.id = i.categoria_id

LEFT JOIN requisicion_detalle rd 
  ON rd.insumo_id = i.id

LEFT JOIN requisiciones r
  ON r.id = rd.requisicion_id

-- 🔥 NUEVO JOIN INVENTARIO
LEFT JOIN (
  SELECT insumo_id, SUM(cantidad) AS inventario_extra
  FROM inventario_obra
  GROUP BY insumo_id
) inv ON inv.insumo_id = i.id

WHERE i.obra_id = $1

GROUP BY i.id, c.nombre, inv.inventario_extra
ORDER BY i.categoria_id, i.descripcion
`,
      [obraId],
    );

    const totalesResult = await pool.query(
      ` 
      SELECT 
        c.id AS categoria_id,
        c.nombre AS categoria,
        ROUND(SUM(i.importe)::numeric, 2) AS total
      FROM insumos i
      JOIN insumo_categorias c ON c.id = i.categoria_id
      WHERE i.obra_id = $1
      GROUP BY c.id, c.nombre
      ORDER BY c.id
    `,
      [obraId],
    );

    const totalGeneral = totalesResult.rows.reduce(
      (sum, r) => sum + Number(r.total),
      0,
    );

    res.json({
      insumos: result.rows,
      totales: totalesResult.rows,
      total_general: Number(totalGeneral.toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const agregarInventario = async (req, res) => {
  try {
    const { obra_id, insumo_id, cantidad, motivo } = req.body;

    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({
        msg: "Debes escribir una justificación",
      });
    }

    await pool.query(
      `
      INSERT INTO inventario_obra
      (obra_id, insumo_id, cantidad, motivo)
      VALUES ($1,$2,$3,$4)
    `,
      [obra_id, insumo_id, cantidad, motivo],
    );

    res.json({ msg: "Inventario agregado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al agregar inventario" });
  }
};
