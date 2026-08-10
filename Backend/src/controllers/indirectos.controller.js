// controllers/indirectos.controller.js
import { pool } from "../config/db.js";

// Presupuesto + conceptos + totales de una obra
// El gasto total = capturas directas (tabla indirectos_obra)
//                 + renglones de requisiciones tipo "indirecto" ya aprobadas
export const getIndirectos = async (req, res) => {
  try {
    const { obraId } = req.params;

    const presupuestoResult = await pool.query(
      `SELECT presupuesto FROM obra_presupuesto_indirectos WHERE obra_id = $1`,
      [obraId],
    );
    const presupuesto = Number(presupuestoResult.rows[0]?.presupuesto ?? 0);

    const itemsResult = await pool.query(
      `SELECT * FROM indirectos_obra WHERE obra_id = $1 ORDER BY created_at DESC`,
      [obraId],
    );

    const totalDirecto = itemsResult.rows.reduce(
      (sum, i) => sum + Number(i.importe),
      0,
    );

    // ⚠️ Aceptamos 'aprobada' y 'autorizada' porque el proyecto usa ambos
    // strings en distintos lugares para el mismo concepto. Conviene unificar.
    const reqResult = await pool.query(
      `
      SELECT COALESCE(SUM(d.cantidad * ind.costo_unitario), 0) AS total
      FROM requisicion_detalle d
      JOIN requisiciones r ON r.id = d.requisicion_id
      JOIN indirectos_obra ind ON ind.id = d.indirecto_id
      WHERE d.tipo = 'indirecto'
        AND r.obra_id = $1
        AND r.estado IN ('aprobada', 'autorizada')
      `,
      [obraId],
    );
    const totalRequisicion = Number(reqResult.rows[0]?.total ?? 0);

    const totalGastado = totalDirecto + totalRequisicion;

    res.json({
      presupuesto,
      items: itemsResult.rows,
      total_gastado: Number(totalGastado.toFixed(2)),
      porcentaje:
        presupuesto > 0
          ? Number(((totalGastado / presupuesto) * 100).toFixed(2))
          : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Fijar / actualizar el presupuesto único de la obra
export const setPresupuestoIndirectos = async (req, res) => {
  try {
    const { obra_id, presupuesto } = req.body;

    if (presupuesto === undefined || Number(presupuesto) < 0) {
      return res.status(400).json({ message: "Presupuesto inválido" });
    }

    await pool.query(
      `
      INSERT INTO obra_presupuesto_indirectos (obra_id, presupuesto, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (obra_id)
      DO UPDATE SET presupuesto = $2, updated_at = NOW()
      `,
      [obra_id, presupuesto],
    );

    res.json({ message: "Presupuesto actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Agregar un concepto (tintas, escobas, trapos, lo que vaya surgiendo)
export const agregarIndirecto = async (req, res) => {
  try {
    const { obra_id, nombre, unidad, cantidad, costo_unitario } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }
    if (!cantidad || Number(cantidad) <= 0) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }
    if (costo_unitario === undefined || Number(costo_unitario) < 0) {
      return res.status(400).json({ message: "Costo unitario inválido" });
    }

    const result = await pool.query(
      `
      INSERT INTO indirectos_obra (obra_id, nombre, unidad, cantidad, costo_unitario)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [obra_id, nombre.trim(), unidad || null, cantidad, costo_unitario],
    );

    res.json({ message: "Concepto agregado correctamente", item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminar un concepto capturado por error
export const eliminarIndirecto = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM indirectos_obra WHERE id = $1`, [id]);
    res.json({ message: "Concepto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};