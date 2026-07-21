import express from "express";
import {
  getUsers,
  createUserByAdmin,
  updateUser,
  toggleUserStatus,
  adminResetPassword,
  getObrasList,
  getUserObras,   // 👈 falta
  setUserObras,   // 👈 falta
} from "../controllers/users.controller.js";

import { authMiddleware } from "../modules/auth/auth.middleware.js";

const router = express.Router();

// todas protegidas
router.use(authMiddleware);

router.get("/", getUsers);
router.post("/", createUserByAdmin);
router.put("/:id", updateUser);
router.patch("/:id/toggle-active", toggleUserStatus);
router.post("/:id/reset-password", adminResetPassword);

router.get("/:id/obras", getUserObras);   // 👈 falta
router.put("/:id/obras", setUserObras);   // 👈 falta

export default router;