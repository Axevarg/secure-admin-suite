import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import { loadPermissions } from "../middleware/loadPermissions.js";
import { requirePermission } from "../middleware/requierePermission.js";
import { listarEvidenciasApp, verArchivoEvidenciaApp } from "../controllers/evidenciasApp.controller.js";

const router = Router();

router.use(authMiddleware, loadPermissions, requirePermission("evidencias_app", "view"));
router.get("/", listarEvidenciasApp);
router.get("/archivo/:evidenciaId/:tipo", verArchivoEvidenciaApp);

export default router;
