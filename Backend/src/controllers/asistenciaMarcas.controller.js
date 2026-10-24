import { pool } from "../config/db.js";
import { tieneAccesoObra } from "./biometria.controller.js";
import { procesarDireccionesPendientes } from "../utils/geocodificacion.js";
import { marcasTieneDireccion } from "../utils/columnas.js";

// Zona horaria de las obras: la hora del teléfono se convierte a fecha/hora local.
const ZONA_HORARIA = process.env.ASISTENCIA_TZ || "America/Mexico_City";
const MAX_MARCAS_POR_LOTE = 500;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const numeroOpcional = (v) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const validarMarca = (m) => {
  if (!m || typeof m !== "object") return "Marca vacía";
  if (typeof m.uuid !== "string" || !UUID_REGEX.test(m.uuid)) return "uuid inválido";
  if (!Number.isInteger(m.obra_id)) return "obra_id inválido";
  if (!Number.isInteger(m.trabajador_id)) return "trabajador_id i<nválido";
  if (!["entrada", "salida"].includes(m.tipo)) return "tipo inválido";
  if (!["facial", "manual"].includes(m.metodo)) return "metodo inválido";

  const fecha = new Date(m.marcado_en);
  if (typeof m.marcado_en !== "string" || Number.isNaN(fecha.getTime())) {
    return "marcado_en inválido";
  }
  // Tolera relojes adelantados unos minutos, pero no marcas a futuro.
  if (fecha.getTime() > Date.now() + 10 * 60 * 1000) return "marcado_en en el futuro";

  return null;
};

const aplicarEnAsistencias = async (client, marca, fecha, hora) => {
  if (marca.tipo === "entrada") {
    await client.query(
      `
      INSERT INTO asistencias
        (obra_id, trabajador_id, fecha, estado, hora_entrada,
         horas_trabajadas, horas_extra, metodo_entrada)
      VALUES ($1, $2, $3, 'asistio', $4, 0, 0, $5)
      ON CONFLICT (trabajador_id, fecha) DO UPDATE SET
        metodo_entrada = CASE
          WHEN asistencias.hora_entrada IS NULL OR EXCLUDED.hora_entrada < asistencias.hora_entrada
          THEN EXCLUDED.metodo_entrada ELSE asistencias.metodo_entrada END,
        hora_entrada = CASE
          WHEN asistencias.hora_entrada IS NULL OR EXCLUDED.hora_entrada < asistencias.hora_entrada
          THEN EXCLUDED.hora_entrada ELSE asistencias.hora_entrada END,
        estado = CASE
          WHEN asistencias.estado IS NULL OR asistencias.estado = 'falta'
          THEN 'asistio' ELSE asistencias.estado END
    `,
      [marca.obra_id, marca.trabajador_id, fecha, hora, marca.metodo]
    );
  } else {
    await client.query(
      `
      INSERT INTO asistencias
        (obra_id, trabajador_id, fecha, estado, hora_salida,
         horas_trabajadas, horas_extra, metodo_salida)
      VALUES ($1, $2, $3, 'asistio', $4, 0, 0, $5)
      ON CONFLICT (trabajador_id, fecha) DO UPDATE SET
        metodo_salida = CASE
          WHEN asistencias.hora_salida IS NULL OR EXCLUDED.hora_salida > asistencias.hora_salida
          THEN EXCLUDED.metodo_salida ELSE asistencias.metodo_salida END,
        hora_salida = CASE
          WHEN asistencias.hora_salida IS NULL OR EXCLUDED.hora_salida > asistencias.hora_salida
          THEN EXCLUDED.hora_salida ELSE asistencias.hora_salida END,
        estado = CASE
          WHEN asistencias.estado IS NULL OR asistencias.estado = 'falta'
          THEN 'asistio' ELSE asistencias.estado END
    `,
      [marca.obra_id, marca.trabajador_id, fecha, hora, marca.metodo]
    );
  }

  // Recalcula horas trabajadas con la primera entrada y la última salida.
  await client.query(
    `
    UPDATE asistencias
    SET horas_trabajadas = CASE
      WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL
        AND hora_salida::time > hora_entrada::time
      THEN ROUND((EXTRACT(EPOCH FROM (hora_salida::time - hora_entrada::time)) / 3600)::numeric, 2)
      ELSE 0
    END
    WHERE trabajador_id = $1 AND fecha = $2
  `,
    [marca.trabajador_id, fecha]
  );
};

const procesarMarca = async (marca, usuarioId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tiempo = await client.query(
      `
      SELECT
        ($1::timestamptz AT TIME ZONE $2)::date AS fecha,
        date_trunc('minute', $1::timestamptz AT TIME ZONE $2)::time AS hora
    `,
      [marca.marcado_en, ZONA_HORARIA]
    );
    const { fecha, hora } = tiempo.rows[0];

    const asignado = await client.query(
      `
      SELECT 1 FROM trabajadores_asignados
      WHERE obra_id = $1 AND trabajador_id = $2 AND activo = true
    `,
      [marca.obra_id, marca.trabajador_id]
    );

    const cerrado = await client.query(
      "SELECT 1 FROM asistencia_cierre_dia WHERE obra_id = $1 AND fecha = $2",
      [marca.obra_id, fecha]
    );

    const estado = asignado.rows.length === 0
      ? "no_asignado"
      : cerrado.rows.length > 0
        ? "dia_cerrado"
        : "aplicada";

    const insert = await client.query(
      `
      INSERT INTO asistencia_marcas (
        uuid_cliente, obra_id, trabajador_id, tipo, metodo, distancia, modelo,
        marcado_en, fecha, hora, lat, lng, precision_m, dispositivo, usuario_id, estado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (uuid_cliente) DO NOTHING
      RETURNING id
    `,
      [
        marca.uuid,
        marca.obra_id,
        marca.trabajador_id,
        marca.tipo,
        marca.metodo,
        numeroOpcional(marca.distancia),
        typeof marca.modelo === "string" ? marca.modelo.slice(0, 60) : null,
        marca.marcado_en,
        fecha,
        hora,
        numeroOpcional(marca.lat),
        numeroOpcional(marca.lng),
        numeroOpcional(marca.precision_m),
        typeof marca.dispositivo === "string" ? marca.dispositivo.slice(0, 120) : null,
        String(usuarioId),
        estado,
      ]
    );

    // Ya se había recibido (la app reenvió la cola): no se vuelve a aplicar.
    if (insert.rows.length === 0) {
      await client.query("COMMIT");
      return { uuid: marca.uuid, estado: "duplicada" };
    }

    if (estado === "aplicada") {
      await aplicarEnAsistencias(client, marca, fecha, hora);
    }

    await client.query("COMMIT");
    return { uuid: marca.uuid, estado };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR PROCESAR MARCA:", err);
    return { uuid: marca.uuid, estado: "error", mensaje: "Error al guardar la marca" };
  } finally {
    client.release();
  }
};

/* ========================================
   POST lote de marcas desde la app
   Respuesta por marca: aplicada | dia_cerrado | no_asignado |
   duplicada | invalida | sin_acceso | error.
   La app borra de su cola todo lo que no sea "error".
======================================== */
export const sincronizarMarcas = async (req, res) => {
  const { marcas } = req.body ?? {};

  if (!Array.isArray(marcas) || marcas.length === 0) {
    return res.status(400).json({ message: "No se recibieron marcas" });
  }

  if (marcas.length > MAX_MARCAS_POR_LOTE) {
    return res.status(400).json({
      message: `Máximo ${MAX_MARCAS_POR_LOTE} marcas por envío`,
    });
  }

  const accesoPorObra = new Map();
  const resultados = [];

  for (const marca of marcas) {
    const error = validarMarca(marca);
    if (error) {
      resultados.push({ uuid: marca?.uuid ?? null, estado: "invalida", mensaje: error });
      continue;
    }

    if (!accesoPorObra.has(marca.obra_id)) {
      accesoPorObra.set(marca.obra_id, await tieneAccesoObra(req.user.id, marca.obra_id));
    }
    if (!accesoPorObra.get(marca.obra_id)) {
      resultados.push({ uuid: marca.uuid, estado: "sin_acceso" });
      continue;
    }

    resultados.push(await procesarMarca(marca, req.user.id));
  }

  res.json({ resultados });

  // Calcula la dirección de las marcas nuevas sin hacer esperar a la app
  procesarDireccionesPendientes();
};

/* ========================================
   GET bitácora de marcas de una obra en un día
======================================== */
export const getMarcasObra = async (req, res) => {
  try {
    const { obraId } = req.params;
    const { fecha } = req.query;
    const colDireccion = (await marcasTieneDireccion())
      ? "m.direccion"
      : "NULL::text AS direccion";

    const { rows } = await pool.query(
      `
      SELECT
        m.id, m.trabajador_id, t.nombre, m.tipo, m.metodo, m.distancia,
        m.marcado_en, m.fecha, m.hora, m.lat, m.lng, m.precision_m,
        ${colDireccion}, m.dispositivo, m.estado, m.recibido_en
      FROM asistencia_marcas m
      JOIN trabajadores t ON t.id = m.trabajador_id
      WHERE m.obra_id = $1 AND m.fecha = $2
      ORDER BY m.marcado_en ASC
    `,
      [obraId, fecha]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR GET MARCAS:", err);
    res.status(500).json({ message: "Error al obtener las marcas" });
  }
};
