/*
  SIGO - Migración de producción: número de empleado

  Resultado:
    - Agrega colaboradores.numero_empleado si todavía no existe.
    - Asigna números desde 00100 a colaboradores que aún no tengan uno válido.
    - Reserva los números 00001 a 00099.
    - Los nuevos colaboradores reciben automáticamente el siguiente número.
    - El número es obligatorio, único y debe tener exactamente cinco cifras.

  Recomendaciones antes de ejecutar:
    1. Realizar un respaldo de la base de datos de producción.
    2. Ejecutar primero en una copia reciente de producción.
    3. Ejecutar este archivo una sola vez durante una ventana de mantenimiento.
    4. Desplegar el backend actualizado inmediatamente después de la migración.
*/

BEGIN;

-- Evita que dos ejecuciones de esta migración corran al mismo tiempo.
SELECT pg_advisory_xact_lock(2026082201);

CREATE SEQUENCE IF NOT EXISTS colaboradores_numero_empleado_seq
  START WITH 100
  MINVALUE 100;

ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS numero_empleado VARCHAR(5);

-- Se retiran temporalmente las validaciones para poder completar registros previos.
ALTER TABLE colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_numero_empleado_formato;

DROP INDEX IF EXISTS colaboradores_numero_empleado_unique;

/*
  Conserva números que ya sean válidos (cinco cifras y mayores o iguales a 00100).
  A los registros sin número válido les asigna números consecutivos después del
  mayor número válido existente, comenzando en 00100.
*/
WITH base AS (
  SELECT GREATEST(
    COALESCE(
      MAX(
        CASE
          WHEN numero_empleado ~ '^[0-9]{5}$'
          THEN CASE
            WHEN numero_empleado::BIGINT >= 100
            THEN numero_empleado::BIGINT
          END
        END
      ),
      99
    ),
    99
  ) AS ultimo_numero
  FROM colaboradores
),
pendientes AS (
  SELECT
    c.id,
    ROW_NUMBER() OVER (
      ORDER BY c.created_at ASC NULLS LAST, c.id ASC
    ) AS consecutivo
  FROM colaboradores AS c
  WHERE COALESCE(
    CASE
      WHEN c.numero_empleado ~ '^[0-9]{5}$'
      THEN c.numero_empleado::BIGINT
    END,
    0
  ) < 100
),
nuevos_numeros AS (
  SELECT
    p.id,
    LPAD((b.ultimo_numero + p.consecutivo)::TEXT, 5, '0') AS numero_empleado
  FROM pendientes AS p
  CROSS JOIN base AS b
)
UPDATE colaboradores AS c
SET numero_empleado = n.numero_empleado
FROM nuevos_numeros AS n
WHERE c.id = n.id;

-- Detiene la migración si los datos existentes contienen números válidos repetidos.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM colaboradores
    GROUP BY numero_empleado
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Existen números de empleado duplicados. La transacción fue cancelada.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM colaboradores
    WHERE numero_empleado::BIGINT > 99999
  ) THEN
    RAISE EXCEPTION
      'La numeración excede 99999. La transacción fue cancelada.';
  END IF;
END
$$;

-- Continúa después del número más alto actualmente asignado.
SELECT setval(
  'colaboradores_numero_empleado_seq',
  GREATEST(COALESCE((SELECT MAX(numero_empleado::BIGINT) FROM colaboradores), 100), 100),
  COALESCE((SELECT MAX(numero_empleado::BIGINT) FROM colaboradores), 0) >= 100
);

ALTER SEQUENCE colaboradores_numero_empleado_seq
  OWNED BY colaboradores.numero_empleado;

ALTER TABLE colaboradores
  ALTER COLUMN numero_empleado SET DEFAULT (
    LPAD(nextval('colaboradores_numero_empleado_seq')::TEXT, 5, '0')
  ),
  ALTER COLUMN numero_empleado SET NOT NULL;

ALTER TABLE colaboradores
  ADD CONSTRAINT colaboradores_numero_empleado_formato
  CHECK (
    numero_empleado ~ '^[0-9]{5}$'
    AND numero_empleado::BIGINT >= 100
  );

CREATE UNIQUE INDEX colaboradores_numero_empleado_unique
  ON colaboradores (numero_empleado);

COMMIT;

/* =========================================================
   VERIFICACIÓN
   Estas consultas no modifican información.
   ========================================================= */

SELECT
  COUNT(*) AS total_colaboradores,
  COUNT(numero_empleado) AS colaboradores_con_numero,
  COUNT(DISTINCT numero_empleado) AS numeros_unicos,
  MIN(numero_empleado) AS primer_numero,
  MAX(numero_empleado) AS ultimo_numero
FROM colaboradores;

SELECT
  id,
  numero_empleado,
  nombre,
  apellido_paterno,
  apellido_materno
FROM colaboradores
ORDER BY numero_empleado;
