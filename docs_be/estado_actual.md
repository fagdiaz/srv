# Estado Actual - BACKEND (Node + Express + Firebase Firestore)
Ultima actualizacion: 08/12/2025

## 1. Descripcion General
Backend operativo en Node + Express + Firebase Admin (Firestore). Rutas principales: usuarios, pedidos, chat privado 1 a 1 y dos familias de endpoints de productos (legacy `/productos` y los nuevos `/products` con reglas de rol).

## 2. Chat
- Rutas: POST /chat, GET /chat, GET /chat/conversaciones, GET /chat/unread.
- Estructura mensajes: `chatId` deterministico (uids ordenados), uids/emails remitente/destinatario, `texto`, `timestamp`, `tipo="privado"`, `participantes`, `leidoPor` (incluye remitente al crear; legacy sin `leidoPor` se consideran `[]`).
- Criterio unico de no leido (`isUnreadForUser`): usuario participa, no es el remitente y no aparece en `leidoPor`; si `leidoPor` falta se trata como vacio.
- GET /chat: acepta uidActual + (uidOtro o chatId), `limit` (default 10), consulta por `chatId` + `orderBy timestamp desc` + limit, responde asc y antes marca como leidos via `markMessagesAsReadForUser` (batch con commit previo). Incluye `leidoPor` normalizado en la respuesta.
- /chat/unread: usa `getUnreadCountsByChatForUser` con el mismo criterio que GET /chat para contar no leidos.
- Logs QA: `[chat] markMessagesAsReadForUser { chatId, userId, found, updated }`, `[chat] getUnreadCountsByChatForUser { userId, totalChats }`.
- /chat/conversaciones: ultimo mensaje por chatId para uidActual.
- Cuotas: errores de Firestore code 8 devuelven 503 `quota_exceeded`.

## 3. Firestore y limites
- Queries de chat usan `limit` para acotar lecturas; FE hace polling cada ~8000 ms.
- Indices requeridos: `chatId + timestamp` (GET /chat), `participantes + timestamp` (GET /chat/unread).
- Emulator opcional: `USE_FIRESTORE_EMULATOR=true` o `FIRESTORE_EMULATOR_HOST=localhost:8080`.

## 4. Estado de Tareas (chat)
- TAREA 14: completada (/chat/unread).
- TAREA 5: completada (marcado de leidos en GET /chat con `markMessagesAsReadForUser`).
- TAREA 6: completada (coordinacion FE+BE para badge unread usando `getUnreadCountsByChatForUser`).

## 5. Manejo de errores
- 503 `quota_exceeded` en usuarios (obtenerUsuario) y rutas de chat si Firestore quota falla.
- 500 para otros errores; 400 para validaciones.

## 6. Autenticación y usuarios
- Firebase Auth (Bearer tokens) validado via `authMiddleware`; rellena `req.user` con `uid`, `email`, `rol`, `activo`.
- `GET /obtenerUsuario`:
  - protege la ruta con `authMiddleware`.
  - extrae `uid/email` del token y busca el doc en Firestore.
  - si el doc no existe, lo crea con `rol: cliente`, `activo: true`, `createdAt/updatedAt`.
  - responde `{ res: "ok", usuario }` con `uid`, `rol`, `activo`, `email`, `dni` (si lo tiene) y demás campos.
- Colección `usuarios`: docId = UID, campos clave `email`, `dni`, `rol` (`admin`/`operador`/`cliente`), `activo`, `createdAt`, `updatedAt`.

## 7. Administración de usuarios
- `/admin/users` (GET) usa `authMiddleware + requireAdmin`; expone `uid`, `rol`, `activo` y los demás campos (email, nombre, etc.) para el panel de admin.
- `PATCH /admin/users/:uid/rol` y `PATCH /admin/users/:uid/estado`:
  - validan input y loguean requester/target.
  - actualizan el doc con `updatedAt`.
  - consultan `isLastActiveAdmin` antes de bajar rol o desactivar a un admin activo; si el target es el último admin activo devuelven 400 con `{ message: "..." }`, no aplican cambios.
  - en caso contrario responden `{ res: "ok", usuario }`.
- Helper `isLastActiveAdmin(db, targetUid)` revisa la colección `usuarios` buscando `rol == admin` y `activo == true`, y devuelve `true` sólo cuando la única coincidencia activa tiene id `targetUid`.

## 8. Pedidos (orders)
- Endpoints principales:
  - `POST /addOrder` crea pedidos incrementando el contador `counters/pedidos`.
  - `GET /orders` lista pedidos para admin/operador con filtros (`email`, `status`, `numeroPedido`).
- Campos clave:
  - `numeroPedido`, `status`, `items`, `total`, etc. (sin cambios).
  - `createdAt` (serverTimestamp via Firebase Admin).
  - `emailUsuario`, `dniUsuario` (resueltos desde `req.user` o desde el checkout).
- `GET /orders` devuelve `id`, `numeroPedido`, `createdAt` (normalizado a Date/millis), `emailUsuario`, `dniUsuario` y el resto del documento; un comentario del código recuerda que OrdersAdminComponent usa esos campos para ordenar y mostrar fecha/email/DNI mientras el backend solo brinda los datos.

## 9. Productos (detalle del módulo BE)
- Colección `productos` en Firestore: docId autogenerado, campos clave `nombre`, `descripcion`, `precio`, `activo` (booleano, default `true`), `imagenUrl` (string opcional), `orden` (number opcional) y cualquier campo legacy extra; `activo=false` representa soft delete sin borrar el doc.
- Resolución de rol: los endpoints aceptan `uidActual` (o `uid`) en query/body, se resuelve el documento `usuarios/{uid}` con `getUserRole`, y el rol (`admin`, `ordenador`, `cliente`, etc.) determina qué puede hacer el caller; solo `admin` puede mutar productos, operadores/clientes solo los consultan.
- GET `/products`: se llama a `getProductsByRole(uid, role)` desde `model/productos.js`, que devuelve todos los docs para `admin` y solo los con `activo !== false` (o sin campo `activo`) para operadores/clientes; el resultado se ordena por `orden` cuando ambos tienen ese campo y luego por `nombre`, y mantiene `imagenUrl` cuando está presente.
- POST `/productos`: legacy pero ahora admin-only; crea un doc con `nombre`, `descripcion`, `precio`, `activo` (default `true`), `imagenUrl`, `orden` y demás campos enviados, responde `{ res: "ok", id, producto }`.
- POST `/products/update`: solo admin; el helper `updateProductData` valida existencia y rol, actualiza sólo los campos presentes (incluyendo `imagenUrl` y `activo` si se envían) y responde `{ res: "ok", producto }`.
- POST `/products/soft-delete`: solo admin; `softDeleteProductData` marca `activo: false` y responde `{ res: "ok", producto }`.
- Logs: cada handler de `/products` registra el UID, el `id` y la ruta (`GET /products`, `POST /products/update`, `POST /products/soft-delete`), y los wrappers POST simplemente delegan sin duplicar lógica.
## 8. Productos (detalle operacional)
- Firestore `productos`: docId autogenerado; campos clave `nombre`, `descripcion`, `precio`, `activo` (predeterminado `true`), `imagenUrl` (opcional, se persiste como string o `null`), `orden` (número que permite ordenamiento manual) y cualquier metadato adicional que llegue en la petición.
- Creación (`POST /productos`): solo `admin` puede usarla; construye el objeto con los campos anteriores (imagenUrl opcional, activo true por defecto) y responde `{ res: "ok", id, producto: { ... } }`.
- GET `/products`: requiere `uidActual`/`uid`, acepta `ordenBy` implícito y retorna `{ ...doc.data() }` por producto (incluye `imagenUrl` cuando existe). Los `admin` ven todo, operador y cliente solo documentos cuya propiedad `activo` no es `false`.
- Actualización (`POST /products/update` o `PUT /products/:id`): solo `admin`; `updateProductData` aplica actualizaciones parciales, incluyendo `imagenUrl`, y devuelve el documento actualizado completo en la respuesta `{ res: "ok", producto }`.
- Baja lógica (`POST /products/soft-delete` o `DELETE /products/:id`): solo `admin`; marca `activo: false` y responde con el producto resultante.
- Logs: cada handler de `/products` loguea rutas, UID y `id` actualizado, y los wrappers POST reutilizan esos handlers (sin lógica inline extra).

## 9. Administración de usuarios
- `/admin/users` (GET) usa `authMiddleware + requireAdmin`, expone filtros por rol/estado y normaliza `rol` y `activo` en cada registro (el FE los necesita para badges y columnas).
- `PATCH /admin/users/:uid/rol` y `PATCH /admin/users/:uid/estado` guardan `updatedAt`, loguean quién ejecuta y consultan al helper `isLastActiveAdmin` para bloquear cambios que dejarían sin admins activos; devuelven 400 con `message` claro o `{ res: "ok", usuario }` en caso de éxito.
- El helper `isLastActiveAdmin` valida la colección `usuarios` buscando `rol == admin` y `activo == true`, y sólo devuelve `true` cuando el único admin activo coincide con el target (0 admins también devuelve `false`).

## 10. Pedidos para admin
- `GET /orders` (OrdersAdminComponent) sigue devolviendo el doc completo pero asegura que cada registro incluya `id`, `numeroPedido`, `createdAt` (el timestamp serializado a `Date`/millis), `emailUsuario` y `dniUsuario` para que el panel pueda ordenar por fecha y mostrar email/DNI sin romper el contrato anterior.

---

## 11. Seguridad general y CORS
- `cors` se configura en `server.js` con `origin: true`, métodos permitidos `[GET, POST, PUT, PATCH, DELETE, OPTIONS]`, `allowedHeaders` incluyendo `Authorization`, `credentials: true` y se habilita `app.options('*', cors())`.
- El frontend manda el header `Authorization: Bearer <token>` en todas las rutas protegidas (productos, pedidos, usuarios, admin users, chat), y el backend lo valida con `authMiddleware`.
