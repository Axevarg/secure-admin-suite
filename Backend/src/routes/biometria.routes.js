import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import { loadPermissions } from "../middleware/loadPermissions.js";
import { requirePermission } from "../middleware/requierePermission.js";
import {
  getRostrosObra,
  guardarRostro,
  eliminarRostro,
} from "../controllers/biometria.controller.js";

const router = Router();

router.use(authMiddleware, loadPermissions, requirePermission("app_movil", "view"));

router.get("/obras/:obraId/rostros", requirePermission("asistencia_movil", "view"), getRostrosObra);
router.get("/obras/:obraId/unidades/:unidadId/rostros", requirePermission("asistencia_movil", "view"), getRostrosObra);
router.put("/trabajadores/:id/rostro", requirePermission("asistencia_movil", "create"), guardarRostro);
router.delete("/trabajadores/:id/rostro", requirePermission("asistencia_movil", "delete"), eliminarRostro);

export default router;
