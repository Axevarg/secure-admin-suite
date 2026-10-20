/* Revierte 20261020_asistencia_facial.sql. Borra los rostros y la bitácora de marcas. */
BEGIN;
ALTER TABLE asistencias
  DROP COLUMN IF EXISTS metodo_entrada,
  DROP COLUMN IF EXISTS metodo_salida;
DROP TABLE IF EXISTS asistencia_marcas;
DROP TABLE IF EXISTS trabajador_rostros;
COMMIT;
