# Arquitectura del Chat - Backend RusticosLanus (/srv)
Ultima actualizacion: 08/12/2025

Este documento describe como esta implementado el chat privado 1 a 1 en el backend de Rusticos Lanus.

---

## 1. Objetivo del modulo de chat (BE)
- Proveer una API REST simple y consistente para:
  - Enviar mensajes privados.
  - Listar mensajes entre dos usuarios.
  - Listar conversaciones de un usuario.
  - (Opcional) manejar no leidos y estados de lectura.
- Usar Firestore como base de datos no relacional.
- Mantener el backend lo mas stateless posible: toda la info relevante queda en Firestore.

---

## 2. Archivos involucrados
### 2.1 `server.js`
- Importa las funciones desde `model/chat.js` y define rutas `/chat`, `/chat/conversaciones`, `/chat/unread`.

### 2.2 `model/chat.js`
Contiene la logica principal del chat:
- `addMessage`  (POST /chat)
- `getMessages` (GET /chat)
- `getConversations` (funcion interna)
- `getConversationsRoute` (GET /chat/conversaciones)
- `getUnreadRoute` (GET /chat/unread)

Usa `db` de `util/admin.js` para hablar con Firestore.

---

## 3. Estructura en Firestore
### 3.1 Coleccion `usuarios`
- Documento por usuario, docId = uid.
- Campos relevantes: `email`, `rol` (cliente/operador/admin) y otros datos del usuario.

### 3.2 Coleccion `mensajes`
Cada documento representa un mensaje individual. Campos tipicos:
```json
{
  "id": "<docRef.id>",
  "chatId": "uidA_uidB",
  "uidRemitente": "...",
  "uidDestinatario": "...",
  "emailRemitente": "...",
  "emailDestinatario": "...",
  "texto": "...",
  "timestamp": 1234567890,
  "tipo": "privado",
  "participantes": ["uidA", "uidB"],
  "leidoPor": ["uidRemitente"]
}
```
`chatId` se arma con los dos uids ordenados para que sea deterministico.
- `leidoPor` siempre se inicializa con el remitente; mensajes legacy sin `leidoPor` se consideran `[]` al contar no leidos.

---

## 4. Generacion de `chatId`
### 4.1 Funcion `buildChatId`
En `model/chat.js`:
```js
const buildChatId = (uidA, uidB) => {
  if (!uidA || !uidB) return null;
  return [uidA, uidB].sort().join("_");
};
```
- Ordena alfabeticamente los dos UIDs.
- Genera un string unico para ese par, sin importar el orden.
- Garantiza que `cliente -> operador` y `operador -> cliente` usen el mismo `chatId`.

---

## 5. Endpoints del chat
### 5.1 POST /chat - Enviar mensaje
Handler: `addMessage(req, res)`

Entrada (body):
```json
{
  "uidRemitente": "uid-actual",
  "uidDestinatario": "uid-otro",
  "texto": "string",
  "emailRemitente": "opcional",
  "emailDestinatario": "opcional"
}
```

Logica:
- Valida que existan `uidRemitente`, `uidDestinatario` y `texto`.
- Calcula `chatId = buildChatId(uidRemitente, uidDestinatario)`.
- Resuelve emails: si no vienen, los busca en `usuarios/{uid}`.
- Crea un doc en `mensajes` con los campos indicados (incluye `leidoPor` con el remitente marcado).
- Responde `{ res: "ok", id: "<id mensaje>", timestamp }`.

### 5.2 GET /chat - Listar mensajes entre dos usuarios
Handler: `getMessages(req, res)`

Entrada (query params):
- `uidActual` (obligatorio)
- `uidOtro` o `chatId` (uno de los dos)
- `limit` (opcional, default 10)

Logica:
- Valida presencia de `uidActual` y deriva `chatId` con `buildChatId` si viene `uidOtro`.
- Consulta Firestore:
  ```js
  db.collection("mensajes")
    .where("chatId", "==", chatId)
    .orderBy("timestamp", "desc")
    .limit(limit)
  ```
- Marca como leidos (`leidoPor`) en batch para mensajes no leidos segun `isUnreadForUser` usando `markMessagesAsReadForUser` (commit antes de responder).
- Devuelve array de mensajes en orden ascendente (se invierte antes de responder).

### 5.3 GET /chat/conversaciones - Listar conversaciones de un usuario
Handler: `getConversationsRoute(req, res)`

- Entrada: `uidActual` (obligatorio), `limit` (opcional).
- Agrupa por `chatId` y devuelve ultimo mensaje + `uidOtro`/`emailOtro`.

### 5.4 GET /chat/unread - Conteo de no leidos
Handler: `getUnreadRoute(req, res)`

- Entrada: `uidActual` (query).
- Usa `getUnreadCountsByChatForUser` con el mismo criterio de `isUnreadForUser`; devuelve `{ chatId, unread }`.
- Maneja error de indice faltante con mensaje de Firestore y errores de cuota con 503.

---

## 6. Indices requeridos (Firestore)
- Coleccion `mensajes`:
  - GET /chat: indice compuesto `chatId ==` + `timestamp desc`.
  - GET /chat/unread: indice compuesto `participantes array-contains` + `timestamp desc`.
  - Firestore suele ofrecer el link directo para crearlos si faltan.

---

## 7. Consistencia entre GET /chat y /chat/unread
- GET /chat marca como leidos los mensajes recibidos por `uidActual` en esa conversacion.
- GET /chat/unread usa `leidoPor` para contar no leidos; despues de abrir el chat, esos mensajes dejan de contarse.

---

## 8. Manejo de errores y cuotas
- Si Firestore devuelve `RESOURCE_EXHAUSTED` / code 8 (`quota exceeded`), las rutas de chat responden 503 `{ error: "quota_exceeded" }`.
- Otros errores se responden con 500 o 400 segun validaciones.

---

## 9. Notas de desarrollo
- Se puede usar Firestore Emulator seteando `USE_FIRESTORE_EMULATOR=true` o `FIRESTORE_EMULATOR_HOST=localhost:8080`.
- No cambiar `chatId`, `participantes` ni `leidoPor` para no romper FE/BE existentes.
