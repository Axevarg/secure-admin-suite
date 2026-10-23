/*
  SIGO - Dirección en texto de cada marca de asistencia

  El backend llena esta columna en segundo plano con geocodificación inversa
  (Nominatim / OpenStreetMap) a partir de lat/lng.
*/
ALTER TABLE asistencia_marcas ADD COLUMN IF NOT EXISTS direccion TEXT;
