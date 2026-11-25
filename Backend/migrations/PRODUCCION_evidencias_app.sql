-- SIGO. Evidencias de entregas (App).
-- Ejecutar este archivo completo en la base de datos de SIGO.

BEGIN;

-- Evita que dos ejecuciones de este mismo script se apliquen a la vez.
SELECT pg_advisory_xact_lock(2026112501);

CREATE TABLE IF NOT EXISTS evidencias_app (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES users(id),
  titulo TEXT NOT NULL CHECK (length(trim(titulo)) BETWEEN 1 AND 160),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrega', 'comprobante')),
  nombre_archivo TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL UNIQUE,
  capturada_en TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  precision_m DOUBLE PRECISION,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si se instaló la versión inicial, conserva los vínculos anteriores.
-- Las evidencias nuevas pueden guardarse sin asociarlas a una obra.
DO $migracion$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'evidencias_app'::regclass
      AND attname = 'obra_id'
      AND NOT attisdropped
  ) THEN
    ALTER TABLE evidencias_app
      ALTER COLUMN obra_id DROP NOT NULL,
      ALTER COLUMN obra_id DROP DEFAULT;
  END IF;
END;
$migracion$;

CREATE TABLE IF NOT EXISTS evidencias_app_fotos (
  foto_id BIGSERIAL PRIMARY KEY,
  evidencia_id BIGINT NOT NULL REFERENCES evidencias_app(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrega', 'comprobante')),
  nombre_archivo TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL UNIQUE,
  capturada_en TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  precision_m DOUBLE PRECISION,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evidencia_id, tipo)
);

-- Actualiza las tablas si ya existían sin dirección.
ALTER TABLE evidencias_app ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE evidencias_app_fotos ADD COLUMN IF NOT EXISTS direccion TEXT;

CREATE INDEX IF NOT EXISTS evidencias_app_fecha
  ON evidencias_app (capturada_en DESC);

CREATE INDEX IF NOT EXISTS evidencias_app_fotos_evidencia
  ON evidencias_app_fotos (evidencia_id, capturada_en);

CREATE INDEX IF NOT EXISTS evidencias_app_sin_direccion
  ON evidencias_app (capturada_en DESC)
  WHERE direccion IS NULL;

CREATE INDEX IF NOT EXISTS evidencias_app_fotos_sin_direccion
  ON evidencias_app_fotos (capturada_en DESC)
  WHERE direccion IS NULL;

-- Registra los permisos. La asignación a roles se hace desde SIGO.
INSERT INTO permissions (module, action)
SELECT 'evidencias_app', nuevo.action
FROM (VALUES ('view'), ('create')) AS nuevo(action)
WHERE NOT EXISTS (
  SELECT 1
  FROM permissions p
  WHERE p.module = 'evidencias_app'
    AND p.action = nuevo.action
);

COMMIT;

SELECT module, action
FROM permissions
WHERE module = 'evidencias_app' AND action IN ('view', 'create')
ORDER BY action;
