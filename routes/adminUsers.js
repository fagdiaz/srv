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

const isLastActiveAdmin = async (dbInstance, targetUid) => {
  const snapshot = await dbInstance
    .collection(USUARIOS_COL)
    .where("rol", "==", "admin")
    .where("activo", "==", true)
    .get();

  if (snapshot.empty) {
    return false;
  }
  if (snapshot.size === 1 && snapshot.docs[0].id === targetUid) {
    return true;
  }
  return false;
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
      let usuarios = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          uid: doc.id,
          rol: data.rol || "cliente",
          activo: data.activo !== undefined ? data.activo : true,
          ...data,
        };
      });

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
      return res.status(400).json({ message: "Rol inválido" });
    }

    try {
      const docRef = db.collection(USUARIOS_COL).doc(uid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const usuarioExistente = docSnap.data() || {};
      const rolActual = (usuarioExistente.rol || "cliente").toLowerCase();
      const activoActual =
        usuarioExistente.activo !== undefined
          ? usuarioExistente.activo
          : true;

      console.log("[PATCH /admin/users/:uid/rol]", {
        ejecutadoPor: req.user && req.user.uid,
        targetUid: uid,
        rolAnterior: rolActual,
        rolNuevo: normalizedRole,
      });

      if (
        rolActual === "admin" &&
        activoActual === true &&
        normalizedRole !== "admin"
      ) {
        const lastAdmin = await isLastActiveAdmin(db, uid);
        if (lastAdmin) {
          return res.status(400).json({
            message: "No se puede modificar el último administrador activo.",
          });
        }
      }

      await docRef.update({
        rol: normalizedRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updatedSnap = await docRef.get();
      const usuarioActualizado = updatedSnap.data() || {};

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
      if (lower === "true" || lower === "1") activo = true;
      else if (lower === "false" || lower === "0") activo = false;
    } else if (typeof activo === "number") {
      activo = activo === 1;
    }

    if (typeof activo !== "boolean") {
      return res.status(400).json({ message: "El campo activo debe ser boolean" });
    }

    try {
      const docRef = db.collection(USUARIOS_COL).doc(uid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const usuarioExistente = docSnap.data() || {};
      const rolActual = (usuarioExistente.rol || "cliente").toLowerCase();
      const activoActual =
        usuarioExistente.activo !== undefined
          ? usuarioExistente.activo
          : true;

      console.log("[PATCH /admin/users/:uid/estado]", {
        ejecutadoPor: req.user && req.user.uid,
        targetUid: uid,
        activoAnterior: activoActual,
        activoNuevo: activo,
      });

      if (
        rolActual === "admin" &&
        activoActual === true &&
        activo === false
      ) {
        const lastAdmin = await isLastActiveAdmin(db, uid);
        if (lastAdmin) {
          return res.status(400).json({
            message: "No se puede desactivar al último administrador activo.",
          });
        }
      }

      await docRef.update({
        activo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updatedSnap = await docRef.get();
      const usuarioActualizado = updatedSnap.data() || {};

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
