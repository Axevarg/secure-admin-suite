BEGIN;

ALTER TABLE colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_numero_empleado_formato;

UPDATE colaboradores
SET numero_empleado = LPAD(
  regexp_replace(numero_empleado, '\D', '', 'g')::BIGINT::TEXT,
  5,
  '0'
);

SELECT setval(
  'colaboradores_numero_empleado_seq',
  GREATEST((SELECT MAX(numero_empleado::BIGINT) FROM colaboradores), 1),
  true
);

ALTER TABLE colaboradores
  ALTER COLUMN numero_empleado SET DEFAULT (
    LPAD(nextval('colaboradores_numero_empleado_seq')::text, 5, '0')
  ),
  ADD CONSTRAINT colaboradores_numero_empleado_formato
    CHECK (numero_empleado ~ '^[0-9]{5}$');

COMMIT;
