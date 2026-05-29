import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import { getStockObra } from "../controllers/stock.controller.js";

const router = Router();

router.get("/obra/:obraId", authMiddleware, getStockObra);

export default router;