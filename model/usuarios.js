const { admin, db } = require("../util/admin");

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
    const { uid, email } = req.user || {};

    if (!uid) {
      return res.status(401).json({
        res: "error",
        msg: "UID no disponible"
      });
    }

    const userRef = db.collection("usuarios").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      const now = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set({
        uid,
        email: email || null,
        rol: "cliente",
        activo: true,
        createdAt: now,
        updatedAt: now,
      });
      const createdSnap = await userRef.get();
      const createdData = createdSnap.data() || {};

      const usuarioConDefaults = {
        ...createdData,
        rol: createdData.rol || "cliente",
        activo:
          createdData.activo !== undefined ? createdData.activo : true,
      };

      return res.json({
        res: "ok",
        usuario: { uid, ...usuarioConDefaults },
      });
    }

    const data = snap.data() || {};
    const usuarioConstruido = {
      ...data,
      rol: data.rol || "cliente",
      activo: data.activo !== undefined ? data.activo : true,
    };
    return res.json({
      res: "ok",
      usuario: { uid, ...usuarioConstruido },
    });
  } catch (err) {
    console.error("Error obteniendo usuario", err);
    return res.status(500).json({
      res: "error",
      msg: "Error obteniendo usuario"
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
