import { pool } from "../../config/db.js";

export const loadPermissions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT p.module, p.action
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = $1
    `, [userId]);

    req.user.permissions = result.rows.map(
      p => `${p.module}:${p.action}`
    );

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error cargando permisos" });
  }
};