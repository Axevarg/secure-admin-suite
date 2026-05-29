import express from "express";
import {
  getUsers,
  createUserByAdmin,
  updateUser,
  toggleUserStatus,
  adminResetPassword
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

export default router;