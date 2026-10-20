/*
  SIGO - Sesiones (refresh tokens) por dispositivo

  Antes el login no guardaba el refresh token, así que /auth/refresh siempre
  fallaba. Se guarda un hash por cada inicio de sesión para que la web y la app
  móvil tengan sesiones independientes (cerrar sesión en una no cierra la otra).
*/

BEGIN;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expira_en TIMESTAMPTZ NOT NULL,
  revocado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);

COMMIT;
