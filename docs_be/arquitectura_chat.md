# Arquitectura del Chat - Backend RusticosLanus (/srv)
Ultima actualizacion: [poner fecha]

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
- Importa las funciones desde `model/chat.js`:
  ```js
  const { addMessage, getMessages, getConversationsRoute, getUnreadRoute } = require('./model/chat');
  ```
- Define las rutas relacionadas al chat:
  ```js
  app.post('/chat', addMessage);
  app.get('/chat', getMessages);
  app.get('/chat/conversaciones', getConversationsRoute);
  app.get('/chat/unread', getUnreadRoute); // pendiente de integracion completa FE
  ```

### 2.2 `model/chat.js`
Contiene la logica principal del chat:
- `addMessage`  (POST /chat)
- `getMessages` (GET /chat)
- `getConversations` (funcion interna)
- `getConversationsRoute` (GET /chat/conversaciones)
- `getUnreadRoute` (GET /chat/unread) - base para no leidos

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
  "leidoPor": ["uidX"] // arranca vacio en addMessage
}
```

---

## 4. Generacion de `chatId`
### 4.1 Funcion `buildChatId`
En `model/chat.js`:
```js
const buildChatId = (uidA, uidB) => {
  if (!uidA || !uidB) return null;
  return [uidA, uidB].sort().join("_"); // ej: "uidCliente_uidOperador"
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
- Crea un doc en `mensajes` con los campos indicados (incluye `leidoPor: []`).
- Responde `{ res: "ok", id: "<id mensaje>", timestamp }`.

### 5.2 GET /chat - Listar mensajes entre dos usuarios
Handler: `getMessages(req, res)`

Entrada (query params):
- `uidActual` (obligatorio)
- `uidOtro` (obligatorio)
- `limit` (opcional, default 50)

Logica:
- Valida presencia de `uidActual` y `uidOtro`.
- Calcula `chatId` con `buildChatId`.
- Consulta Firestore:
  ```js
  db.collection("mensajes")
    .where("chatId", "==", chatId)
    .orderBy("timestamp", "asc")
    .limit(effectiveLimit)
  ```
- Marca como leidos (`leidoPor`) los mensajes que no incluian `uidActual`.
- Devuelve array de mensajes ordenados por timestamp.

### 5.3 GET /chat/conversaciones - Listar conversaciones de un usuario
Handler: `getConversationsRoute(req, res)`

Entrada (query params): `uidActual` (obligatorio), `limit` (opcional)

Logica interna (`getConversations`):
- Valida que `uidActual` exista.
- Consulta Firestore:
  ```js
  db.collection("mensajes")
    .where("participantes", "array-contains", uidActual)
    .orderBy("timestamp", "desc")
    .limit(effectiveLimit)
  ```
- Recorre los mensajes (orden desc), construye un `Map` por `chatId` y se queda con el mensaje mas reciente de cada `chatId`.
- Para cada conversacion guarda:
  ```json
  {
    "chatId": "...",
    "uidOtro": "...",
    "emailOtro": "...",
    "ultimoMensaje": "...",
    "timestamp": 1234567890
  }
  ```
  donde `uidOtro` es el otro participante (no `uidActual`), y `emailOtro` proviene de `emailRemitente` o `emailDestinatario` segun corresponda.
- Devuelve array de conversaciones.

### 5.4 GET /chat/unread - Base para mensajes no leidos
Handler: `getUnreadRoute(req, res)`

- Declarado en `server.js`, importado desde `model/chat.js`.
- Comportamiento final pendiente de integracion completa con FE.
- Idea: dado `uidActual`, devolver recuento de mensajes no leidos por `chatId` usando `leidoPor` y actualizaciones al visualizar una conversacion.

---

## 6. Resolucion de emails (`resolveEmail`)
Funcion auxiliar en `model/chat.js`:
```js
const resolveEmail = async (uid, providedEmail) => {
  if (providedEmail) return providedEmail;
  const snap = await db.collection("usuarios").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return data.email || null;
};
```
Uso:
- Tanto en remitente como en destinatario. Permite que el FE omita los emails si existen en la coleccion `usuarios`.

---

## 7. Errores y validaciones
- Si faltan datos criticos en POST /chat: 400 `{ res: "error", msg: "Faltan datos" }`.
- Si no se puede generar `chatId`: 400.
- Si falla Firestore: 500 `{ res: "fail", msg: "Error al guardar/obtener mensajes" }`.

---

## 8. Indices recomendados en Firestore
- Mensajes por `chatId` + `timestamp` (asc):
  - `chatId` (==)
  - `timestamp` (asc)
- Conversaciones por `participantes` + `timestamp` (desc):
  - `participantes` (array-contains)
  - `timestamp` (desc)

La consola de Firebase suele sugerir indices cuando se ejecutan las queries por primera vez.

---

## 9. Relacion con el frontend
- El FE nunca arma `chatId` a mano: envia `uidActual` y `uidOtro`.
- El BE construye `chatId`, filtra mensajes por ese par y devuelve solo lo correspondiente a esa conversacion.
- Permite que el FE omita emails si `usuarios/{uid}` los tiene.

---

## 10. Pendientes del chat (solo BE)
- Completar la logica de `/chat/unread`.
- Mejorar logging (niveles info/warn/error).
- Agregar validaciones extras en payload (longitud de texto, sanitizacion minima).
- Documentar codigos de error si se extienden.
- Opcional: timestamps de servidor y archivado si escala.

---

Este documento debe actualizarse si cambian las rutas, el esquema de Firestore o se agrega funcionalidad (no leidos, adjuntos, etc.).
