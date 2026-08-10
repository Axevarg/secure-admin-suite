import { Router } from "express";
import {
  getCuentas, crearCuenta, toggleCuenta,
  getMovimientos, crearMovimiento, cancelarMovimiento,
  getDashboard, getEvidenciasMovimiento,
  subirEvidenciaMovimiento, getCategorias, upload, getProveedores, actualizarMovimiento, confirmarMovimiento,
  actualizarFacturaUuid, getAbonosMovimiento,
  crearAbono,
  eliminarAbono,
  getEvidenciasAbono,
  subirEvidenciaAbono,
  uploadAbono,
} from "../controllers/bancos.controller.js";

import { authMiddleware } from "../modules/auth/auth.middleware.js";

const router = Router();

// Cuentas
router.get("/cuentas",           getCuentas);
router.post("/cuentas",          authMiddleware, crearCuenta); // ← usa created_by
router.patch("/cuentas/:id/toggle", toggleCuenta);

// Movimientos
router.get("/movimientos",       getMovimientos);
router.post("/movimientos", authMiddleware, crearMovimiento);
router.patch("/movimientos/:id/cancelar", authMiddleware, cancelarMovimiento); // ← si luego quieres trazabilidad de quién cancela

// Dashboard
router.get("/dashboard",         getDashboard);

// Evidencias
router.get("/evidencias/:movimientoId",          getEvidenciasMovimiento);
router.post("/evidencias/upload", authMiddleware, upload.array("files", 10), subirEvidenciaMovimiento); // ← usa uploaded_by
router.get("/movimientos/:movimientoId/abonos", getAbonosMovimiento);
router.post("/movimientos/:movimientoId/abonos", crearAbono);
router.delete("/abonos/:abonoId", eliminarAbono);
router.get("/abonos/evidencias/:abonoId", getEvidenciasAbono);
router.post("/abonos/evidencias/upload", uploadAbono.array("files"), subirEvidenciaAbono);

// Catálogos
router.get("/categorias",        getCategorias);
router.get("/proveedores", getProveedores);

router.put("/movimientos/:id", authMiddleware, actualizarMovimiento);
router.patch("/movimientos/:id/confirmar", authMiddleware, confirmarMovimiento); // ← EL FIX PRINCIPAL
router.patch("/movimientos/:id/factura-uuid", authMiddleware, actualizarFacturaUuid);

export default router;