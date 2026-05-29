import { Router } from "express";
import {
  getTrabajadores,
  createTrabajador,
  updateTrabajador,
  deleteTrabajador, getTrabajadoresDisponibles
} from "../controllers/trabajadores.controller.js";

const router = Router();

router.get("/disponibles", getTrabajadoresDisponibles);
router.get("/", getTrabajadores);
router.post("/", createTrabajador);
router.put("/:id", updateTrabajador);
router.delete("/:id", deleteTrabajador);


export default router;