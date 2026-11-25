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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evidencia_id, tipo)
);

CREATE INDEX IF NOT EXISTS evidencias_app_fotos_evidencia
  ON evidencias_app_fotos (evidencia_id, capturada_en);
