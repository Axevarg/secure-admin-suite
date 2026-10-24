import { Router } from "express";
import {
  getAsistenciaDia,
  guardarJustificaciones,
  historialObra,
  verificarDiaCerrado // 👈 NUEVO
} from "../controllers/asistencias.controller.js";

import { generarReporteAsistenciasPDF } from "../controllers/asistenciaReport.controller.js";
import { sincronizarMarcas, getMarcasObra } from "../controllers/asistenciaMarcas.controller.js";
import { authMiddleware } from "../modules/auth/auth.middleware.js";

const router = Router();

// Obtener asistencia del día
router.get("/obra/:obraId", authMiddleware, getAsistenciaDia);

// La asistencia viene de la app móvil: la web solo justifica (el día se cierra solo al pasar)
router.post("/justificaciones", authMiddleware, guardarJustificaciones);

// Historial de obra
router.get("/obra/:obraId/historial", authMiddleware, historialObra);

// 🔒 NUEVA RUTA → verificar si el día está cerrado
router.get("/dia-cerrado/:obraId", authMiddleware, verificarDiaCerrado);

// 📱 Marcas de la app móvil (reconocimiento facial en el teléfono)
router.post("/marcas/sync", authMiddleware, sincronizarMarcas);
router.get("/obra/:obraId/marcas", authMiddleware, getMarcasObra);

// Generar PDF
// Sin token por ahora: la web lo abre con window.open, que no manda el header Authorization.
router.get("/reporte/:obraId", generarReporteAsistenciasPDF);

export default router;
