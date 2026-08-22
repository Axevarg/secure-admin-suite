BEGIN;

CREATE SEQUENCE IF NOT EXISTS colaboradores_numero_empleado_seq START WITH 1;

ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS numero_empleado VARCHAR(30);

UPDATE colaboradores
SET numero_empleado = LPAD(
  nextval('colaboradores_numero_empleado_seq')::text,
  5,
  '0'
)
WHERE numero_empleado IS NULL OR BTRIM(numero_empleado) = '';

SELECT setval(
  'colaboradores_numero_empleado_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(NULLIF(regexp_replace(numero_empleado, '\D', '', 'g'), '')::BIGINT)
        FROM colaboradores
      ),
      0
    ),
    1
  ),
  true
);

ALTER TABLE colaboradores
  ALTER COLUMN numero_empleado SET DEFAULT (
    LPAD(nextval('colaboradores_numero_empleado_seq')::text, 5, '0')
  ),
  ALTER COLUMN numero_empleado SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS colaboradores_numero_empleado_unique
  ON colaboradores (UPPER(numero_empleado));

ALTER TABLE colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_numero_empleado_formato;

ALTER TABLE colaboradores
  ADD CONSTRAINT colaboradores_numero_empleado_formato
  CHECK (numero_empleado ~ '^[0-9]{5}$');

COMMIT;
