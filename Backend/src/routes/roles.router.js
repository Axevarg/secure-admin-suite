import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

/* 🔹 GET ALL ROLES  */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description
      FROM roles
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting roles" });
  }
});

/* 🔹 GET ROLE PERMISSIONS */
router.get("/:id/permissions", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT p.module || ':' || p.action AS key
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `, [id]);

    const permissions = result.rows.map(r => r.key);
    res.json(permissions);

  } catch (error) {
    console.error("GET ROLE PERMISSIONS ERROR:", error);
    res.status(500).json({ error: "Error getting permissions" });
  }
});

/* 🔹 UPDATE ROLE PERMISSIONS */
router.put("/:id/permissions", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { permissions } = req.body; // 👈 FIX

    if (!Array.isArray(permissions))
      return res.status(400).json({ error: "Permissions must be an array" });

    await client.query("BEGIN");

    // borrar permisos actuales
    await client.query(
      "DELETE FROM role_permissions WHERE role_id = $1",
      [id]
    );

    // insertar permisos nuevos
    for (const perm of permissions) {
      const [module, action] = perm.split(":");

      const permResult = await client.query(
        `SELECT id FROM permissions 
         WHERE module = $1 AND action = $2`,
        [module, action]
      );

      if (!permResult.rows.length) continue;

      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1,$2)`,
        [id, permResult.rows[0].id]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Permissions updated successfully" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("UPDATE ROLE PERMISSIONS ERROR:", error);
    res.status(500).json({ error: "Error updating permissions" });
  } finally {
    client.release();
  }
});

export default router;