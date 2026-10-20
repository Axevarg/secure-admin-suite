/* Prueba temporal de comunicación React Native → API SIGO → PostgreSQL */

CREATE TABLE IF NOT EXISTS pruebas_movil (
  id BIGSERIAL PRIMARY KEY,
  mensaje VARCHAR(280) NOT NULL,
  dispositivo VARCHAR(120),
  usuario_id VARCHAR(100),
  creado_en TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pruebas_movil_creado_en
  ON pruebas_movil (creado_en DESC);
