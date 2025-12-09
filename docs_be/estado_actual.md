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

## 6. Pedidos / Productos / Usuarios
- Pedidos: /addOrder, /updateOrder, /orders operativos; counters para numeracion.
- Productos:
  - `/productos` sigue disponible para compatibilidad con el frontend (sigue funcionando el POST legado).
- `/products` (GET) requiere `uidActual`/`uid`, detecta el rol del usuario (`cliente`, `ordenador`, `admin`) y solo deja ver productos activos si el rol es `cliente`. Admin y operadores (que no mutan productos) ven la colección completa y pueden solicitar ordenamiento por campo `orden`.
- `/products/:id` (PUT) y `/products/:id` (DELETE) implementan actualizacion/selectiva y baja logica respectivamente; solo `admin` puede editar los campos permitidos (nombre, descripcion, precio, activo, imagenUrl, orden) o marcar `activo: false`.
  - Para no romper integraciones, hay wrappers POST (`/products/update`, `/products/soft-delete`) que llaman a los mismos helpers (`updateProductData` y `softDeleteProductData`) y mantienen las respuestas usadas por el FE actual.
- Usuarios: /signup, /usuarios, /obtenerUsuario, /google-login; doc id = UID, rol default cliente; sin `pass` en respuestas.

## 7. Productos (detalle del módulo BE)
- Colección `productos` en Firestore: docId autogenerado, campos clave `nombre`, `descripcion`, `precio`, `activo` (booleano, default `true`), `imagenUrl` (string opcional), `orden` (number opcional) y cualquier campo legacy extra; `activo=false` representa soft delete sin borrar el doc.
- Resolución de rol: los endpoints aceptan `uidActual` (o `uid`) en query/body, se resuelve el documento `usuarios/{uid}` con `getUserRole`, y el rol (`admin`, `ordenador`, `cliente`, etc.) determina qué puede hacer el caller; solo `admin` puede mutar productos, operadores/clientes solo los consultan.
- GET `/products`: se llama a `getProductsByRole(uid, role)` desde `model/productos.js`, que devuelve todos los docs para `admin` y solo los con `activo !== false` (o sin campo `activo`) para operadores/clientes; el resultado se ordena por `orden` cuando ambos tienen ese campo y luego por `nombre`, y mantiene `imagenUrl` cuando está presente.
- POST `/productos`: legacy pero ahora admin-only; crea un doc con `nombre`, `descripcion`, `precio`, `activo` (default `true`), `imagenUrl`, `orden` y demás campos enviados, responde `{ res: "ok", id, producto }`.
- POST `/products/update`: solo admin; el helper `updateProductData` valida existencia y rol, actualiza sólo los campos presentes (incluyendo `imagenUrl` y `activo` si se envían) y responde `{ res: "ok", producto }`.
- POST `/products/soft-delete`: solo admin; `softDeleteProductData` marca `activo: false` y responde `{ res: "ok", producto }`.
- Logs: cada handler de `/products` registra el UID, el `id` y la ruta (`GET /products`, `POST /products/update`, `POST /products/soft-delete`), y los wrappers POST simplemente delegan sin duplicar lógica.
## 7. Productos (detalle operacional)
- Firestore `productos`: docId autogenerado; campos clave `nombre`, `descripcion`, `precio`, `activo` (predeterminado `true`), `imagenUrl` (opcional, se persiste como string o `null`), `orden` (número que permite ordenamiento manual) y cualquier metadato adicional que llegue en la petición.
- Creación (`POST /productos`): solo `admin` puede usarla; construye el objeto con los campos anteriores (imagenUrl opcional, activo true por defecto) y responde `{ res: "ok", id, producto: { ... } }`.
- GET `/products`: requiere `uidActual`/`uid`, acepta `ordenBy` implícito y retorna `{ ...doc.data() }` por producto (incluye `imagenUrl` cuando existe). Los `admin` ven todo, operador y cliente solo documentos cuya propiedad `activo` no es `false`.
- Actualización (`POST /products/update` o `PUT /products/:id`): solo `admin`; `updateProductData` aplica actualizaciones parciales, incluyendo `imagenUrl`, y devuelve el documento actualizado completo en la respuesta `{ res: "ok", producto }`.
- Baja lógica (`POST /products/soft-delete` o `DELETE /products/:id`): solo `admin`; marca `activo: false` y responde con el producto resultante.
- Logs: cada handler de `/products` loguea rutas, UID y `id` actualizado, y los wrappers POST reutilizan esos handlers (sin lógica inline extra).
---
