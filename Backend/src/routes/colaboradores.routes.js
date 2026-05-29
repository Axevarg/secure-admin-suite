import { Router } from "express";
import {
  getColaboradores, getColaborador, crearColaborador,
  editarColaborador, cambiarEstatus,
  subirDocumento, eliminarDocumento,
  getDepartamentos, getPuestos, crearPuesto,
  upload,
} from "../controllers/colaboradores.controller.js";

const router = Router();

// 1️⃣ CATÁLOGOS primero (rutas estáticas)
router.get("/catalogos/departamentos", getDepartamentos);
router.get("/catalogos/puestos",       getPuestos);
router.post("/catalogos/puestos",      crearPuesto);

// 2️⃣ DOCUMENTOS (rutas estáticas con prefijo fijo)
router.post("/documentos/subir",  upload.single("file"), subirDocumento);
router.delete("/documentos/:id",  eliminarDocumento);

// 3️⃣ COLABORADORES base
router.get("/",   getColaboradores);
router.post("/",  upload.single("foto"), crearColaborador);

// 4️⃣ RUTAS DINÁMICAS al final
router.get("/:id",           getColaborador);
router.put("/:id",           upload.single("foto"), editarColaborador);
router.patch("/:id/estatus", cambiarEstatus);

export default router;