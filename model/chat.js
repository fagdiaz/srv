const { admin, db } = require("../util/admin");

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

const isQuotaError = (error) => {
  const details = (error && error.details && String(error.details)) || "";
  return error?.code === 8 || details.toLowerCase().includes("quota exceeded");
};

// Normaliza el campo leidoPor (puede venir como array o map legacy)
const normalizeLeido = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    return Object.keys(value);
  }
  return [];
};

// Determina si un mensaje esta no leido para un usuario
const isUnreadForUser = (data, userId) => {
  const leidoPor = normalizeLeido(data.leidoPor);
  const participantes = Array.isArray(data.participantes)
    ? data.participantes
    : [];
  const isParticipant = participantes.includes(userId);
  const isOwnMessage = data.uidRemitente === userId;
  return isParticipant && !isOwnMessage && !leidoPor.includes(userId);
};

// Marca como leidos todos los mensajes no leidos de un chat para un usuario
const markMessagesAsReadForUser = async (chatId, userId) => {
  if (!chatId || !userId) return 0;

  const snapshot = await db
    .collection("mensajes")
    .where("chatId", "==", chatId)
    .orderBy("timestamp", "desc")
    .get();

  const batch = db.batch();
  let updated = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data() || {};
    if (isUnreadForUser(data, userId)) {
      batch.update(doc.ref, {
        leidoPor: admin.firestore.FieldValue.arrayUnion(userId),
      });
      updated += 1;
    }
  });

  if (batch._ops && batch._ops.length > 0) {
    await batch.commit();
  }

  console.log("[chat] markMessagesAsReadForUser", {
    chatId,
    userId,
    found: snapshot.size,
    updated,
  });

  return updated;
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

    if (
      !uidRemitente ||
      typeof uidRemitente !== "string" ||
      !uidDestinatario ||
      typeof uidDestinatario !== "string" ||
      typeof texto !== "string" ||
      !texto.trim()
    ) {
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
      // el emisor no tiene pendientes en su propio mensaje
      leidoPor: [uidRemitente],
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
    const { uidActual, uidOtro, chatId: chatIdParam, limit } = req.query || {};
    const parsedLimit = parseInt(limit, 10);
    const effectiveLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    console.log("GET /chat query:", {
      uidActual,
      uidOtro,
      chatId: chatIdParam,
      limit: effectiveLimit,
    });

    if (!uidActual || typeof uidActual !== "string") {
      return res
        .status(400)
        .json({ error: "uidActual es requerido para obtener mensajes" });
    }

    let chatId = null;
    if (chatIdParam && typeof chatIdParam === "string") {
      chatId = chatIdParam;
    } else if (uidOtro && typeof uidOtro === "string") {
      chatId = buildChatId(uidActual, uidOtro);
    }

    if (!chatId) {
      return res
        .status(400)
        .json({ error: "Se requiere chatId o uidOtro para obtener mensajes" });
    }

    // Marca todos los mensajes no leidos antes de devolverlos
    const marcados = await markMessagesAsReadForUser(chatId, uidActual);

    const mensajesRef = db.collection("mensajes");
    const snapshot = await mensajesRef
      .where("chatId", "==", chatId)
      .orderBy("timestamp", "desc")
      .limit(effectiveLimit)
      .get();

    const mensajes = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      const leidoPor = normalizeLeido(data.leidoPor);
      mensajes.push({ id: doc.id, ...data, leidoPor });
    });

    // devolver en orden cronologico ascendente
    mensajes.reverse();

    console.log(
      `GET /chat -> chatId=${chatId}, uidActual=${uidActual}, uidOtro=${uidOtro || chatIdParam}, mensajesLeidos=${marcados}`
    );

    return res.status(200).json(mensajes);
  } catch (error) {
    console.error("Error getMessages:", error);
    if (isQuotaError(error)) {
      return res.status(503).json({ error: "quota_exceeded" });
    }
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

  // Query SIN orderBy para evitar requerir indice compuesto
  const snapshot = await db
    .collection("mensajes")
    .where("participantes", "array-contains", uidActual)
    .limit(effectiveLimit)
    .get();

  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Ordenar en memoria por timestamp descendente (mas nuevo primero)
  docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const conversaciones = new Map();

  docs.forEach((data) => {
    const { chatId, uidRemitente, uidDestinatario, texto, timestamp } = data;
    if (!chatId) return;

    const uidOtro = uidRemitente === uidActual ? uidDestinatario : uidRemitente;
    const emailOtro =
      uidRemitente === uidActual ? data.emailDestinatario : data.emailRemitente;

    if (!uidOtro) return;

    // Como ya estan ordenados desc, el primero que entra para cada chatId es el ultimo mensaje
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
const getConversationsRoute = async (req, res) => {
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
    if (isQuotaError(error)) {
      return res.status(503).json({ error: "quota_exceeded" });
    }
    return res
      .status(500)
      .json({ res: "fail", msg: "Error al obtener conversaciones" });
  }
};

// Devuelve un map chatId -> cantidad de no leidos para un usuario
const getUnreadCountsByChatForUser = async (userId) => {
  const snapshot = await db
    .collection("mensajes")
    .where("participantes", "array-contains", userId)
    .orderBy("timestamp", "desc")
    .get();

  const counts = new Map();

  snapshot.docs.forEach((doc) => {
    const data = doc.data() || {};
    const chatId = data.chatId;
    if (!chatId) return;
    if (isUnreadForUser(data, userId)) {
      counts.set(chatId, (counts.get(chatId) || 0) + 1);
    }
  });

  console.log("[chat] getUnreadCountsByChatForUser", {
    userId,
    totalChats: counts.size,
  });

  return counts;
};

// GET /chat/unread - conteo de no leidos por chatId
const getUnreadRoute = async (req, res) => {
  try {
    const { uidActual } = req.query || {};
    if (!uidActual || typeof uidActual !== "string") {
      return res
        .status(400)
        .json({ error: "uidActual es requerido para obtener no leidos" });
    }

    // Firestore: para consultas con participantes + orderBy timestamp se requiere indice
    // Coleccion mensajes: participantes (array-contains), timestamp (desc)
    const counts = await getUnreadCountsByChatForUser(uidActual);

    const result = Array.from(counts.entries()).map(([chatId, unread]) => ({
      chatId,
      unread,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getUnreadRoute:", error);
    if (error.code === 9 || error.code === "failed-precondition") {
      return res.status(500).json({
        error:
          "Firestore requiere indice para /chat/unread (participantes + timestamp)",
      });
    }
    if (isQuotaError(error)) {
      return res.status(503).json({ error: "quota_exceeded" });
    }
    return res.status(500).json({ error: "Error al obtener no leidos" });
  }
};

module.exports = {
  addMessage: exports.addMessage,
  getMessages: exports.getMessages,
  getConversations: exports.getConversations,
  getConversationsRoute,
  getUnreadRoute,
};
