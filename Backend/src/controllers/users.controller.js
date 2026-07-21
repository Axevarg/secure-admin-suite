import { pool } from "../config/db.js";
import { hashPassword } from "../utils/password.js";
import crypto from "crypto";
import { sendActivationEmail } from "../modules/auth/auth.mail.js";

//
// 🟢 1. LISTAR USUARIOS
//
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role_id,
        r.name AS role_name,
        u.is_active,
        u.all_obras,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', o.id, 'nombre', o.nombre)
          ) FILTER (WHERE o.id IS NOT NULL), '[]'
        ) AS obras
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN user_obras uo ON uo.user_id = u.id
      LEFT JOIN obras o ON o.id = uo.obra_id
      GROUP BY u.id, r.name
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map((u) => ({
      ...u,
      status: u.is_active ? "active" : "inactive",
    }));

    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
//
// 🟢 2. CREAR USUARIO (ADMIN)
//
export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0)
      return res.status(400).json({ message: "El usuario ya existe" });

    // 🔐 token de activación
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationExpiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    // contraseña temporal (opcional si quieres login directo después)
    const tempPassword = crypto.randomBytes(5).toString("hex");
    const hashed = await hashPassword(tempPassword);

    const result = await pool.query(
      `INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        is_active,
        activation_token,
        activation_expiry
      )
      VALUES ($1,$2,$3,$4,false,$5,$6)
      RETURNING id,name,email,role`,
      [name, email, hashed, role || "operador", activationToken, activationExpiry]
    );

    // 📩 enviar correo de activación
    await sendActivationEmail(email, activationToken);

    res.json({
      message: "Usuario creado. Se envió correo de activación",
      user: result.rows[0],
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//
// 🟢 3. EDITAR USUARIO
//
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role_id } = req.body;

    const fields = [];
    const values = [];
    let index = 1;

    if (name) {
      fields.push(`name=$${index++}`);
      values.push(name);
    }

    if (email) {
      fields.push(`email=$${index++}`);
      values.push(email);
    }

    if (role_id) {
      fields.push(`role_id=$${index++}`);
      values.push(role_id);
    }

    // si no mandan nada
    if (fields.length === 0) {
      return res.status(400).json({ message: "Nada para actualizar" });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users
       SET ${fields.join(", ")}
       WHERE id=$${index}
       RETURNING id,name,email,role_id,is_active`,
      values
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//
// 🟢 4. ACTIVAR / DESACTIVAR USUARIO
//
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query(
      "SELECT is_active FROM users WHERE id=$1",
      [id]
    );

    const newStatus = !user.rows[0].is_active;

    await pool.query(
      "UPDATE users SET is_active=$1 WHERE id=$2",
      [newStatus, id]
    );

    res.json({ message: "Estado actualizado", is_active: newStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//
// 🟢 5. RESET PASSWORD POR ADMIN 🔥
//
export const adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const newPassword = crypto.randomBytes(5).toString("hex");
    const hashed = await hashPassword(newPassword);

    await pool.query(
      "UPDATE users SET password_hash=$1 WHERE id=$2",
      [hashed, id]
    );

    res.json({
      message: "Contraseña reseteada",
      newPassword, // temporal para pruebas
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//
// 🟢 6. OBTENER OBRAS ASIGNADAS A UN USUARIO
//
export const getUserObras = async (req, res) => {
  try {
    const { id } = req.params;

    const userRes = await pool.query(
      "SELECT all_obras FROM users WHERE id=$1",
      [id]
    );

    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const allObras = userRes.rows[0].all_obras;

    if (allObras) {
      return res.json({ all_obras: true, obras: [] });
    }

    const result = await pool.query(
      `SELECT o.id, o.nombre, o.ubicacion
       FROM user_obras uo
       JOIN obras o ON o.id = uo.obra_id
       WHERE uo.user_id = $1
       ORDER BY o.nombre`,
      [id]
    );

    res.json({ all_obras: false, obras: result.rows });
  } catch (err) {
    console.error("GET USER OBRAS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

//
// 🟢 7. ASIGNAR OBRAS A UN USUARIO
//
export const setUserObras = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { all_obras, obra_ids } = req.body; // obra_ids: number[]

    await client.query("BEGIN");

    await client.query(
      "UPDATE users SET all_obras=$1 WHERE id=$2",
      [!!all_obras, id]
    );

    // limpiar asignaciones previas
    await client.query("DELETE FROM user_obras WHERE user_id=$1", [id]);

    if (!all_obras && Array.isArray(obra_ids) && obra_ids.length > 0) {
      const values = obra_ids.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO user_obras (user_id, obra_id) VALUES ${values}`,
        [id, ...obra_ids]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Obras actualizadas correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("SET USER OBRAS ERROR:", err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

export const getObrasList = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre, ubicacion FROM obras WHERE is_active = true ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};