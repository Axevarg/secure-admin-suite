import { Router } from "express";
import {
  getCuentas, crearCuenta, toggleCuenta,
  getMovimientos, crearMovimiento, cancelarMovimiento,
  getDashboard, getEvidenciasMovimiento,
  subirEvidenciaMovimiento, getCategorias, upload,
} from "../controllers/bancos.controller.js";

import {authMiddleware}from "../modules/auth/auth.middleware.js"

const router = Router();

// Cuentas
router.get("/cuentas",           getCuentas);
router.post("/cuentas",          crearCuenta);
router.patch("/cuentas/:id/toggle", toggleCuenta);

// Movimientos
router.get("/movimientos",       getMovimientos);
router.post("/movimientos", authMiddleware, crearMovimiento);
router.patch("/movimientos/:id/cancelar", cancelarMovimiento);

// Dashboard
router.get("/dashboard",         getDashboard);

// Evidencias
router.get("/evidencias/:movimientoId",          getEvidenciasMovimiento);
router.post("/evidencias/upload", upload.array("files", 10), subirEvidenciaMovimiento);

// Catálogos
router.get("/categorias",        getCategorias);

export default router;