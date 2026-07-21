import { pool } from "../config/db.js";

export const getObras = async (req, res) => {
    try {
        const userId = req.user.id;

        const userRes = await pool.query(
            "SELECT all_obras FROM users WHERE id=$1",
            [userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const allObras = userRes.rows[0].all_obras;

        let query = `
            SELECT 
                o.*,
                c.nombre AS cliente_nombre,
                ps.name AS status_name,
                ps.color AS status_color
            FROM obras o
            JOIN clientes c ON c.id = o.cliente_id
            LEFT JOIN project_status ps ON ps.id = o.status_id
        `;

        const params = [];

        if (allObras) {
            query += ` WHERE o.is_active = true `;
        } else {
            query += `
                JOIN user_obras uo ON uo.obra_id = o.id
                WHERE o.is_active = true AND uo.user_id = $1
            `;
            params.push(userId);
        }

        query += ` ORDER BY o.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("GET OBRAS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};

export const getObraById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const userRes = await pool.query(
            "SELECT all_obras FROM users WHERE id=$1",
            [userId]
        );
        const allObras = userRes.rows[0]?.all_obras;

        if (!allObras) {
            const access = await pool.query(
                "SELECT 1 FROM user_obras WHERE user_id=$1 AND obra_id=$2",
                [userId, id]
            );
            if (access.rows.length === 0) {
                return res.status(403).json({ message: "No tienes acceso a esta obra" });
            }
        }

        const result = await pool.query(`
            SELECT o.*, c.nombre as cliente_nombre
            FROM obras o
            JOIN clientes c ON c.id = o.cliente_id
            WHERE o.id=$1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Obra no encontrada" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("GET OBRA BY ID ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};
export const createObra = async (req, res) => {
    try {
        const { nombre, ubicacion, cliente_id, fecha_inicio, fecha_fin, descripcion } = req.body;

        const result = await pool.query(`
      INSERT INTO obras(nombre, ubicacion, cliente_id, fecha_inicio, fecha_fin, descripcion)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [nombre, ubicacion, cliente_id, fecha_inicio, fecha_fin, descripcion]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateObra = async (req, res) => {
    try {
        console.log("UPDATE BODY:", req.body);
        console.log("UPDATE ID:", req.params.id);
        const { id } = req.params;
        const {
            nombre,
            ubicacion,
            cliente_id,
            status_id,
            fecha_inicio,
            fecha_fin,
            descripcion
        } = req.body;

        const result = await pool.query(`
                    UPDATE obras SET
                        nombre=$1,
                        ubicacion=$2,
                        cliente_id=$3,
                        status_id=$4,
                        fecha_inicio=$5,
                        fecha_fin=$6,
                        descripcion=$7,
                        updated_at=NOW()
                    WHERE id=$8
                    RETURNING *
                    `, [
            nombre,
            ubicacion,
            Number(cliente_id),
            Number(status_id),
            fecha_inicio || null,
            fecha_fin || null,
            descripcion,
            id
        ]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("ERROR UPDATE OBRA:", err); // 🔥 CLAVE
        res.status(500).json({ message: err.message });
    }
};

export const deleteObra = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(`
      UPDATE obras SET is_active=false WHERE id=$1
    `, [id]);

        res.json({ message: "Obra eliminada" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getProjectStatus = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM project_status
            ORDER BY id ASC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
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