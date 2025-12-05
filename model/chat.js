const { db } = require("../util/admin");

const resolveEmail = async (uid, providedEmail) => {
  if (providedEmail) return providedEmail;
  const snap = await db.collection("usuarios").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return data.email || null;
};

// POST /chat - solo mensajes privados
exports.addMessage = async (req, res) => {
  try {
    const body = req.body || {};
    console.log("POST chat:", body);

    const {
      uidRemitente,
      uidDestinatario,
      texto,
      emailRemitente,
      emailDestinatario,
    } = body;

    if (!uidRemitente || !uidDestinatario || !texto) {
      return res.status(400).json({ res: "error", msg: "Faltan datos" });
    }

    const remitenteEmail = await resolveEmail(uidRemitente, emailRemitente);
    const destinatarioEmail = await resolveEmail(
      uidDestinatario,
      emailDestinatario
    );

    if (!remitenteEmail || !destinatarioEmail) {
      return res.status(400).json({ res: "error", msg: "Faltan datos" });
    }

    const timestamp = Date.now();
    const docRef = db.collection("mensajes").doc();

    const payload = {
      id: docRef.id,
      uidRemitente,
      uidDestinatario,
      emailRemitente: remitenteEmail,
      emailDestinatario: destinatarioEmail,
      texto,
      timestamp,
      tipo: "privado",
      participantes: [uidRemitente, uidDestinatario],
    };

    await docRef.set(payload);

    return res.status(201).json({ res: "ok", id: docRef.id, timestamp });
  } catch (error) {
    console.error("Error addMessage:", error);
    return res
      .status(500)
      .json({ res: "fail", msg: "Error al guardar mensaje" });
  }
};

// GET /chat - solo mensajes privados entre dos usuarios
exports.getMessages = async (req, res) => {
  try {
    const { uidActual, uidOtro } = req.query || {};
    const parsedLimit = parseInt(req.query?.limit, 10);
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

    console.log("GET chat:", { uidActual, uidOtro, limit });

    if (!uidActual || !uidOtro) {
      return res.status(400).json({ res: "error", msg: "Faltan uids" });
    }

    const mensajesRef = db.collection("mensajes");
    const snapshot = await mensajesRef
      .where("tipo", "==", "privado")
      .where("participantes", "array-contains", uidActual)
      .orderBy("timestamp", "asc")
      .limit(limit)
      .get();

    const mensajes = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (m) =>
          (m.uidRemitente === uidActual && m.uidDestinatario === uidOtro) ||
          (m.uidRemitente === uidOtro && m.uidDestinatario === uidActual)
      );

    return res.status(200).json(mensajes);
  } catch (error) {
    console.error("Error getMessages:", error);
    return res
      .status(500)
      .json({ res: "fail", msg: "Error al obtener mensajes" });
  }
};
