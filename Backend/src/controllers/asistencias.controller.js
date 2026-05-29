import { pool } from "../config/db.js";

export const getAsistenciaDia = async (req, res) => {
  try {
    const { obraId } = req.params;
    const fecha = req.query.fecha;

    const result = await pool.query(
      `
      SELECT 
        t.id AS trabajador_id,
        t.nombre,
        a.id AS asistencia_id,
        a.estado,
        a.hora_entrada,
        a.hora_salida,
        a.horas_extra
      FROM trabajadores_asignados at   
      JOIN trabajadores t ON t.id = at.trabajador_id

      LEFT JOIN asistencias a 
        ON a.trabajador_id = t.id
        AND a.obra_id = at.obra_id       
        AND a.fecha = $2

      WHERE at.obra_id = $1
      AND at.activo = true
      ORDER BY t.nombre ASC
    `,
      [obraId, fecha],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
export const guardarAsistenciaDia = async (req, res) => {
  const client = await pool.connect();

  try {
    const { obra_id, fecha, registros } = req.body;

    await client.query("BEGIN");

    for (const r of registros) {
      let horasTrabajadas = 0;

      // calcular horas si hay entrada y salida
      if (r.hora_entrada && r.hora_salida) {
        const diff = await client.query(
          `
          SELECT EXTRACT(EPOCH FROM ($2::time - $1::time))/3600 as horas
        `,
          [r.hora_entrada, r.hora_salida],
        );

        horasTrabajadas = Number(diff.rows[0].horas).toFixed(2);
      }

      await client.query(
        `
        INSERT INTO asistencias(
          obra_id,
          trabajador_id,
          fecha,
          estado,
          hora_entrada,
          hora_salida,
          horas_trabajadas,
          horas_extra,
          observaciones
        )
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (trabajador_id, fecha)
        DO UPDATE SET
          estado = EXCLUDED.estado,
          hora_entrada = EXCLUDED.hora_entrada,
          hora_salida = EXCLUDED.hora_salida,
          horas_trabajadas = EXCLUDED.horas_trabajadas,
          horas_extra = EXCLUDED.horas_extra,
          observaciones = EXCLUDED.observaciones
      `,
        [
          obra_id,
          r.trabajador_id,
          fecha,
          r.estado,
          r.hora_entrada || null,
          r.hora_salida || null,
          horasTrabajadas,
          r.horas_extra || 0,
          r.observaciones || null,
        ],
      );
    }

    // 🔒 CERRAR EL DIA
    await client.query(
      `
  INSERT INTO asistencia_cierre_dia (obra_id, fecha)
  VALUES ($1, $2)
  ON CONFLICT (obra_id, fecha) DO NOTHING
`,
      [obra_id, fecha],
    );

    await client.query("COMMIT");
    res.json({ message: "Asistencia guardada correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

export const historialObra = async (req, res) => {
  try {
    const { obraId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        a.fecha,
        t.nombre,
        a.estado,
        a.horas_trabajadas,
        a.horas_extra
      FROM asistencias a
      JOIN trabajadores t ON t.id = a.trabajador_id
      WHERE a.obra_id = $1
      ORDER BY a.fecha DESC
    `,
      [obraId],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const verificarDiaCerrado = async (req, res) => {
  try {
    const { obraId } = req.params;
    const { fecha } = req.query;

    const result = await pool.query(`
      SELECT cerrado
      FROM asistencia_cierre_dia
      WHERE obra_id = $1 AND fecha = $2
    `, [obraId, fecha]);

    res.json({
      cerrado: result.rows.length > 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};