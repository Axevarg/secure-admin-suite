import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import {
  uploadCotizacion,
  getRequisicionesPendientes,
  getRequisicionesAprobadas,
  getRequisicionesCotizadas,
  getRequisicionesRechazadas,
  getRequisicionParaAprobacion,
  autorizarRequisicion,
  rechazarRequisicion,
  cotizarRequisicion,
  getHistorialRequisicion
} from "../controllers/aprobaciones.controller.js";

const router = Router();

// Listados
router.get("/pendientes", authMiddleware, getRequisicionesPendientes);
router.get("/aprobadas", authMiddleware, getRequisicionesAprobadas);
router.get("/cotizadas", authMiddleware, getRequisicionesCotizadas);
router.get("/rechazadas", authMiddleware, getRequisicionesRechazadas);

// Detalle
router.get("/:id", authMiddleware, getRequisicionParaAprobacion);
router.get("/:id/historial", authMiddleware, getHistorialRequisicion);

// Acciones
router.put("/:id/autorizar", authMiddleware, autorizarRequisicion);
router.put("/:id/rechazar", authMiddleware, rechazarRequisicion);

// Cotizar (también sirve para editar una cotización ya existente)
router.post(
  "/:id/cotizacion",
  authMiddleware,
  uploadCotizacion,
  cotizarRequisicion
);

export default router;