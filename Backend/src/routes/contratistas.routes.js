import { Router } from "express";
import {
  getContratistas,
  createContratista,
  updateContratista,
  deleteContratista,
  getTrabajadoresByContratista,
  createTrabajadorContratista,
  updateTrabajadorContratista,
  deleteTrabajadorContratista,
} from "../controllers/contratistas.controller.js";

const router = Router();

// Contratistas
router.get("/", getContratistas);
router.post("/", createContratista);
router.put("/:id", updateContratista);
router.delete("/:id", deleteContratista);

// Trabajadores de contratista (anidado bajo /contratistas)
router.get("/:contratistaId/trabajadores", getTrabajadoresByContratista);
router.post("/:contratistaId/trabajadores", createTrabajadorContratista);
router.put("/:contratistaId/trabajadores/:trabajadorId", updateTrabajadorContratista);
router.delete("/:contratistaId/trabajadores/:trabajadorId", deleteTrabajadorContratista);

export default router;