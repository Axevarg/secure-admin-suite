import { Router } from "express";
import {
  getTrabajadores,
  createTrabajador,
  updateTrabajador,
  deleteTrabajador, getTrabajadoresDisponibles
} from "../controllers/trabajadores.controller.js";
import { authMiddleware } from "../modules/auth/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/disponibles", getTrabajadoresDisponibles);
router.get("/", getTrabajadores);
router.post("/", createTrabajador);
router.put("/:id", updateTrabajador);
router.delete("/:id", deleteTrabajador);


export default router;