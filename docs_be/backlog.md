# Backlog - rusticoslanus (Backend)

## Completadas
- TAREA 14: /chat/unread implementado con leidoPor y conteo por chatId.
- TAREA 5: marcado de leidos en GET /chat y sincronizacion con /chat/unread (usa markMessagesAsReadForUser).
- TAREA 6: fix definitivo de badge unread (FE+BE) usando getUnreadCountsByChatForUser.
- Productos: nueva ruta GET /products que filtra por rol, PUT /products/:id y DELETE /products/:id con validaciones de admin/ordenador y wrappers POST para mantener compatibilidad con el FE legado.

## Pendientes / Futuras
- Endpoint de busqueda avanzada (si se implementa).
- Logging mas estructurado (JSON logs).
- Uso sistematico del Firestore Emulator para dev/test.
- Documentar y validar indices Firestore de chat (participantes + timestamp, chatId + timestamp).
