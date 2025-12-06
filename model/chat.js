const { db } = require("../util/admin");

// Crea un ID unico de chat para un par de UIDs, sin importar el orden
const buildChatId = (uidA, uidB) => {
  if (!uidA || !uidB) return null;
  return [uidA, uidB].sort().join("_"); // ej: "uidCliente_uidOperador"
};

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
    console.log("POST /chat body:", body);

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

    const chatId = buildChatId(uidRemitente, uidDestinatario);
    if (!chatId) {
      return res
        .status(400)
        .json({ res: "error", msg: "No se pudo generar chatId" });
    }

    const remitenteEmail = await resolveEmail(uidRemitente, emailRemitente);
    const destinatarioEmail = await resolveEmail(
      uidDestinatario,
      emailDestinatario
    );

    if (!remitenteEmail || !destinatarioEmail) {
      return res
        .status(400)
        .json({ res: "error", msg: "No se pudieron resolver los emails" });
    }

    const timestamp = Date.now();
    const docRef = db.collection("mensajes").doc();

    const payload = {
      id: docRef.id,
      chatId,
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
    const { uidActual, uidOtro, limit } = req.query || {};
    const parsedLimit = parseInt(limit, 10);
    const effectiveLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

    console.log("GET /chat query:", { uidActual, uidOtro, limit: effectiveLimit });

    if (!uidActual || !uidOtro) {
      return res
        .status(400)
        .json({ error: "uidActual y uidOtro son requeridos" });
    }

    const chatId = buildChatId(uidActual, uidOtro);
    if (!chatId) {
      return res
        .status(400)
        .json({ error: "No se pudo generar chatId en GET /chat" });
    }

    const mensajesRef = db.collection("mensajes");
    const snapshot = await mensajesRef
      .where("chatId", "==", chatId)
      .orderBy("timestamp", "asc")
      .limit(effectiveLimit)
      .get();

    const mensajes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log("GET /chat -> mensajes encontrados:", mensajes.length);

    return res.status(200).json(mensajes);
  } catch (error) {
    console.error("Error getMessages:", error);
    return res
      .status(500)
      .json({ res: "fail", msg: "Error al obtener mensajes" });
  }
};

// Devuelve la lista de conversaciones (ultimo mensaje por chatId) para uidActual
exports.getConversations = async (uidActual, limit = 50) => {
  const parsedLimit = parseInt(limit, 10);
  const effectiveLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

  if (!uidActual) {
    throw new Error("uidActual es requerido para listar conversaciones");
  }

  // Query SIN orderBy para evitar requerir índice compuesto
  const snapshot = await db
    .collection("mensajes")
    .where("participantes", "array-contains", uidActual)
    .limit(effectiveLimit)
    .get();

  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Ordenar en memoria por timestamp descendente (más nuevo primero)
  docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const conversaciones = new Map();

  docs.forEach((data) => {
    const { chatId, uidRemitente, uidDestinatario, texto, timestamp } = data;
    if (!chatId) return;

    const uidOtro = uidRemitente === uidActual ? uidDestinatario : uidRemitente;
    const emailOtro =
      uidRemitente === uidActual ? data.emailDestinatario : data.emailRemitente;

    if (!uidOtro) return;

    // Como ya están ordenados desc, el primero que entra para cada chatId es el último mensaje
    if (!conversaciones.has(chatId)) {
      conversaciones.set(chatId, {
        chatId,
        uidOtro,
        emailOtro: emailOtro || "",
        ultimoMensaje: texto,
        timestamp,
      });
    }
  });

  return Array.from(conversaciones.values());
};


// Handler HTTP para GET /chat/conversaciones
exports.getConversationsRoute = async (req, res) => {
  try {
    const { uidActual, limit } = req.query || {};
    console.log("GET /chat/conversaciones query:", { uidActual, limit });

    if (!uidActual) {
      return res
        .status(400)
        .json({ error: "uidActual es requerido para listar conversaciones" });
    }

    const data = await exports.getConversations(uidActual, limit);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error getConversations:", error);
    return res
      .status(500)
      .json({ res: "fail", msg: "Error al obtener conversaciones" });
  }
};
