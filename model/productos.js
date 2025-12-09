const { db } = require("../util/admin");

// Helper para obtener rol del usuario; por defecto cliente si no existe
const getUserRole = async (uid) => {
  if (!uid) return "cliente";
  const snap = await db.collection("usuarios").doc(uid).get();
  if (!snap.exists) return "cliente";
  const data = snap.data() || {};
  return data.rol || "cliente";
};

const resolveUid = (req) =>
  (req.query && (req.query.uidActual || req.query.uid)) ||
  (req.body && (req.body.uidActual || req.body.uid)) ||
  null;

// Actualiza campos editables de un producto existente
const updateProductData = async (uidActual, productoInput) => {
  if (!uidActual) {
    const err = new Error("Usuario no autenticado");
    err.code = "unauthorized";
    throw err;
  }
  if (!productoInput || !productoInput.id) {
    const err = new Error("Faltan datos de producto");
    err.code = "bad-request";
    throw err;
  }

  const role = (await getUserRole(uidActual)).toLowerCase();
  if (role !== "admin") {
    const err = new Error("No autorizado para actualizar productos");
    err.code = "forbidden";
    throw err;
  }

  const docRef = db.collection("productos").doc(productoInput.id);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err = new Error("Producto no encontrado");
    err.code = "not-found";
    throw err;
  }

  const updateData = {};
  if (productoInput.nombre !== undefined) updateData.nombre = productoInput.nombre;
  if (productoInput.descripcion !== undefined)
    updateData.descripcion = productoInput.descripcion;
  if (productoInput.precio !== undefined) updateData.precio = productoInput.precio;
  if (productoInput.activo !== undefined) updateData.activo = productoInput.activo;
  if (productoInput.imagenUrl !== undefined)
    updateData.imagenUrl = productoInput.imagenUrl;
  if (productoInput.orden !== undefined) updateData.orden = productoInput.orden;

  if (Object.keys(updateData).length > 0) {
    await docRef.update(updateData);
  }
  const updatedSnapshot = await docRef.get();
  return { id: updatedSnapshot.id, role, ...updatedSnapshot.data() };
};

// Baja logica de producto (activo:false)
const softDeleteProductData = async (uidActual, id) => {
  if (!uidActual) {
    const err = new Error("Usuario no autenticado");
    err.code = "unauthorized";
    throw err;
  }
  if (!id) {
    const err = new Error("Falta id de producto");
    err.code = "bad-request";
    throw err;
  }

  const role = (await getUserRole(uidActual)).toLowerCase();
  if (role !== "admin") {
    const err = new Error("No autorizado para eliminar productos");
    err.code = "forbidden";
    throw err;
  }

  const docRef = db.collection("productos").doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err = new Error("Producto no encontrado para soft delete");
    err.code = "not-found";
    throw err;
  }

  await docRef.update({ activo: false });
  const updatedSnapshot = await docRef.get();
  return { id: updatedSnapshot.id, role, ...updatedSnapshot.data() };
};

// Funcion reutilizable para obtener productos segun rol
const getProductsByRole = async (uid, role) => {
  const effectiveRole = (role || (await getUserRole(uid)) || "cliente").toLowerCase();

  const snapshot = await db.collection("productos").get();
  const productos = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const visibles =
    effectiveRole === "admin"
      ? productos
      : productos.filter((p) => p.activo !== false);

  // Orden opcional: primero por campo orden (si existe en ambos), si no por nombre asc
  visibles.sort((a, b) => {
    const hasOrdenA = Object.prototype.hasOwnProperty.call(a, "orden");
    const hasOrdenB = Object.prototype.hasOwnProperty.call(b, "orden");
    if (hasOrdenA && hasOrdenB) {
      return (a.orden || 0) - (b.orden || 0);
    }
    const nameA = (a.nombre || "").toString().toLowerCase();
    const nameB = (b.nombre || "").toString().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return { data: visibles, role: effectiveRole };
};

// GET /productos (legacy)
exports.productos = async (req, res) => {
  const productosRef = db.collection("productos");
  try {
    const snapshot = await productosRef.get();
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(data);
    return res.status(201).json(data);
  } catch (error) {
    return res
      .status(500)
      .json({ general: "Something went wrong, please try again" });
  }
};

// GET /products - solo lectura respetando rol
exports.getProducts = async (req, res) => {
  try {
    // uidActual/uid siguen el mismo patron usado en chat/usuarios
    const { uidActual, uid } = req.query || {};
    const userId = uidActual || uid || null;

    if (!userId) {
      return res
        .status(401)
        .json({ res: "error", msg: "No se pudo determinar el usuario" });
    }

    const { data, role } = await getProductsByRole(userId);

    console.log("GET /products:", { uid: userId, role, total: data.length });
    return res.status(200).json(data);
  } catch (error) {
    console.error("[products] GET /products error:", error);
    return res
      .status(500)
      .json({ res: "error", msg: "No se pudieron obtener los productos" });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const userId = resolveUid(req);
    if (!userId) {
      return res.status(401).json({
        res: "error",
        msg: "No se pudo determinar el usuario"
      });
    }

    const role = (await getUserRole(userId)).toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({
        res: "error",
        msg: "No autorizado para agregar productos"
      });
    }

    const {
      nombre,
      descripcion,
      precio,
      activo,
      imagenUrl,
      orden,
      ...otros
    } = req.body || {};

    if (!nombre || precio === undefined) {
      return res.status(400).json({
        res: "error",
        msg: "Nombre y precio son obligatorios"
      });
    }

    const nuevoProducto = {
      nombre,
      descripcion: descripcion || "",
      precio,
      activo: activo ?? true,
      imagenUrl: imagenUrl ?? null,
      orden: orden ?? null,
      ...otros
    };

    const productosRef = db.collection("productos");
    const result = await productosRef.add(nuevoProducto);
    return res.status(200).json({
      res: "ok",
      id: result.id,
      producto: { id: result.id, ...nuevoProducto }
    });
  } catch (error) {
    console.log("Ocurrió un error", error);
    return res.status(500).json({ res: "fail", err: error });
  }
};

// PUT /products/:id - actualiza campos permitidos
exports.updateProduct = async (req, res) => {
  try {
    const userId = resolveUid(req);
    const payload =
      (req.body && req.body.producto) ||
      req.body ||
      {};
    const productoInput = {
      ...payload,
      id: (req.params && req.params.id) || payload.id,
    };
    const routeLabel =
      req.path === "/products/update"
        ? "POST /products/update"
        : `${req.method} ${req.path}`;
    const result = await updateProductData(userId, productoInput);

    console.log(
      `[products] ${routeLabel} uidActual: ${userId} id: ${productoInput.id}`
    );
    return res.status(200).json({ res: "ok", producto: result });
  } catch (error) {
    const routeLabel =
      req.path === "/products/update"
        ? "POST /products/update"
        : `${req.method} ${req.path}`;
    console.error(`[products] ${routeLabel} error:`, error);
    if (error.code === "unauthorized") {
      return res.status(401).json({ res: "error", msg: error.message });
    }
    if (error.code === "forbidden") {
      return res.status(403).json({ res: "error", msg: error.message });
    }
    if (error.code === "bad-request") {
      return res.status(400).json({ res: "error", msg: error.message });
    }
    if (error.code === "not-found") {
      return res.status(404).json({ res: "error", msg: error.message });
    }
    return res
      .status(500)
      .json({ res: "error", msg: "No se pudo actualizar el producto" });
  }
};

// DELETE /products/:id - baja logica (activo:false)
exports.softDeleteProduct = async (req, res) => {
  try {
    const userId = resolveUid(req);
    const id = (req.params && req.params.id) || (req.body && req.body.id);
    const routeLabel =
      req.path === "/products/soft-delete"
        ? "POST /products/soft-delete"
        : `${req.method} ${req.path}`;
    const result = await softDeleteProductData(userId, id);

    console.log(
      `[products] ${routeLabel} uidActual: ${userId} id: ${id}`
    );
    return res.status(200).json({ res: "ok", producto: result });
  } catch (error) {
    const routeLabel =
      req.path === "/products/soft-delete"
        ? "POST /products/soft-delete"
        : `${req.method} ${req.path}`;
    console.error(`[products] ${routeLabel} error:`, error);
    if (error.code === "unauthorized") {
      return res.status(401).json({ res: "error", msg: error.message });
    }
    if (error.code === "forbidden") {
      return res.status(403).json({ res: "error", msg: error.message });
    }
    if (error.code === "bad-request") {
      return res.status(400).json({ res: "error", msg: error.message });
    }
    if (error.code === "not-found") {
      return res.status(404).json({ res: "error", msg: error.message });
    }
    return res
      .status(500)
      .json({ res: "error", msg: "No se pudo eliminar el producto" });
  }
};
