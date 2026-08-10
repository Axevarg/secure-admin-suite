import { Router } from "express";
import {
  getIndirectos,
  setPresupuestoIndirectos,
  agregarIndirecto,
  eliminarIndirecto,
} from "../controllers/indirectos.controller.js";

const router = Router();

router.get("/obra/:obraId", getIndirectos);
router.post("/presupuesto", setPresupuestoIndirectos);
router.post("/agregar", agregarIndirecto);
router.delete("/:id", eliminarIndirecto);

export default router;