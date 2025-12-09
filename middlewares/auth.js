const { admin, db } = require("../util/admin");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch) {
    return res
      .status(401)
      .json({ res: "error", msg: "Token de autenticación requerido" });
  }

  const idToken = tokenMatch[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDoc = await db.collection("usuarios").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    req.user = {
      uid,
      email: decodedToken.email || userData.email || null,
      rol: (userData.rol || "cliente").toLowerCase(),
      activo: userData.activo !== undefined ? userData.activo : true,
    };

    return next();
  } catch (error) {
    console.error("[auth] verifyIdToken error:", error);
    return res
      .status(401)
      .json({ res: "error", msg: "Token inválido o expirado" });
  }
};

module.exports = authMiddleware;
