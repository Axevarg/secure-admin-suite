import { Router } from "express";
import {
  subirEvidenciaRemesa,
  getEvidenciasRemesa,
  eliminarEvidencia,
  upload, getRemesasPorObra
} from "../controllers/evidencias.controller.js";

const router = Router();

router.get("/obra/:obraId", getRemesasPorObra);
router.get("/remesa/:remesaId", getEvidenciasRemesa);
router.post("/remesa/upload", upload.array("files", 20), subirEvidenciaRemesa);
router.delete("/:id", eliminarEvidencia);

export default router;