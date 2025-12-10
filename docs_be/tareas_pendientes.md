# Tareas Pendientes - Backend (Node + Express + Firebase)

Este archivo lista SOLO lo que aún falta en el backend de Rusticos Lanus, evitando duplicar lo ya completado.

---

## MUST
- Tests automatizados para `/obtenerUsuario` y los endpoints `/admin/users/:uid/rol` y `/admin/users/:uid/estado` (validar reglas de último admin activo).
- Revisar/documentar las reglas de seguridad de Firestore para `usuarios` y `pedidos`, garantizando que solo admins puedan mutar campos sensibles.

## NICE TO HAVE
- Logs/métricas estructurados para pedidos (`/addOrder`, `/orders`) y autenticaciones/admin users.
- Paginar el listado `/orders` y agregar alertas/monitoreo cuando quede un solo admin activo.

---

### Pendiente de revisión
- Evaluar si hace falta un segundo esquema de autenticación JWT adicional al existente con Firebase.
