ALTER TABLE evidencias_app
  ADD COLUMN IF NOT EXISTS direccion TEXT;

ALTER TABLE evidencias_app_fotos
  ADD COLUMN IF NOT EXISTS direccion TEXT;

CREATE INDEX IF NOT EXISTS evidencias_app_sin_direccion
  ON evidencias_app (capturada_en DESC) WHERE direccion IS NULL;

CREATE INDEX IF NOT EXISTS evidencias_app_fotos_sin_direccion
  ON evidencias_app_fotos (capturada_en DESC) WHERE direccion IS NULL;
