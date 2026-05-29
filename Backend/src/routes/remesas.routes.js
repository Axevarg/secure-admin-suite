import express from "express";
import {
  getRequisicionesSinRemesa,
  getDetallesRequisicion,
  generarRemesas,
  getRemesas,
  getRemesa,
  autorizarRemesa,
  marcarPagada,
  marcarRecibida, pagarRemesaConBanco
} from "../controllers/remesas.controller.js";

const router = express.Router();

//////////////////////////////////////////////////////////
// REQUISICIONES DISPONIBLES PARA GENERAR REMESA
//////////////////////////////////////////////////////////

// Obtener requisiciones autorizadas sin remesa
router.get("/requisiciones/aprobadas-sin-remesa", getRequisicionesSinRemesa);

// Obtener detalles de una requisición (para elegir proveedor por insumo)
router.get("/requisiciones/:id/detalles", getDetallesRequisicion);

//////////////////////////////////////////////////////////
// CREAR REMESAS DESDE REQUISICIÓN
//////////////////////////////////////////////////////////

// Generar remesas agrupadas por proveedor
router.post("/generar/:reqId", generarRemesas);

//////////////////////////////////////////////////////////
// REMESAS
//////////////////////////////////////////////////////////

// Listar remesas
router.get("/", getRemesas);

// Obtener detalle de remesa
router.get("/:id", getRemesa);

//////////////////////////////////////////////////////////
// FLUJO DE ESTADOS
//////////////////////////////////////////////////////////

// Autorizar remesa
router.put("/autorizar/:id", autorizarRemesa);

// Marcar como pagada
router.put("/pagada/:id", marcarPagada);

// Marcar como recibida
router.put("/recibida/:id", marcarRecibida);

router.put("/:id/pagar-con-banco", pagarRemesaConBanco);

export default router;