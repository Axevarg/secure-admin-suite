import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import {
  crearPruebaMovil,
  listarPruebasMovil,
} from "../controllers/pruebasMovil.controller.js";

const router = Router();

router.get("/", authMiddleware, listarPruebasMovil);
router.post("/", authMiddleware, crearPruebaMovil);

export default router;
