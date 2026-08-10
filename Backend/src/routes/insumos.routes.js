import { Router } from "express";
import multer from "multer";
import {
  getInsumosObra,
  importarInsumosExcel,
  agregarInventario, agregarInsumoManual
} from "../controllers/insumos.controller.js";

const router = Router();
const upload = multer();

router.get("/obra/:obraId", getInsumosObra);
router.post("/importar/:obraId", upload.single("file"), importarInsumosExcel);

// ✅ INVENTARIO EXTRA
router.post("/inventario/agregar", agregarInventario);
router.post("/agregar", agregarInsumoManual);

export default router;