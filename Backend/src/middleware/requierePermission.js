export const requirePermission = (module, action) => {
  return (req, res, next) => {
    const permissions = req.user.permissions || [];
    const needed = `${module}:${action}`;

    // 🔥 super admin bypass
    if (permissions.includes("system:admin")) {
      return next();
    }

    if (!permissions.includes(needed)) {
      return res.status(403).json({
        message: "No tienes permiso",
        permissionRequired: needed,
      });
    }

    next();
  };
};