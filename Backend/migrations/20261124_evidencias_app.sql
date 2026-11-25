CREATE TABLE IF NOT EXISTS evidencias_app (
  id BIGSERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras(id),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evidencias_app_obra_fecha
  ON evidencias_app (obra_id, capturada_en DESC);
