import { Router } from "express";
import { getDashboardObra } from "../controllers/obraDashboard.controller.js";

const router = Router();

// Dashboard individual por obra
router.get("/obras/:id/dashboard", getDashboardObra);

export default router;