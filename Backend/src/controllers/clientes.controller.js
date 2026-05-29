import { pool } from "../config/db.js";

export const getClientes = async (req, res) => {
  try {
const result = await pool.query(`
  SELECT *
  FROM clientes
  WHERE is_active = true
  ORDER BY created_at DESC
`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM clientes WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Cliente no encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCliente = async (req, res) => {
  try {
    const {
      nombre,
      razon_social,
      rfc,
      telefono,
      correo,
      direccion,
      contacto,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO clientes
      (nombre, razon_social, rfc, telefono, correo, direccion, contacto)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [nombre, razon_social, rfc, telefono, correo, direccion, contacto]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      razon_social,
      rfc,
      telefono,
      correo,
      direccion,
      contacto,
    } = req.body;

    const result = await pool.query(
      `UPDATE clientes SET
        nombre=$1,
        razon_social=$2,
        rfc=$3,
        telefono=$4,
        correo=$5,
        direccion=$6,
        contacto=$7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id=$8
      RETURNING *`,
      [nombre, razon_social, rfc, telefono, correo, direccion, contacto, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Cliente no encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE clientes
      SET is_active = false,
          deleted_at = NOW()
      WHERE id = $1
    `, [id]);

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};