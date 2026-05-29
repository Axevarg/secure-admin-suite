import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import {
  getRequisicionesObra,
  crearRequisicion,
  getDetalleRequisicion,
  cambiarEstadoReq,
  editarRequisicion,
  getRequisicionesAprobadasSinRemesa
} from "../controllers/requisiciones.controller.js";

const router = Router();



router.get("/aprobadas-sin-remesa", getRequisicionesAprobadasSinRemesa);

/* ==============================
   LISTAR REQUISICIONES POR OBRA
============================== */
router.get("/obra/:obraId", authMiddleware, getRequisicionesObra);

/* ==============================
   CREAR REQUISICION + DETALLES
============================== */
router.post("/obra/:obraId", authMiddleware, crearRequisicion);

/* ==============================
   VER DETALLE DE REQUISICION
============================== */
router.get("/:id", authMiddleware, getDetalleRequisicion);

/* ==============================
   CAMBIAR ESTADO
============================== */
router.put("/:id/estado", authMiddleware, cambiarEstadoReq);

/* ==============================
   EDITAR REQUISICION (borrador)
============================== */
router.put("/:id", authMiddleware, editarRequisicion); 




export default router;