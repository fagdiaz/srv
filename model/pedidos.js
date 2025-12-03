const { db } = require("../util/admin");

// =====================
// POST /addOrder
// =====================
exports.addOrder = async (req, res) => {
  const pedidosRef = db.collection("pedidos");
  const counterRef = db.collection("counters").doc("pedidos");
  const order = req.body.checkoutForm;
  const carrito = req.body.carrito;
  const uid = req.body.uid;

  order.carrito = carrito;
  order.uid = uid;
  order.status = "creado";

  try {
    const { id, numeroPedido } = await db.runTransaction(async (t) => {
      const counterSnap = await t.get(counterRef);
      const current =
        counterSnap.exists &&
        typeof counterSnap.data().ultimoNumero === "number"
          ? counterSnap.data().ultimoNumero
          : 0;

      const nextNumero = current + 1;

      const newOrderRef = pedidosRef.doc();

      t.set(counterRef, { ultimoNumero: nextNumero }, { merge: true });
      t.set(newOrderRef, { ...order, numeroPedido: nextNumero });

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
    const { uid } = req.query; // /orders?uid=...

    let query = db.collection("pedidos");

    if (uid) {
      // Pedidos de un usuario específico
      query = query.where("uid", "==", uid);
    } else {
      // Todos los pedidos, ordenados por numeroPedido descendente
      query = query.orderBy("numeroPedido", "desc");
    }

    const snapshot = await query.get();

    const pedidos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Error en getOrders:", error);
    return res.status(500).json({ error: "Error al obtener los pedidos" });
  }
};