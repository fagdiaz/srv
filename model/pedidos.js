const { db } = require("../util/admin");

// =====================
// POST /addOrder
// =====================
exports.addOrder = async (req, res) => {
  const pedidosRef = db.collection("pedidos");
  const counterRef = db.collection("counters").doc("pedidos");
  const usuariosRef = db.collection("usuarios");
  const order = req.body.checkoutForm || {};
  const carrito = req.body.carrito;
  const uid = req.body.uid;

  order.carrito = carrito;
  order.uid = uid;
  order.status = "creado";

  console.log("AddOrder:", { uid, carrito });

  try {
    let emailUsuario = null;
    if (uid) {
      const userSnap = await usuariosRef.doc(uid).get();
      const userData = userSnap.exists ? userSnap.data() : null;
      if (userData && userData.email) {
        emailUsuario = userData.email;
      }
    }

    // Fallback: si vino email en el checkoutForm lo usamos para asegurar que el campo exista
    if (!emailUsuario && order && order.email) {
      emailUsuario = order.email;
    }

    const { id, numeroPedido } = await db.runTransaction(async (t) => {
      const counterSnap = await t.get(counterRef);
      const current =
        counterSnap.exists && typeof counterSnap.data().ultimoNumero === "number"
          ? counterSnap.data().ultimoNumero
          : 0;

      const nextNumero = current + 1;

      const newOrderRef = pedidosRef.doc();
      const orderData = { ...order, numeroPedido: nextNumero, emailUsuario };

      t.set(counterRef, { ultimoNumero: nextNumero }, { merge: true });
      t.set(newOrderRef, orderData);

      return { id: newOrderRef.id, numeroPedido: nextNumero };
    });

    return res.status(200).json({ res: "ok", id, numeroPedido });
  } catch (error) {
    console.log("Ocurrio un error", error);
    return res.status(500).json({ res: "fail", err: error });
  }
};

// =====================
// POST /updateOrder
// =====================
exports.updateOrder = async (req, res) => {
  console.log("UpdateOrder:", req.body);
  try {
    const { pedidoId, idPedido, status } = req.body;

    // Aceptamos pedidoId (nuevo nombre) o idPedido (por compatibilidad)
    const effectiveId = pedidoId || idPedido;

    if (!effectiveId || !status) {
      return res.status(400).json({
        res: "fail",
        message: "Debe enviar pedidoId (o idPedido) y status en el body",
      });
    }

    const pedidosRef = db.collection("pedidos");
    const docRef = pedidosRef.doc(effectiveId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log("No se encontro pedido con id:", effectiveId);
      return res.status(404).json({
        res: "not-found",
        message: "No se encontro ningun pedido con ese id",
      });
    }

    await docRef.update({ status });

    console.log("Pedido actualizado:", effectiveId, "nuevo status:", status);

    return res.status(200).json({
      res: "ok",
      id: effectiveId,
      status,
    });
  } catch (err) {
    console.error("Error en updateOrder:", err);
    return res.status(500).json({
      res: "fail",
      message: "Error al actualizar pedido",
      err: String(err),
    });
  }
};

// =====================
// GET /orders
// =====================
exports.getOrders = async (req, res) => {
  try {
    const { email, status, numeroPedido } = req.query;
    console.log("Orders filtros:", { email, status, numeroPedido });

    const pedidosRef = db.collection("pedidos");
    let query = pedidosRef;

    // Filtro por emailUsuario (para cliente o admin)
    if (email) {
      query = query.where("emailUsuario", "==", email);
    }

    // Filtro por estado
    if (status) {
      query = query.where("status", "==", status);
    }

    // Filtro por numeroPedido (exacto)
    if (numeroPedido) {
      const n = parseInt(numeroPedido, 10);
      if (!Number.isNaN(n)) {
        query = query.where("numeroPedido", "==", n);
      }
    }

    // Si NO hay filtros, ordenamos por numeroPedido desc (vista general)
    if (!email && !status && !numeroPedido) {
      query = query.orderBy("numeroPedido", "desc");
    }

    const snapshot = await query.get();

    const pedidos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Error getOrders:", error);
    return res
      .status(500)
      .json({ res: "error", msg: "Error interno en getOrders" });
  }
};

