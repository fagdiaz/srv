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

## Consejos
- Pasar el archivo original y el objetivo exacto.
- Indicar que no se modifiquen rutas ni esquemas (chatId, participantes, leidoPor).
- Evitar cambios en frontend desde esta consola (scope backend).
- Aclarar si se debe usar emulator (opcional) o indices Firestore requeridos.
