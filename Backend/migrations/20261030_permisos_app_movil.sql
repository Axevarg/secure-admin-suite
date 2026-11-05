-- Permisos por rol para acceder a SIGO Móvil y habilitar sus módulos.
INSERT INTO permissions (module, action)
SELECT nuevos.module, nuevos.action
FROM (VALUES
  ('app_movil', 'view'),
  ('asistencia_movil', 'view'),
  ('asistencia_movil', 'create'),
  ('asistencia_movil', 'edit'),
  ('asistencia_movil', 'delete'),
  ('requisiciones_movil', 'view'),
  ('requisiciones_movil', 'create'),
  ('requisiciones_movil', 'edit')
) AS nuevos(module, action)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p
  WHERE p.module = nuevos.module AND p.action = nuevos.action
);
