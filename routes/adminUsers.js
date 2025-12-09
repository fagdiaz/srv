const express = require("express");
const { admin, db } = require("../util/admin");
const authMiddleware = require("../middlewares/auth");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();
const USUARIOS_COL = "usuarios";
const ROLES_PERMITIDOS = ["admin", "operador", "cliente"];
const ESTADO_MAP = {
  activo: true,
  inactivo: false,
};

router.get(
  "/admin/users",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const { q, rol, estado } = req.query || {};
      let query = db.collection(USUARIOS_COL);

      if (rol && ROLES_PERMITIDOS.includes(String(rol).toLowerCase())) {
        query = query.where("rol", "==", String(rol).toLowerCase());
      }

      if (estado) {
        const estadoKey = String(estado).toLowerCase();
        const activoValue = ESTADO_MAP[estadoKey];
        if (typeof activoValue === "boolean") {
          query = query.where("activo", "==", activoValue);
        }
      }

      const snapshot = await query.get();
      let usuarios = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));

      if (q) {
        const term = String(q).toLowerCase();
        usuarios = usuarios.filter((usuario) => {
          const email = (usuario.email || "").toLowerCase();
          const displayName = (usuario.displayName || "").toLowerCase();
          return email.includes(term) || displayName.includes(term);
        });
      }

      console.log(
        `[admin/users] GET /admin/users uid:${req.user.uid} filtros -> rol:${rol} estado:${estado} q:${q}`
      );

      return res.status(200).json({ res: "ok", usuarios });
    } catch (error) {
      console.error("[admin/users] GET /admin/users error:", error);
      return res
        .status(500)
        .json({ res: "error", msg: "Error obteniendo usuarios" });
    }
  }
);

router.patch(
  "/admin/users/:uid/rol",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const uid = req.params.uid;
    const requestedRole = req.body && req.body.rol;
    const normalizedRole = String(requestedRole || "").toLowerCase();

    if (!ROLES_PERMITIDOS.includes(normalizedRole)) {
      return res
        .status(400)
        .json({ res: "error", msg: "Rol inválido" });
    }

    try {
      const docRef = db.collection(USUARIOS_COL).doc(uid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res
          .status(404)
          .json({ res: "error", msg: "Usuario no encontrado" });
      }

      await docRef.update({
        rol: normalizedRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updatedSnap = await docRef.get();
      const usuarioActualizado = updatedSnap.data() || {};

      // TODO: volver a agregar regla de último admin con logs si hace falta.
      console.log(
        `[admin/users] PATCH /admin/users/${uid}/rol admin:${req.user.uid} -> rol:${normalizedRole}`
      );

      return res.status(200).json({
        res: "ok",
        usuario: { uid, ...usuarioActualizado },
      });
    } catch (error) {
      console.error("PATCH /admin/users/:uid/rol error", error);
      return res
        .status(500)
        .json({ res: "error", msg: "Error actualizando usuario" });
    }
  }
);

router.patch(
  "/admin/users/:uid/estado",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const uid = req.params.uid;
    let { activo } = req.body || {};
    if (typeof activo === "string") {
      const lower = activo.toLowerCase();
      if (lower === "true") activo = true;
      else if (lower === "false") activo = false;
    }

    if (typeof activo !== "boolean") {
      return res
        .status(400)
        .json({ res: "error", msg: "El campo activo debe ser boolean" });
    }

    try {
      const docRef = db.collection(USUARIOS_COL).doc(uid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res
          .status(404)
          .json({ res: "error", msg: "Usuario no encontrado" });
      }

      await docRef.update({
        activo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updatedSnap = await docRef.get();
      const usuarioActualizado = updatedSnap.data() || {};

      console.log(
        `[admin/users] PATCH /admin/users/${uid}/estado admin:${req.user.uid} -> activo:${activo}`
      );

      return res.status(200).json({
        res: "ok",
        usuario: { uid, ...usuarioActualizado },
      });
    } catch (error) {
      console.error("PATCH /admin/users/:uid/estado error", error);
      return res
        .status(500)
        .json({ res: "error", msg: "Error actualizando usuario" });
    }
  }
);

module.exports = router;
