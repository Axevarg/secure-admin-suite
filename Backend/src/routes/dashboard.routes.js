import express from "express";
import { getDashboardGlobal } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/global", getDashboardGlobal);

export default router;