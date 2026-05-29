import { verifyAccessToken } from "../../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // 🔥 MUY IMPORTANTE: el JWT debe traer el id
    if (!decoded?.id) {
      return res.status(401).json({ message: "Token inválido" });
    }

    // 👤 guardamos usuario base
    req.user = {
      id: decoded.id,
      email: decoded.email,
      permissions: [] // ← se llenará después
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expirado o inválido" });
  }
};