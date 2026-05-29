import { Router } from "express";
import {
  getObras,
  getObraById,
  createObra,
  updateObra,
  deleteObra, 
  getProjectStatus
} from "../controllers/obras.controller.js";


const router = Router();

router.get("/project-status", getProjectStatus);    
router.get("/", getObras);
router.get("/:id", getObraById);
router.post("/", createObra);
router.put("/:id", updateObra);
router.delete("/:id", deleteObra);


export default router;  