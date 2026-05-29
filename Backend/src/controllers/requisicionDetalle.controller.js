import { pool } from "../config/db.js";

export const crearDetalleRequisicion = async (req, res) => {
  try {
    const { id } = req.params; // id requisicion
    const { materiales } = req.body;

    if (!materiales || materiales.length === 0) {
      return res.status(400).json({ message: "Sin materiales" });
    }

    // borrar detalles previos (por si editan)
    await pool.query(
      "DELETE FROM requisicion_detalles WHERE requisicion_id = $1",
      [id]
    );

    // insertar nuevos detalles
    for (const item of materiales) {
      await pool.query(
        `INSERT INTO requisicion_detalle
        (requisicion_id, insumo_id, cantidad, precio_unitario, importe)
        VALUES ($1,$2,$3,$4,$5)`,
        [
          id,
          item.insumo_id,
          item.cantidad,
          item.precio_unitario,
          item.importe
        ]
      );
    }

    res.json({ message: "Materiales guardados" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};