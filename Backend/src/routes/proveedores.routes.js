import { Router } from "express";
import {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor, getResumenProveedor
} from "../controllers/proveedores.controller.js";

const router = Router();

router.get("/", getProveedores);
router.get("/:id/resumen", getResumenProveedor);
router.post("/", createProveedor);
router.put("/:id", updateProveedor);
router.delete("/:id", deleteProveedor);

export default router;