/*
  SIGO - Asistencia facial de trabajadores

  El reconocimiento se hace en el teléfono. El servidor solo guarda:
    - trabajador_rostros: el vector (embedding) del rostro de cada trabajador, sin fotos.
    - asistencia_marcas: cada marca de entrada/salida enviada por la app (en línea o
      sincronizada después de trabajar sin internet).
  Las marcas se aplican a la tabla asistencias (primera entrada y última salida del día).
*/

BEGIN;

CREATE TABLE IF NOT EXISTS trabajador_rostros (
  id BIGSERIAL PRIMARY KEY,
  trabajador_id INTEGER NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  embedding REAL[] NOT NULL,
  modelo VARCHAR(60) NOT NULL,
  muestras SMALLINT NOT NULL DEFAULT 1,
  consentimiento_fecha TIMESTAMPTZ NOT NULL,
  creado_por VARCHAR(100),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un solo rostro vigente por trabajador.
CREATE UNIQUE INDEX IF NOT EXISTS trabajador_rostros_trabajador_unique
  ON trabajador_rostros (trabajador_id);

CREATE TABLE IF NOT EXISTS asistencia_marcas (
  id BIGSERIAL PRIMARY KEY,
  -- Id generado en el teléfono: evita duplicados si la app reenvía la cola.
  uuid_cliente UUID NOT NULL UNIQUE,
  obra_id INTEGER NOT NULL REFERENCES obras(id),
  trabajador_id INTEGER NOT NULL REFERENCES trabajadores(id),
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  metodo VARCHAR(10) NOT NULL CHECK (metodo IN ('facial', 'manual')),
  distancia REAL,
  modelo VARCHAR(60),
  marcado_en TIMESTAMPTZ NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  precision_m REAL,
  dispositivo VARCHAR(120),
  usuario_id VARCHAR(100),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('aplicada', 'dia_cerrado', 'no_asignado')),
  recibido_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistencia_marcas_obra_fecha
  ON asistencia_marcas (obra_id, fecha);

ALTER TABLE asistencias
  ADD COLUMN IF NOT EXISTS metodo_entrada VARCHAR(10) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS metodo_salida VARCHAR(10) NOT NULL DEFAULT 'manual';

COMMIT;
