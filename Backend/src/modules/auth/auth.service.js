import { pool } from "../../config/db.js";
import crypto from "crypto";

import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateAccessToken } from "../../utils/jwt.js";
import { sendActivationEmail } from "./auth.mail.js";

export const createUser = async ({ name, email, role }) => {
  const activationToken = crypto.randomBytes(32).toString("hex");
  const activationExpiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min

  const result = await pool.query(
    `INSERT INTO users (name, email, role, activation_token, activation_expiry)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email`,
    [name, email, role, activationToken, activationExpiry]
  );

  // 📧 ENVIAR EMAIL DE ACTIVACIÓN
  await sendActivationEmail(email, activationToken);

  return {
    message: "Usuario creado, correo de activación enviado",
    user: result.rows[0],
  };
};

export const loginUser = async ({ email, password }) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];

  if (!user) throw new Error("Usuario no existe");

  if (!user.is_active) throw new Error("Cuenta no activada");

  const valid = await comparePassword(password, user.password_hash);

  if (!valid) throw new Error("Password incorrecto");

  const token = generateAccessToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  };
};