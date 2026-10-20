import { Router } from "express";
import { authMiddleware } from "../modules/auth/auth.middleware.js";
import {
  getRostrosObra,
  guardarRostro,
  eliminarRostro,
} from "../controllers/biometria.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/obras/:obraId/rostros", getRostrosObra);
router.put("/trabajadores/:id/rostro", guardarRostro);
router.delete("/trabajadores/:id/rostro", eliminarRostro);

export default router;
