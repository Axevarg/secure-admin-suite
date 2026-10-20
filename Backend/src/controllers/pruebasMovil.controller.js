import { pool } from "../config/db.js";

export const listarPruebasMovil = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, mensaje, dispositivo, usuario_id, creado_en
      FROM pruebas_movil
      ORDER BY creado_en DESC
      LIMIT 100
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error al listar pruebas móviles:", error);
    res.status(500).json({ message: "No fue posible obtener las pruebas móviles" });
  }
};

export const crearPruebaMovil = async (req, res) => {
  try {
    const mensaje = typeof req.body?.mensaje === "string" ? req.body.mensaje.trim() : "";
    const dispositivo = typeof req.body?.dispositivo === "string"
      ? req.body.dispositivo.trim()
      : null;

    if (!mensaje) {
      return res.status(400).json({ message: "El mensaje es obligatorio" });
    }

    if (mensaje.length > 280 || dispositivo?.length > 120) {
      return res.status(400).json({ message: "Los datos exceden la longitud permitida" });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO pruebas_movil (mensaje, dispositivo, usuario_id)
        VALUES ($1, $2, $3)
        RETURNING id, mensaje, dispositivo, usuario_id, creado_en
      `,
      [mensaje, dispositivo || null, String(req.user.id)],
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error al crear prueba móvil:", error);
    res.status(500).json({ message: "No fue posible guardar la prueba móvil" });
  }
};
