import { Router } from "express";
import {
  getContratistas,
  createContratista,
  updateContratista,
  deleteContratista
} from "../controllers/contratistas.controller.js";

const router = Router();

router.get("/", getContratistas);
router.post("/", createContratista);
router.put("/:id", updateContratista);
router.delete("/:id", deleteContratista);

export default router;