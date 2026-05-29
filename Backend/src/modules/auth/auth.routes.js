import express from "express";
import { login, create, activateAccount, refreshSession, logout, getUsers, forgotPassword, resetPassword } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, async (req, res) => {
  res.json({
    message: "Acceso permitido 🔐",
    user: req.user,
  });
});
router.post("/login", login);
router.post(
  "/create-user",
  authMiddleware,
  requireRole("admin"),
  create
);
router.get(
  "/all-users",
  authMiddleware,
  requireRole(["admin", "manager"]),
  getUsers
);
router.post("/activate-account", activateAccount);
router.post("/refresh", refreshSession);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;