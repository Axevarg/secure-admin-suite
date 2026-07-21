import { Router } from "express";
import {
  getObras,
  getObraById,
  createObra,
  updateObra,
  deleteObra, 
  getProjectStatus,
  getObrasList
} from "../controllers/obras.controller.js";

import { authMiddleware } from "../modules/auth/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/project-status", getProjectStatus);
router.get("/all", getObrasList);      // 👈 nueva ruta, sin filtro, para armar el checklist de asignación
router.get("/", getObras);             // 👈 filtrada por usuario, para el listado normal
router.get("/:id", getObraById);
router.post("/", createObra);
router.put("/:id", updateObra);
router.delete("/:id", deleteObra);

export default router;