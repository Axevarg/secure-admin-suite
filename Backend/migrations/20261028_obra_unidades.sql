/*
  Unidades operativas dentro de cada contrato/obra.
  Los vínculos existentes se migran a la unidad General para conservar el acceso.
*/
BEGIN;

CREATE TABLE IF NOT EXISTS obra_unidades (
  id BIGSERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT obra_unidades_id_obra_unique UNIQUE (id, obra_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS obra_unidades_nombre_unique
  ON obra_unidades (obra_id, LOWER(nombre));

INSERT INTO obra_unidades (obra_id, nombre)
SELECT id, 'General' FROM obras
ON CONFLICT DO NOTHING;

ALTER TABLE trabajadores_asignados
  ADD COLUMN IF NOT EXISTS unidad_id BIGINT;

UPDATE trabajadores_asignados ta
SET unidad_id = u.id
FROM obra_unidades u
WHERE u.obra_id = ta.obra_id
  AND LOWER(u.nombre) = 'general'
  AND ta.unidad_id IS NULL;

ALTER TABLE trabajadores_asignados
  ALTER COLUMN unidad_id SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trabajadores_asignados_unidad_obra_fk'
  ) THEN
    ALTER TABLE trabajadores_asignados
      ADD CONSTRAINT trabajadores_asignados_unidad_obra_fk
      FOREIGN KEY (unidad_id, obra_id)
      REFERENCES obra_unidades (id, obra_id);
  END IF;
END $$;

ALTER TABLE user_obras
  ADD COLUMN IF NOT EXISTS all_unidades BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS user_obra_unidades (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  unidad_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, obra_id, unidad_id),
  CONSTRAINT user_obra_unidades_unidad_obra_fk
    FOREIGN KEY (unidad_id, obra_id)
    REFERENCES obra_unidades (id, obra_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_obra_unidades_unidad_idx
  ON user_obra_unidades (obra_id, unidad_id);

ALTER TABLE asistencia_marcas
  ADD COLUMN IF NOT EXISTS unidad_id BIGINT;

-- El backend registra marcas rechazadas por el alcance de unidades para informar al móvil.
ALTER TABLE asistencia_marcas
  DROP CONSTRAINT IF EXISTS asistencia_marcas_estado_check;
ALTER TABLE asistencia_marcas
  ADD CONSTRAINT asistencia_marcas_estado_check
  CHECK (estado IN ('aplicada', 'dia_cerrado', 'no_asignado', 'sin_acceso'));

UPDATE asistencia_marcas m
SET unidad_id = COALESCE(
  (SELECT ta.unidad_id FROM trabajadores_asignados ta
   WHERE ta.obra_id=m.obra_id AND ta.trabajador_id=m.trabajador_id AND ta.activo=true
   ORDER BY ta.id DESC LIMIT 1),
  (SELECT general.id FROM obra_unidades general
   WHERE general.obra_id=m.obra_id AND LOWER(general.nombre)='general' LIMIT 1)
)
WHERE m.unidad_id IS NULL;

ALTER TABLE asistencias
  ADD COLUMN IF NOT EXISTS unidad_id BIGINT;

UPDATE asistencias a
SET unidad_id = COALESCE(
  (SELECT ta.unidad_id FROM trabajadores_asignados ta
   WHERE ta.obra_id=a.obra_id AND ta.trabajador_id=a.trabajador_id AND ta.activo=true
   ORDER BY ta.id DESC LIMIT 1),
  (SELECT general.id FROM obra_unidades general
   WHERE general.obra_id=a.obra_id AND LOWER(general.nombre)='general' LIMIT 1)
)
WHERE a.unidad_id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'asistencia_marcas_unidad_obra_fk'
  ) THEN
    ALTER TABLE asistencia_marcas
      ADD CONSTRAINT asistencia_marcas_unidad_obra_fk
      FOREIGN KEY (unidad_id, obra_id)
      REFERENCES obra_unidades (id, obra_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'asistencias_unidad_obra_fk'
  ) THEN
    ALTER TABLE asistencias
      ADD CONSTRAINT asistencias_unidad_obra_fk
      FOREIGN KEY (unidad_id, obra_id)
      REFERENCES obra_unidades (id, obra_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS asistencia_marcas_unidad_fecha_idx
  ON asistencia_marcas (obra_id, unidad_id, fecha);
CREATE INDEX IF NOT EXISTS asistencias_unidad_fecha_idx
  ON asistencias (obra_id, unidad_id, fecha);

COMMIT;
