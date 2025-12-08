const { db } = require("../util/admin");

exports.usuarios = async (req, res) => {
  const usuariosRef = db.collection("usuarios");

  try {
    const snapshot = await usuariosRef.get();

    const data = snapshot.docs.map((doc) => {
      const { pass, ...rest } = doc.data();
      return {
        uid: doc.id,
        ...rest,
      };
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error en /usuarios:", error);
    return res
      .status(500)
      .json({ general: "Something went wrong, please try again" });
  }
};

exports.addUser = async (req, res) => {
  const usuariosRef = db.collection("usuarios");
  const user = req.body.user || {};
  const uid = req.body.uid;

  console.log("Signup addUser:", uid, user.email);

  if (!uid || !user.email) {
    return res
      .status(400)
      .json({ res: "fail", message: "Faltan datos obligatorios" });
  }

  const usuarioPayload = {
    email: user.email,
    nombre: user.nombre || "",
    rol: "cliente",
    proveedor: "email",
    createdAt: new Date().toISOString(),
  };

  if (user.dni) usuarioPayload.dni = user.dni;
  if (user.provincia) usuarioPayload.provincia = user.provincia;
  if (user.fnac) usuarioPayload.fnac = user.fnac;

  try {
    await usuariosRef.doc(uid).set(usuarioPayload, { merge: true });
    return res.status(200).json({ res: "ok", usuario: usuarioPayload });
  } catch (error) {
    console.error("Ocurrio un error", error);
    return res.status(500).json({ res: "fail", err: error });
  }
};


/* ... tus otros exports: usuarios, addUser, etc ... */

exports.obtenerUsuario = async (req, res) => {
  try {
    // viene como query param: /obtenerUsuario?uid=xxxx
    const uid = req.query.uid;
    console.log("ObtenerUsuario:", uid);

    if (!uid) {
      return res.status(400).json({
        res: "fail",
        message: "Debe enviar uid como query param"
      });
    }

    const docRef = db.collection("usuarios").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ res: "not_found" });
    }

    const data = docSnap.data();

    return res.status(200).json({
      res: "ok",
      usuario: { uid, ...data }
    });
  } catch (error) {
    const details = (error && error.details && String(error.details)) || "";
    const isQuota =
      error?.code === 8 ||
      details.toLowerCase().includes("quota exceeded");

    console.error("Error en obtenerUsuario:", error);
    if (isQuota) {
      return res.status(503).json({ error: "quota_exceeded" });
    }
    return res.status(500).json({
      res: "fail",
      message: "Error al obtener usuario",
      err: String(error)
    });
  }
};


exports.getUser = async (req, res) => {
    const uid = req.body.uid;
    console.log("llego")
    console.log("UID", uid)
    return res.json({res:"ok"})
}

exports.googleLogin = async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;

    console.log("GoogleLogin:", uid, email);

    if (!uid || !email) {
      return res.status(400).json({
        res: "fail",
        message: "Debe enviar uid y email en el body"
      });
    }

    const usuariosRef = db.collection("usuarios");
    const docRef = usuariosRef.doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      // Usuario nuevo: lo creamos como cliente
      const user = {
        email,
        nombre: displayName || "",
        rol: "cliente",
        proveedor: "google",
        createdAt: new Date().toISOString()
      };

      await docRef.set(user);

      return res.status(201).json({
        res: "ok",
        nuevo: true,
        usuario: user
      });
    } else {
      // Usuario ya existente: devolvemos sus datos
      const data = docSnap.data();
      if (!data.rol) {
        await docRef.set({ rol: "cliente" }, { merge: true });
      }
      return res.status(200).json({
        res: "ok",
        nuevo: false,
        usuario: { ...data, rol: data.rol || "cliente" }
      });
    }
  } catch (error) {
    console.error("Error en googleLogin:", error);
    return res.status(500).json({
      res: "fail",
      message: "Error en login con Google",
      err: String(error)
    });
  }
};
