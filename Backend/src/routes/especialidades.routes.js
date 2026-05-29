import { Router } from "express";
import {
  getEspecialidades,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad,
} from "../controllers/especialidades.controller.js";

const router = Router();

router.get("/", getEspecialidades);
router.post("/", createEspecialidad);
router.put("/:id", updateEspecialidad);
router.delete("/:id", deleteEspecialidad);

export default router;