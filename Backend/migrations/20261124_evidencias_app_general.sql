DROP INDEX IF EXISTS evidencias_app_obra_fecha;

ALTER TABLE evidencias_app
  DROP COLUMN IF EXISTS obra_id;

CREATE INDEX IF NOT EXISTS evidencias_app_fecha
  ON evidencias_app (capturada_en DESC);
