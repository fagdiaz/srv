# Prompts para Codex - rusticoslanus (Backend)

## Guia Rapida
- Siempre pedir cambios pequenos y por archivo.
- Incluir: objetivo, archivo(s), restricciones, que NO tocar, formato de entrega (diff/snippet).
- No dejar que elimine imports o metodos desconocidos.
- Si aplica, mencionar indices Firestore (chatId+timestamp, participantes+timestamp) y uso opcional de emulator.

## Plantillas / Ejemplos

### TAREA 1 (/chat/unread)
- Scope: `model/chat.js` (y `server.js` solo si falta ruta).
- Objetivo: implementar conteo de no leidos por `chatId` usando `leidoPor`.
- No tocar otras rutas.
- Respuesta: lista `{ chatId, unread }`.

### TAREA 3 (quota_exceeded)
- Scope: `model/usuarios.js`, `model/chat.js`.
- Objetivo: si Firestore devuelve code 8 / "quota exceeded", responder 503 `{ error: "quota_exceeded" }`.
- Mantener 500 para otros errores.

### TAREA 5 (marcado de leidos)
- Scope: `model/chat.js` en GET `/chat` (y helpers compartidos).
- Objetivo: usar `markMessagesAsReadForUser` y `isUnreadForUser` para marcar antes de responder; `GET /chat/unread` debe usar `getUnreadCountsByChatForUser` con el mismo criterio.
- No tocar `/chat/unread` ni `/chat/conversaciones` fuera de compartir lógica.

### TAREA 7 (productos + roles)
- Scope: `model/productos.js` (y `server.js` solo si ya existe ruta auxiliar de compatibilidad).
- Objetivo: añadir/ajustar campos `imagenUrl`/`activo` o reglas de rol sin romper los contratos `/products`, `/products/update`, `/products/soft-delete` ni el legacy `/productos`.
- Restringir mutaciones a `admin`, respetar soft delete (`activo: false`) y mantén logs `[products] ...`.
- Entrega diff que incluya el nuevo campo o permiso sin afectar chat/usuarios/otros modelos.

### TAREA 8 (admin users)
- Scope: `routes/adminUsers.js` y `model/usuarios.js` si se necesita doc helper.
- Objetivo: documentar/ajustar la lógica de `/admin/users` (GET y los PATCH de rol/estado), el helper `isLastActiveAdmin` y la protección `requireAdmin` para evitar dejar sin administradores activos.
- Validar que el GET exponga `rol`/`activo`, que los PATCH guarden `updatedAt` y devuelvan `{ res: "ok", usuario }`, y que el helper solo bloquee cuando el target sea el único admin activo.
- No tocar chat/productos.

### TAREA 9 (pedidos + OrdersAdmin)
- Scope: `model/pedidos.js`.
- Objetivo: asegurar que `/addOrder` agrega `createdAt`, `emailUsuario` y `dniUsuario` desde el usuario autenticado (o el checkout) y que `/orders` devuelve `numeroPedido`, `createdAt`, `emailUsuario`, `dniUsuario` además del resto del documento (sin renombrar campos existentes).
- Mantener el contador transaccional y no crear nuevas rutas.

### TAREA 10 (obtenerUsuario)
- Scope: `model/usuarios.js`.
- Objetivo: documentar/ajustar `GET /obtenerUsuario` para que, usando `authMiddleware`, recree el doc en `usuarios/{uid}` cuando no existe (rol=cliente, activo=true, timestamps) y siempre devuelva `{ res: "ok", usuario }` con `uid`, `rol`, `activo`, `email`, `dni`.

### TAREA 11 (admin users modificación)
- Scope: `routes/adminUsers.js`.
- Objetivo: ajustar los PATCH `/admin/users/:uid/rol` y `/admin/users/:uid/estado` para que consulten al helper `isLastActiveAdmin`, bloqueen cambios que dejarían sin administradores activos (400 con message) y sigan devolviendo `{ res: "ok", usuario }`.

### TAREA 12 (docs BE)
- Scope: `docs_be/estado_actual.md` y `docs_be/procesos_trabajo.md`.
- Objetivo: actualizar las secciones de usuarios, admin users, pedidos y CORS para reflejar la auto-creación de usuarios, las reglas de último admin activo, la metadata que consume OrdersAdmin y la configuración de `cors`/Authorization actual.

## Consejos
- Pasar el archivo original y el objetivo exacto.
- Indicar que no se modifiquen rutas ni esquemas (chatId, participantes, leidoPor).
- Evitar cambios en frontend desde esta consola (scope backend).
- Aclarar si se debe usar emulator (opcional) o indices Firestore requeridos.
