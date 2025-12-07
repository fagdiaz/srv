# Tareas Pendientes - Backend (Node + Express + Firebase)

Este archivo registra las tareas activas, pendientes y completadas del BACKEND del proyecto Rusticos Lanus.

---

## Seccion 1 - Chat (model/chat.js)
### 1.1 Mejoras en endpoints existentes
- [ ] Validacion extra en POST /chat para evitar mensajes vacios.
- [ ] Registrar timestamp del servidor en vez del cliente (opcional).
- [ ] Agregar logs legibles para depuracion.

### 1.2 Unread / leidos
- [ ] Revisar implementacion actual de `/chat/unread` y `leidoPor`.
- [ ] Evaluar si se requiere "ultima vista" por usuario y conversacion.
- [ ] Documentar indice necesario (si aplica) para consultas de unread.

### 1.3 Optimizaciones Firestore
- [ ] Confirmar indice compuesto necesario para chatId + timestamp.
- [ ] Evaluar archivado de mensajes antiguos (opcional).

---

## Seccion 2 - Usuarios (model/usuarios.js)
- [ ] Validar email antes de crear documento.
- [ ] Registrar fecha de creacion y ultimo login.
- [ ] Normalizar nombre/apellido (opcional).
- [ ] Endpoint para actualizar datos del usuario (si el TP lo requiere).

---

## Seccion 3 - Productos (model/productos.js)
- [ ] Validar que no existan productos duplicados.
- [ ] Soporte para imagenes multiples.
- [ ] Guardar stock y permitir actualizarlo.

---

## Seccion 4 - Pedidos (model/pedidos.js)
- [ ] Agregar campo "observaciones" en pedido.
- [ ] Validar que el carrito no este vacio.
- [ ] Confirmar logica de counters para numeracion.

---

## Seccion 5 - Seguridad
- [ ] Sanitizar inputs del FE.
- [ ] Unificar respuestas JSON (status + message + data).
- [ ] Manejar errores con try/catch en todas las rutas.
- [ ] Validar roles (admin / operador / cliente) en endpoints restringidos.

---

## Seccion 6 - Documentacion
- [ ] Completar `estado_actual.md` con la descripcion del chat (mantener fecha al dia).
- [ ] Documentar estructura de Firestore en un archivo aparte.
- [ ] Mantener actualizado este archivo de tareas.

---

### Pendiente de revision
- Definir si el TP exige autenticacion JWT real o si la implementacion actual es suficiente.
