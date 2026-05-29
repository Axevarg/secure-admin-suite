import { pool } from "../config/db.js";

export const getStockObra = async (req, res) => {
  try {
    const { obraId } = req.params;

    const result = await pool.query(
      `
  SELECT
    i.id,
    i.clave,
    i.descripcion,
    i.unidad,
    i.cantidad AS presupuesto,

    COALESCE((
      SELECT SUM(io.cantidad)
      FROM inventario_obra io
      WHERE io.insumo_id = i.id AND io.obra_id = i.obra_id
    ), 0) AS extras,

    COALESCE((
      SELECT SUM(rd.cantidad)
      FROM requisicion_detalle rd
      JOIN requisiciones r ON r.id = rd.requisicion_id
      WHERE rd.insumo_id = i.id
        AND r.obra_id = $1
        AND r.estado != 'rechazada'
    ), 0) AS solicitado,

    (
      i.cantidad
      + COALESCE((
          SELECT SUM(io.cantidad)
          FROM inventario_obra io
          WHERE io.insumo_id = i.id AND io.obra_id = i.obra_id
        ), 0)
      - COALESCE((
          SELECT SUM(rd.cantidad)
          FROM requisicion_detalle rd
          JOIN requisiciones r ON r.id = rd.requisicion_id
          WHERE rd.insumo_id = i.id
            AND r.obra_id = $1
            AND r.estado != 'rechazada'
        ), 0)
    ) AS disponible

  FROM insumos i
  WHERE i.obra_id = $1
    AND i.categoria_id = 1

  ORDER BY i.descripcion
`,
      [obraId],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
