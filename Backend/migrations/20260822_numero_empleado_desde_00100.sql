BEGIN;

ALTER TABLE colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_numero_empleado_formato;

-- Se usan valores temporales únicos para evitar colisiones durante la reasignación.
WITH temporales AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST, id ASC) AS numero
  FROM colaboradores
)
UPDATE colaboradores AS c
SET numero_empleado = 'T' || LPAD(t.numero::TEXT, 5, '0')
FROM temporales AS t
WHERE c.id = t.id;

WITH numerados AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST, id ASC) + 99 AS numero
  FROM colaboradores
)
UPDATE colaboradores AS c
SET numero_empleado = LPAD(n.numero::TEXT, 5, '0')
FROM numerados AS n
WHERE c.id = n.id;

SELECT setval(
  'colaboradores_numero_empleado_seq',
  GREATEST((SELECT COALESCE(MAX(numero_empleado::BIGINT), 99) FROM colaboradores), 99),
  true
);

ALTER TABLE colaboradores
  ADD CONSTRAINT colaboradores_numero_empleado_formato
    CHECK (numero_empleado ~ '^[0-9]{5}$');

COMMIT;
