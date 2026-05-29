import { pool } from "../config/db.js";

/* ==============================
   GET TODOS
============================== */
export const getProveedores = async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM proveedores WHERE activo=true ORDER BY nombre "
  );
  res.json(result.rows);
};

/* ==============================
   CREAR
============================== */
export const createProveedor = async (req, res) => {
  try {
    const {
      nombre,
      rfc,
      telefono,
      email,
      direccion,
      banco,
      clabe,
      titular_cuenta
    } = req.body;

    const result = await pool.query(
      `INSERT INTO proveedores
      (nombre, rfc, telefono, email, direccion, banco, clabe, titular_cuenta)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [nombre, rfc, telefono, email, direccion, banco, clabe, titular_cuenta]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ==============================
   ACTUALIZAR
============================== */
export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      rfc,
      telefono,
      email,
      direccion,
      banco,
      clabe,
      titular_cuenta,
      activo
    } = req.body;

    const result = await pool.query(
      `UPDATE proveedores SET
        nombre=$1,
        rfc=$2,
        telefono=$3,
        email=$4,
        direccion=$5,
        banco=$6,
        clabe=$7,
        titular_cuenta=$8,
        activo=$9
       WHERE id=$10
       RETURNING *`,
      [nombre, rfc, telefono, email, direccion, banco, clabe, titular_cuenta, activo, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ==============================
   DELETE (SOFT DELETE)
============================== */
export const deleteProveedor = async (req, res) => {
  const { id } = req.params;

  await pool.query(
    "UPDATE proveedores SET activo=false WHERE id=$1",
    [id]
  );

  res.json({ message: "Proveedor desactivado" });
};