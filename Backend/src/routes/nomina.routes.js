import { Router } from "express";
import {
  getPeriodos, getPeriodo, crearPeriodo,
  actualizarDetalle, cerrarPeriodo, pagarNomina,getReporteBancario,generarDispersionPDF
} from "../controllers/nomina.controller.js";

const router = Router();

router.get("/",              getPeriodos);
router.get("/:id",           getPeriodo);
router.post("/",             crearPeriodo);
router.put("/detalle/:id",   actualizarDetalle);
router.patch("/:id/cerrar",  cerrarPeriodo);
router.patch("/:id/pagar",   pagarNomina);
router.get(
  "/periodos/:id/reporte-bancario",
  getReporteBancario
);

router.get(
  "/periodos/:id/dispersion-pdf",
  generarDispersionPDF
);

export default router;