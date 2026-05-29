import { Router } from "express";
import {
  getAsistenciaDia,
  guardarAsistenciaDia,
  historialObra,
  verificarDiaCerrado // 👈 NUEVO
} from "../controllers/asistencias.controller.js";

import { generarReporteAsistenciasPDF } from "../controllers/asistenciaReport.controller.js";

const router = Router();

// Obtener asistencia del día
router.get("/obra/:obraId", getAsistenciaDia);

// Guardar asistencia del día
router.post("/guardar-dia", guardarAsistenciaDia);

// Historial de obra
router.get("/obra/:obraId/historial", historialObra);

// 🔒 NUEVA RUTA → verificar si el día está cerrado
router.get("/dia-cerrado/:obraId", verificarDiaCerrado);

// Generar PDF
router.get("/reporte/:obraId", generarReporteAsistenciasPDF);

export default router;