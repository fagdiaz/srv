const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ res: "error", msg: "No autenticado" });
  }

  if (req.user.rol !== "admin") {
    return res
      .status(403)
      .json({ res: "error", msg: "Requiere rol admin" });
  }

  if (req.user.activo === false) {
    return res
      .status(403)
      .json({ res: "error", msg: "Usuario inactivo" });
  }

  next();
};

module.exports = requireAdmin;
