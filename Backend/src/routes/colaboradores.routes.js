import { Router } from "express";
import {
  getColaboradores, getColaborador, crearColaborador,
  editarColaborador, cambiarEstatus,
  subirDocumento, eliminarDocumento,
  getDepartamentos, getPuestos, crearPuesto,
  upload, getAsignaciones, asignarObra, desasignarObra, getCumpleanios
} from "../controllers/colaboradores.controller.js";

const router = Router();

// 1️⃣ CATÁLOGOS primero (rutas estáticas)
router.get("/catalogos/departamentos", getDepartamentos);
router.get("/catalogos/puestos",       getPuestos);
router.post("/catalogos/puestos",      crearPuesto);

// 2️⃣ DOCUMENTOS (rutas estáticas con prefijo fijo)
router.post("/documentos/subir",  upload.single("file"), subirDocumento);
router.delete("/documentos/:id",  eliminarDocumento);

// 2.5️⃣ CUMPLEAÑOS (ruta estática, DEBE ir antes de "/:id")
router.get("/cumpleanios", getCumpleanios);

// 3️⃣ COLABORADORES base
router.get("/",   getColaboradores);
router.post("/",  upload.single("foto"), crearColaborador);

// 4️⃣ RUTAS DINÁMICAS al final
router.get("/:id",           getColaborador);
router.put("/:id",           upload.single("foto"), editarColaborador);
router.patch("/:id/estatus", cambiarEstatus);

router.get("/:colaboradorId/asignaciones",  getAsignaciones);
router.post("/:colaboradorId/asignar",      asignarObra);
router.patch("/:colaboradorId/desasignar",  desasignarObra);

export default router;