# Estado Actual - BACKEND (Node + Express + Firebase Firestore)
Ultima actualizacion: [poner fecha]

## 1. Descripcion General
El backend provee API REST para:
- Usuarios
- Productos
- Pedidos
- Chat privado 1 a 1
- Contadores de pedidos (counters)

Implementado con:
- Node.js
- Express
- Firebase Admin (Firestore)

---

## 2. Estructura de Carpetas (srv)
- `server.js`  configuracion principal de Express.
- `model/`
  - `usuarios.js`  manejo de usuarios.
  - `productos.js`  manejo de productos.
  - `pedidos.js`  alta/actualizacion/listado de pedidos.
  - `chat.js`  mensajeria privada.
- `util/admin.js`  inicializacion Firebase Admin.
- `docs_be/`  documentacion interna (este archivo, backlog, prompts Codex, agentes IA, tareas pendientes, arquitectura chat, plan de trabajo).

---

## 3. Estado Actual del Chat (Backend)
### 3.1 Implementacion
- Mensajeria privada 1 a 1.
- `chatId` generado automaticamente `uidA_uidB` (uids ordenados).
- Campos de mensaje: `id`, `chatId`, `uidRemitente`, `uidDestinatario`, `emailRemitente`, `emailDestinatario`, `texto`, `timestamp` (Date.now), `tipo="privado"`, `participantes` (array de 2 uids), `leidoPor` (array).
- Endpoints:
  - POST `/chat`  guarda mensaje.
  - GET `/chat`  historial entre dos usuarios (usa `chatId`).
  - GET `/chat/conversaciones`  lista conversaciones (ultimo mensaje por `chatId`).
  - GET `/chat/unread`  base para conteo de no leidos (falta integrar completo con FE y ajustar conteo).

### 3.2 Correcciones recientes
- `getMessages` usa `chatId` estable para no mezclar conversaciones y marca `leidoPor` al leer.
- Se anadio `getConversationsRoute` (ultimos mensajes por conversacion).

### 3.3 Pendientes (chat)
- Completar/validar `/chat/unread` (conteo y consumo FE).
- Registrar timestamps del servidor (opcional) y revisar duplicacion de `chatId` (por ordenamiento).
- Confirmar indices Firestore necesarios (consultas con `chatId`/`participantes` + `orderBy timestamp`).
- Considerar archivado o colecciones separadas si escala.

---

## 4. Estado Actual de Usuarios
- `addUser` crea/merge documentos con doc id = UID (rol por defecto cliente, proveedor email, createdAt ISO).
- `obtenerUsuario` funciona con `uid` (query).
- `googleLogin` crea si no existe, asegura rol.
- Listado `/usuarios` excluye `pass` y expone `uid`.
- Pendientes:
  - Validacion de formato email.
  - Normalizacion de datos.

---

## 5. Estado Actual de Productos
- `productos/get` funcionando.
- `addProduct` funcionando.
- Pendientes:
  - Validar duplicados.
  - Manejo de varias imagenes.

---

## 6. Estado Actual de Pedidos
- `addOrder` y `updateOrder` operativos.
- Logica de `counters` funcionando.
- Pendientes:
  - Agregar campo observaciones/domicilio.
  - Validaciones extra antes de crear pedido.

---

## 7. Pendientes Inmediatos (resumen)
1. Completar notificaciones de mensajes no leidos.
2. Normalizar usuarios (email, campos opcionales).
3. Validar productos duplicados.
4. Agregar domicilio/observaciones en pedidos.
5. Mejorar manejo de errores global.

---

## 8. Comandos utiles (BE)
```
node server.js
```

---

## 9. Notas
El backend esta estable; el chat funciona con `chatId` y `leidoPor`. Las bases de datos y colecciones estan consistentes; faltan refinamientos en unread, validaciones y observaciones de pedidos.

---
