import { pool } from "../config/db.js";

export const getObras = async (req, res) => {
    try {
        const result = await pool.query(`
     SELECT 
        o.*,
        c.nombre AS cliente_nombre,
        ps.name AS status_name,
        ps.color AS status_color
      FROM obras o
      JOIN clientes c ON c.id = o.cliente_id
      LEFT JOIN project_status ps ON ps.id = o.status_id
      WHERE o.is_active = true
      ORDER BY o.created_at DESC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getObraById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT o.*, c.nombre as cliente_nombre
      FROM obras o
      JOIN clientes c ON c.id = o.cliente_id
      WHERE o.id=$1
    `, [id]);

        res.json(result.rows[0]);
    } catch (err) {
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

