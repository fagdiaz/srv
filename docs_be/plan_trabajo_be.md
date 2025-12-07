# Plan de Trabajo Backend (srv) - rusticoslanus
Última actualización: [poner fecha]

## 1) Resumen del estado actual (BE)
- Backend en Node + Express + Firebase Admin (Firestore) operativo.
- API REST para usuarios, productos, pedidos y chat privado 1 a 1.
- Chat usa `chatId` (uids ordenados), `leidoPor`, endpoints `/chat`, `/chat/conversaciones`, base `/chat/unread`.
- Usuarios: `/signup`, `/usuarios`, `/obtenerUsuario`, `/google-login`; doc id = UID, rol default cliente; sin `pass` en respuestas.
- Pedidos: `/addOrder`, `/updateOrder`, `/orders`; numeración con `counters`.
- Productos: GET/POST funcionando; estilo legacy (mezcla async/await y .then).
- Docs en `/srv/docs_be` (arquitectura, backlog, procesos, prompts, tareas, agentes, estado actual).
- Riesgos: índices Firestore pendientes (chat), validaciones mínimas, sin auth/roles estrictos.

## 2) Requisitos del TP que dependen del BE
- Alta/login de usuarios (email/password y Google) con doc UID en Firestore.
- Chat privado 1 a 1 con Firestore como DB (guardar, listar, conversaciones, no leídos).
- Gestión de productos y pedidos (alta/listado/actualización, numeración).
- Consistencia de datos (sin mezclar mensajes, sin exponer `pass`).

## 3) Cumplido en el BE
- Rutas usuarios: `/signup`, `/usuarios`, `/obtenerUsuario`, `/google-login` (rol por defecto cliente, doc UID).
- Chat: `chatId` determinístico, `leidoPor` guardado; `/chat` (POST/GET), `/chat/conversaciones` operativo.
- Pedidos: `/addOrder`, `/updateOrder`, `/orders` con `counters`.
- Productos: GET/POST funcionales.
- Docs internas creadas (agentes, procesos, backlog, estado, prompts, arquitectura chat, tareas).

## 4) Falta en el BE
- Chat: completar `/chat/unread` (conteo y consumo FE), confirmar índices Firestore, validaciones extra (texto, tamaños), logging controlado.
- Usuarios: validar formato email/fechas; endpoint de actualización si lo exige el TP; normalizar datos opcionales.
- Pedidos/productos: agregar `observaciones`/`domicilio` a pedidos; validar carrito no vacío; validar duplicados en productos; preparar soporte para múltiples imágenes.
- Seguridad: roles/inputs/errores unificados; documentar índices.

## 5) Plan 3 días (solo BE)
### Día 1
- Chat: finalizar `/chat/unread` con `leidoPor` y devolver conteo por `chatId` (archivos: `model/chat.js`, `server.js` si se requiere export/import).
- Usuarios: validar email en `addUser` y `googleLogin` (archivo: `model/usuarios.js`).

### Día 2
- Pedidos: agregar campo opcional `observaciones`/`domicilio` en `addOrder`/`updateOrder` (archivo: `model/pedidos.js`).
- Productos: validar duplicados básicos (nombre/sku) en `addProduct` (archivo: `model/productos.js`).

### Día 3
- Índices/seguridad: documentar índice necesario para chat en comentarios y revisar validaciones de payload/roles mínimas (archivos: `model/chat.js`, `docs_be/estado_actual.md` si se actualiza fecha/nota).
- Limpieza de errores/respuestas: unificar mensajes y try/catch en productos/pedidos si hay tiempo (mismo archivo que se toque).

## 6) Prompts ejemplo (por tarea)
- Chat unread (Día 1):
  "Trabaja SOLO en `model/chat.js` (y `server.js` si necesitas exportar la ruta). Objetivo: completar `/chat/unread` usando `leidoPor` para contar no leídos por `chatId` para `uidActual`. No toques otras funciones ni rutas. Mantén el esquema de mensaje actual (`chatId`, `participantes`, `leidoPor`). Entrega diff claro."

- Validar email usuarios (Día 1):
  "Trabaja SOLO en `model/usuarios.js`. Objetivo: validar formato de email en `addUser` y `googleLogin` (rechazar si falta o es inválido). No cambiar rutas ni otros modelos. Entrega diff mínimo."

- Observaciones pedidos (Día 2):
  "Trabaja SOLO en `model/pedidos.js`. Objetivo: agregar campo opcional `observaciones`/`domicilio` en `addOrder` y `updateOrder`, sin romper compatibilidad. No toques otras rutas ni modelos. Entrega diff claro."

- Duplicados productos (Día 2):
  "Trabaja SOLO en `model/productos.js`. Objetivo: prevenir duplicados (nombre/sku) en `addProduct`; si existe, responder error 400. No mezclar FE ni otros modelos. Entrega diff mínimo."

- Índice chat + validaciones (Día 3):
  "Trabaja SOLO en `model/chat.js` (y `docs_be/estado_actual.md` para nota de índice si aplica). Objetivo: agregar comentario de índice requerido para consultas de chat y validar payload (texto no vacío, uids presentes). No tocar otras funciones. Entrega diff claro."

