import { loginUser, createUser } from "./auth.service.js";
import { pool } from "../../config/db.js";
import { hashPassword } from "../../utils/password.js";
import { comparePassword } from "../../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import crypto from "crypto";
import { sendResetEmail } from "./auth.mail.js";



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

const result = await pool.query(`
  SELECT 
    u.*,
    u.password_hash AS password,
    r.name AS role_name
  FROM users u
  LEFT JOIN roles r ON r.id = u.role_id
  WHERE u.email = $1 
  AND u.is_active = true
`, [email]);

    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: "Credenciales inválidas" });

    // 🔥 cargar permisos del usuario
    const perms = await pool.query(`
      SELECT p.module, p.action
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = $1
    `, [user.id]);

    const permissions = perms.rows.map(p => `${p.module}:${p.action}`);

    // 🔑 tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_name: user.role_name
      },
      permissions, // 👈🔥 CLAVE
      accessToken,
      refreshToken,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await createUser(req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const activateAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE activation_token = $1`,
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Token inválido" });
    }

    if (new Date(user.activation_expiry) < new Date()) {
      return res.status(400).json({ message: "Token expirado" });
    }

    const hashed = await hashPassword(password);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1,
           is_active = true,
           activation_token = null,
           activation_expiry = null
       WHERE id = $2`,
      [hashed, user.id]
    );

    res.json({ message: "Cuenta activada correctamente 🔐" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(401).json({ message: "No autorizado" });

    // 1️⃣ verificar token
    const decoded = verifyRefreshToken(refreshToken);

    // 2️⃣ buscar usuario en DB
    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user)
      return res.status(401).json({ message: "No autorizado" });

    // 3️⃣ validar que coincida con el guardado en DB
    if (user.refresh_token !== refreshToken)
      return res.status(401).json({ message: "Token inválido" });

    // 4️⃣ generar nuevo access token
    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    res.status(401).json({ message: "Refresh expirado o inválido" });
  }
};

export const logout = async (req, res) => {
  try {
    const { userId } = req.body;

    await pool.query(
      `UPDATE users SET refresh_token = NULL WHERE id = $1`,
      [userId]
    );

    res.json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, is_active FROM users"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.json({ message: "Si el correo existe, se envió un enlace" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [resetToken, expiry, user.id]
    );

    await sendResetEmail(user.email, resetToken);

    res.json({ message: "Si el correo existe, se envió un enlace" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1",
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Token inválido" });
    }

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ message: "Token expirado" });
    }

    const hashed = await hashPassword(password);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE id = $2`,
      [hashed, user.id]
    );

    res.json({ message: "Contraseña actualizada correctamente 🔐" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};