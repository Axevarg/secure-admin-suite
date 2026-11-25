import { pool } from "../config/db.js";
import { marcasTieneDireccion } from "./columnas.js";

// Geocodificación inversa con Nominatim (OpenStreetMap): convierte lat/lng
// de las marcas en una dirección en texto y la guarda en asistencia_marcas.
// Política de uso de Nominatim: máximo 1 consulta por segundo y User-Agent propio.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || "SIGO-Asistencia/1.0";
const PAUSA_MS = 1100;
const LOTE = 50;
const INTERVALO_MS = 10 * 60 * 1000;

let enProceso = false;
let evidenciasEnProceso = false;
let avisoSinColumna = false;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// "Calle 123, Colonia, Municipio, Estado"
const formatearDireccion = (data) => {
  const a = data?.address;
  if (!a) return data?.display_name || null;

  const calle = [a.road || a.pedestrian || a.footway, a.house_number]
    .filter(Boolean)
    .join(" ");
  const colonia = a.neighbourhood || a.suburb || a.quarter || a.hamlet;
  const municipio = a.city || a.town || a.village || a.municipality || a.county;

  const partes = [calle, colonia, municipio, a.state].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : data.display_name || null;
};

const buscarDireccion = async (lat, lng) => {
  const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);
  return formatearDireccion(await res.json());
};

// Procesa las marcas con ubicación y sin dirección. Las que fallan se
// reintentan en la siguiente vuelta.
export const procesarDireccionesPendientes = async () => {
  if (enProceso) return;
  enProceso = true;

  try {
    // Sin la migración de direccion no hay dónde guardar: se omite en silencio
    if (!(await marcasTieneDireccion())) {
      if (!avisoSinColumna) {
        console.log("Geocodificación omitida: falta la columna asistencia_marcas.direccion");
        avisoSinColumna = true;
      }
      return;
    }

    const { rows } = await pool.query(
      `
      SELECT id, lat, lng
      FROM asistencia_marcas
      WHERE direccion IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
      ORDER BY id DESC
      LIMIT $1
    `,
      [LOTE]
    );

    for (const marca of rows) {
      try {
        const direccion = await buscarDireccion(marca.lat, marca.lng);
        if (direccion) {
          await pool.query(
            "UPDATE asistencia_marcas SET direccion = $1 WHERE id = $2",
            [direccion.slice(0, 300), marca.id]
          );
        }
      } catch (err) {
        console.error(`ERROR DIRECCIÓN MARCA ${marca.id}:`, err.message);
      }
      await esperar(PAUSA_MS);
    }
  } catch (err) {
    console.error("ERROR PROCESAR DIRECCIONES:", err.message);
  } finally {
    enProceso = false;
  }
};

const procesarDireccionesEvidenciasApp = async () => {
  if (evidenciasEnProceso) return;
  evidenciasEnProceso = true;
  try {
    const { rows } = await pool.query(`
      SELECT origen, id, lat, lng
      FROM (
        SELECT 'principal'::text AS origen, id, lat, lng, capturada_en
        FROM evidencias_app
        WHERE direccion IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
        UNION ALL
        SELECT 'foto'::text AS origen, foto_id AS id, lat, lng, capturada_en
        FROM evidencias_app_fotos
        WHERE direccion IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
      ) pendientes
      ORDER BY capturada_en DESC
      LIMIT $1
    `, [20]);

    for (const evidencia of rows) {
      try {
        const direccion = await buscarDireccion(evidencia.lat, evidencia.lng);
        if (direccion) {
          const tabla = evidencia.origen === "foto" ? "evidencias_app_fotos" : "evidencias_app";
          const columnaId = evidencia.origen === "foto" ? "foto_id" : "id";
          await pool.query(`UPDATE ${tabla} SET direccion=$1 WHERE ${columnaId}=$2`, [direccion.slice(0, 300), evidencia.id]);
        }
      } catch (err) {
        console.error(`ERROR DIRECCIÓN EVIDENCIA APP ${evidencia.id}:`, err.message);
      }
      await esperar(PAUSA_MS);
    }
  } catch (err) {
    console.error("ERROR PROCESAR DIRECCIONES EVIDENCIAS APP:", err.message);
  } finally {
    evidenciasEnProceso = false;
  }
};

const procesarGeocodificacion = async () => {
  await procesarDireccionesPendientes();
  await procesarDireccionesEvidenciasApp();
};

export const iniciarGeocodificacion = () => {
  procesarGeocodificacion();
  setInterval(procesarGeocodificacion, INTERVALO_MS);
};
