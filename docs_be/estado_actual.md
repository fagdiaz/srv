# Estado Actual - BACKEND (Node + Express + Firebase Firestore)
Ultima actualizacion: 08/12/2025

## 1. Descripcion General
Backend operativo en Node + Express + Firebase Admin (Firestore). Rutas principales: usuarios, productos, pedidos, chat privado 1 a 1.

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
- Productos: GET/POST estables.
- Usuarios: /signup, /usuarios, /obtenerUsuario, /google-login; doc id = UID, rol default cliente; sin `pass` en respuestas.

---
