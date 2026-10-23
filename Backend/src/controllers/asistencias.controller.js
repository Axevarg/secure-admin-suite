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
        a.horas_trabajadas,
        a.horas_extra,
        a.observaciones AS justificacion,
        a.metodo_entrada,
        a.metodo_salida,
        me.lat AS lat_entrada,
        me.lng AS lng_entrada,
        me.precision_m AS precision_entrada,
        me.direccion AS direccion_entrada,
        ms.lat AS lat_salida,
        ms.lng AS lng_salida,
        ms.precision_m AS precision_salida,
        ms.direccion AS direccion_salida
      FROM trabajadores_asignados at   
      JOIN trabajadores t ON t.id = at.trabajador_id

      LEFT JOIN asistencias a 
        ON a.trabajador_id = t.id
        AND a.obra_id = at.obra_id       
        AND a.fecha = $2

      -- 📍 Ubicación de la marca de la app que dio la entrada (primera del día)
      LEFT JOIN LATERAL (
        SELECT m.lat, m.lng, m.precision_m, m.direccion
        FROM asistencia_marcas m
        WHERE m.trabajador_id = t.id AND m.obra_id = at.obra_id
          AND m.fecha = $2 AND m.tipo = 'entrada' AND m.estado = 'aplicada'
        ORDER BY m.marcado_en ASC
        LIMIT 1
      ) me ON true

      -- 📍 Ubicación de la marca de la app que dio la salida (última del día)
      LEFT JOIN LATERAL (
        SELECT m.lat, m.lng, m.precision_m, m.direccion
        FROM asistencia_marcas m
        WHERE m.trabajador_id = t.id AND m.obra_id = at.obra_id
          AND m.fecha = $2 AND m.tipo = 'salida' AND m.estado = 'aplicada'
        ORDER BY m.marcado_en DESC
        LIMIT 1
      ) ms ON true

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
// La asistencia (entrada/salida) solo llega de las marcas de la app móvil.
// Desde la web únicamente se agregan justificaciones y se cierra el día.
const diaEstaCerrado = async (client, obraId, fecha) => {
  const { rows } = await client.query(
    "SELECT 1 FROM asistencia_cierre_dia WHERE obra_id = $1 AND fecha = $2",
    [obraId, fecha],
  );
  return rows.length > 0;
};

export const guardarJustificaciones = async (req, res) => {
  const client = await pool.connect();

  try {
    const { obra_id, fecha, justificaciones } = req.body;

    if (!obra_id || !fecha || !Array.isArray(justificaciones)) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    if (await diaEstaCerrado(client, obra_id, fecha)) {
      return res.status(400).json({ message: "El día ya está cerrado" });
    }

    await client.query("BEGIN");

    for (const j of justificaciones) {
      const texto =
        typeof j.justificacion === "string" ? j.justificacion.trim() : "";

      if (texto.length > 500) {
        throw new Error("La justificación no puede exceder 500 caracteres");
      }

      // Si el trabajador no tiene marcas, la fila se crea como falta;
      // una marca de entrada posterior la cambia a asistió.
      await client.query(
        `
        INSERT INTO asistencias(
          obra_id, trabajador_id, fecha, estado,
          horas_trabajadas, horas_extra, observaciones
        )
        VALUES($1, $2, $3, 'falta', 0, 0, $4)
        ON CONFLICT (trabajador_id, fecha)
        DO UPDATE SET observaciones = EXCLUDED.observaciones
      `,
        [obra_id, j.trabajador_id, fecha, texto || null],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Justificaciones guardadas correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

export const cerrarDia = async (req, res) => {
  const client = await pool.connect();

  try {
    const { obra_id, fecha } = req.body;

    if (!obra_id || !fecha) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    await client.query("BEGIN");

    // Quien no tiene ninguna marca en el día queda como falta
    await client.query(
      `
      INSERT INTO asistencias(
        obra_id, trabajador_id, fecha, estado, horas_trabajadas, horas_extra
      )
      SELECT at.obra_id, at.trabajador_id, $2, 'falta', 0, 0
      FROM trabajadores_asignados at
      WHERE at.obra_id = $1
        AND at.activo = true
        AND at.trabajador_id IS NOT NULL
      ON CONFLICT (trabajador_id, fecha) DO NOTHING
    `,
      [obra_id, fecha],
    );

    await client.query(
      `
      UPDATE asistencias
      SET estado = 'falta'
      WHERE obra_id = $1 AND fecha = $2
        AND hora_entrada IS NULL AND hora_salida IS NULL
    `,
      [obra_id, fecha],
    );

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
    res.json({ message: "Día cerrado correctamente" });
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