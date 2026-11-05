import { Router } from "express";
import { pool } from "../config/db.js";
import { getRequisicionesObra, crearRequisicion, editarRequisicion } from "../controllers/requisiciones.controller.js";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import { loadPermissions } from "../middleware/loadPermissions.js";
import { requirePermission } from "../middleware/requierePermission.js";
import { tieneAccesoObra } from "../utils/unidades.js";

const router = Router();

router.use(authMiddleware, loadPermissions);

router.get("/accesos", (req, res) => {
  res.json({ permissions: req.user.permissions });
});

router.use(requirePermission("app_movil", "view"));

router.get("/requisiciones/obra/:obraId", requirePermission("requisiciones_movil", "view"), async (req, res, next) => {
  if (!(await tieneAccesoObra(req.user.id, req.params.obraId))) {
    return res.status(403).json({ message: "No tienes acceso a esta obra" });
  }
  return getRequisicionesObra(req, res, next);
});

router.get("/requisiciones/catalogo/:obraId", requirePermission("requisiciones_movil", "view"), async (req, res) => {
  try {
    const { obraId } = req.params;
    if (!(await tieneAccesoObra(req.user.id, obraId)) ) {
      return res.status(403).json({ message: "No tienes acceso a esta obra" });
    }

    const [insumos, indirectos] = await Promise.all([
      pool.query(
        `SELECT i.id, i.clave, i.descripcion, i.unidad, c.nombre AS categoria,
          (i.cantidad
            + COALESCE((SELECT SUM(io.cantidad) FROM inventario_obra io WHERE io.insumo_id=i.id AND io.obra_id=i.obra_id),0)
            - COALESCE((SELECT SUM(rd.cantidad) FROM requisicion_detalle rd
              JOIN requisiciones r ON r.id=rd.requisicion_id
              WHERE rd.insumo_id=i.id AND (r.estado IS NULL OR r.estado <> 'rechazada')),0)
          ) AS disponible
         FROM insumos i JOIN insumo_categorias c ON c.id=i.categoria_id
         WHERE i.obra_id=$1 ORDER BY i.categoria_id, i.descripcion`,
        [obraId],
      ),
      pool.query(
        "SELECT id, nombre AS descripcion, unidad FROM indirectos_obra WHERE obra_id=$1 ORDER BY nombre",
        [obraId],
      ),
    ]);

    res.json({
      insumos: insumos.rows.map((item) => ({ ...item, tipo: "insumo" })),
      indirectos: indirectos.rows.map((item) => ({ ...item, tipo: "indirecto" })),
    });
  } catch (err) {
    console.error("MOBILE REQUISITION CATALOG ERROR:", err);
    res.status(500).json({ message: "No se pudo cargar el catálogo de la obra" });
  }
});

router.get("/requisiciones/detalle/:reqId", requirePermission("requisiciones_movil", "view"), async (req, res) => {
  try {
    const { reqId } = req.params;
    const cabecera = await pool.query(
      `SELECT r.id, r.folio, r.partida, LOWER(r.estado) AS estado,
              r.created_at, r.motivo_rechazo, r.obra_id, o.nombre AS obra,
              u.name AS solicitante
       FROM requisiciones r
       JOIN obras o ON o.id=r.obra_id
       LEFT JOIN users u ON u.id=r.usuario_id
       WHERE r.id=$1 AND r.usuario_id=$2`,
      [reqId, req.user.id],
    );
    const requisicion = cabecera.rows[0];
    if (!requisicion) return res.status(404).json({ message: "Requisición no encontrada" });
    if (!(await tieneAccesoObra(req.user.id, requisicion.obra_id)) ) {
      return res.status(403).json({ message: "No tienes acceso a esta obra" });
    }

    const detalles = await pool.query(
      `SELECT d.id, d.cantidad, d.fecha_requerida, d.tipo, d.insumo_id,
              d.indirecto_id, COALESCE(i.descripcion, ind.nombre) AS descripcion,
              COALESCE(i.unidad, ind.unidad) AS unidad
       FROM requisicion_detalle d
       LEFT JOIN insumos i ON i.id=d.insumo_id
       LEFT JOIN indirectos_obra ind ON ind.id=d.indirecto_id
       WHERE d.requisicion_id=$1 ORDER BY d.id`,
      [reqId],
    );
    res.json({ requisicion, detalles: detalles.rows });
  } catch (err) {
    console.error("MOBILE REQUISITION DETAIL ERROR:", err);
    res.status(500).json({ message: "No se pudo cargar la requisición" });
  }
});

router.post("/requisiciones/obra/:obraId", requirePermission("requisiciones_movil", "create"), async (req, res, next) => {
  if (!(await tieneAccesoObra(req.user.id, req.params.obraId))) {
    return res.status(403).json({ message: "No tienes acceso a esta obra" });
  }
  return crearRequisicion(req, res, next);
});

router.put("/requisiciones/:reqId", requirePermission("requisiciones_movil", "edit"), async (req, res, next) => {
  const result = await pool.query(
    "SELECT obra_id FROM requisiciones WHERE id=$1 AND usuario_id=$2",
    [req.params.reqId, req.user.id],
  );
  if (!result.rows[0]) return res.status(404).json({ message: "Requisición no encontrada" });
  if (!(await tieneAccesoObra(req.user.id, result.rows[0].obra_id))) {
    return res.status(403).json({ message: "No tienes acceso a esta obra" });
  }
  return editarRequisicion({ ...req, params: { ...req.params, id: req.params.reqId } }, res, next);
});

router.put("/requisiciones/:reqId/enviar", requirePermission("requisiciones_movil", "edit"), async (req, res) => {
  try {
    const reqActual = await pool.query(
      "SELECT obra_id FROM requisiciones WHERE id=$1 AND usuario_id=$2",
      [req.params.reqId, req.user.id],
    );
    if (!reqActual.rows[0]) return res.status(404).json({ message: "Requisición no encontrada" });
    if (!(await tieneAccesoObra(req.user.id, reqActual.rows[0].obra_id))) {
      return res.status(403).json({ message: "No tienes acceso a esta obra" });
    }
    const result = await pool.query(
      `UPDATE requisiciones r SET estado='enviada', motivo_rechazo=NULL, created_at=NOW()
       WHERE r.id=$1 AND r.usuario_id=$2 AND LOWER(r.estado) IN ('borrador','rechazada')
       RETURNING r.id`,
      [req.params.reqId, req.user.id],
    );
    if (!result.rows.length) return res.status(409).json({ message: "La requisición no existe, no tienes acceso o ya no se puede enviar" });
    res.json({ ok: true, message: "Requisición enviada" });
  } catch (err) {
    console.error("MOBILE REQUISITION SEND ERROR:", err);
    res.status(500).json({ message: "No se pudo enviar la requisición" });
  }
});

export default router;
