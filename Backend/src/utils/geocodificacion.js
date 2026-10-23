import { pool } from "../config/db.js";

// Geocodificación inversa con Nominatim (OpenStreetMap): convierte lat/lng
// de las marcas en una dirección en texto y la guarda en asistencia_marcas.
// Política de uso de Nominatim: máximo 1 consulta por segundo y User-Agent propio.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || "SIGO-Asistencia/1.0";
const PAUSA_MS = 1100;
const LOTE = 50;
const INTERVALO_MS = 10 * 60 * 1000;

let enProceso = false;

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

export const iniciarGeocodificacion = () => {
  procesarDireccionesPendientes();
  setInterval(procesarDireccionesPendientes, INTERVALO_MS);
};
