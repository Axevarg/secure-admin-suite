import { pool } from "../config/db.js";

// null significa que el usuario no tiene acceso a la obra.
export const obtenerUnidadesAccesibles = async (userId, obraId) => {
  const user = await pool.query(
    "SELECT all_obras FROM users WHERE id=$1",
    [userId]
  );
  if (!user.rows.length) return null;

  if (user.rows[0].all_obras) {
    const { rows } = await pool.query(
      `SELECT id, obra_id, nombre FROM obra_unidades
       WHERE obra_id=$1 AND activa=true ORDER BY nombre`,
      [obraId]
    );
    return rows;
  }

  const asignacion = await pool.query(
    `SELECT all_unidades FROM user_obras WHERE user_id=$1 AND obra_id=$2`,
    [userId, obraId]
  );
  if (!asignacion.rows.length) return null;

  if (asignacion.rows[0].all_unidades) {
    const { rows } = await pool.query(
      `SELECT id, obra_id, nombre FROM obra_unidades
       WHERE obra_id=$1 AND activa=true ORDER BY nombre`,
      [obraId]
    );
    return rows;
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.obra_id, u.nombre
     FROM user_obra_unidades au
     JOIN obra_unidades u ON u.id=au.unidad_id AND u.obra_id=au.obra_id
     WHERE au.user_id=$1 AND au.obra_id=$2 AND u.activa=true
     ORDER BY u.nombre`,
    [userId, obraId]
  );
  return rows;
};

export const tieneAccesoObra = async (userId, obraId) => {
  const unidades = await obtenerUnidadesAccesibles(userId, obraId);
  return unidades !== null && unidades.length > 0;
};

export const tieneAccesoUnidad = async (userId, obraId, unidadId) => {
  const unidades = await obtenerUnidadesAccesibles(userId, obraId);
  return unidades?.some((unidad) => String(unidad.id) === String(unidadId)) ?? false;
};

export const puedeAdministrarObra = async (userId, obraId) => {
  const result = await pool.query(
    `SELECT u.all_obras, uo.all_unidades,
       EXISTS (
         SELECT 1 FROM users usr
         JOIN role_permissions rp ON rp.role_id=usr.role_id
         JOIN permissions p ON p.id=rp.permission_id
         WHERE usr.id=u.id AND (
           (p.module='obras' AND p.action IN ('create','update','delete')) OR
           (p.module='trabajadores' AND p.action IN ('create','update','delete')) OR
           (p.module='users' AND p.action IN ('create','update')) OR
           (p.module='system' AND p.action='admin')
         )
       ) AS puede_admin
     FROM users u
     LEFT JOIN user_obras uo ON uo.user_id=u.id AND uo.obra_id=$2
     WHERE u.id=$1`,
    [userId, obraId]
  );
  const user = result.rows[0];
  return !!user && (!!user.all_obras || !!user.puede_admin);
};
