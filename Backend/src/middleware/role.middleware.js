export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      // roles puede ser string o array
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "No autorizado" });
      }

      next();
    } catch (err) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
  };
};