import { pool } from "../config/db.js";

// Cache de existencia de columnas. Sirve mientras la migración que agrega
// una columna no se haya corrido en todas las bases (ej. asistencia_marcas.direccion).
const cache = new Map();

export const columnaExiste = async (tabla, columna) => {
  const clave = `${tabla}.${columna}`;
  if (cache.has(clave)) return cache.get(clave);

  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
    [tabla, columna]
  );
  const existe = rows.length > 0;
  // Solo se cachea el "sí": si falta, se vuelve a revisar por si ya se migró.
  if (existe) cache.set(clave, true);
  return existe;
};

export const marcasTieneDireccion = () => columnaExiste("asistencia_marcas", "direccion");
