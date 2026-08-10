import { Router } from "express";
import {
  getTrabajadoresObra,
  asignarTrabajador,
  updateAsignacionTrabajador,
  deleteAsignacionTrabajador,
  getContratistasObra,
  asignarContratista,
  updateAsignacionContratista,
  deleteAsignacionContratista, getContratistasParaAsignar,
  asignarTrabajadorDeContratista
} from "../controllers/asignaciones.controller.js";

const router = Router();



// 👷 trabajadores
router.get("/obras/:id/trabajadores", getTrabajadoresObra);
router.post("/obras/:id/trabajadores", asignarTrabajador);
router.put("/asignaciones/trabajadores/:id", updateAsignacionTrabajador);
router.delete("/asignaciones/trabajadores/:id", deleteAsignacionTrabajador);

// 🏗 contratistas
router.get("/obras/:id/contratistas-disponibles", getContratistasParaAsignar);
router.post("/obras/:id/trabajadores-contratista", asignarTrabajadorDeContratista);
router.get("/obras/:id/contratistas", getContratistasObra);
router.post("/obras/:id/contratistas", asignarContratista);
router.put("/asignaciones/contratistas/:id", updateAsignacionContratista);
router.delete("/asignaciones/contratistas/:id", deleteAsignacionContratista);

export default router;