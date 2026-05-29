import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import {
  getRequisicionesPendientes,
  getRequisicionesAprobadas,
  getRequisicionesRechazadas,
  getRequisicionParaAprobacion,
  autorizarRequisicion,
  rechazarRequisicion,
  getHistorialRequisicion
} from "../controllers/aprobaciones.controller.js";

const router = Router();

router.get("/pendientes", authMiddleware, getRequisicionesPendientes);
router.get("/aprobadas", authMiddleware, getRequisicionesAprobadas);
router.get("/rechazadas", authMiddleware, getRequisicionesRechazadas);

router.get("/:id", authMiddleware, getRequisicionParaAprobacion);
router.get("/:id/historial", authMiddleware, getHistorialRequisicion);

router.put("/:id/autorizar", authMiddleware, autorizarRequisicion);
router.put("/:id/rechazar", authMiddleware, rechazarRequisicion);

export default router;