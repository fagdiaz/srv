# Tareas Pendientes - Backend (Node + Express + Firebase)

Este archivo registra las tareas activas, pendientes y completadas del BACKEND del proyecto Rusticos Lanus.

---

## MUST
- Documentar de forma centralizada los indices Firestore usados por chat (chatId+timestamp, participantes+timestamp).
- (Opcional) Agregar ejemplos JSON breves de request/response para `/chat`, `/chat/unread`, `/chat/conversaciones`.
- Preparar un checklist de pruebas rapidas para futuras modificaciones del chat (unread, quota_exceeded, indices).

## NICE TO HAVE
- Endpoint dedicado de busqueda si se necesita.
- Metricas basicas (cantidad de mensajes marcados leidos por dia).
- Setup paso a paso de Firestore Emulator.

---

## Seccion 1 - Chat (model/chat.js)
- [ ] Validacion extra en POST /chat para evitar mensajes vacios.
- [ ] Registrar timestamp del servidor en vez del cliente (opcional).
- [ ] Agregar logs legibles para depuracion.
- [ ] Verificar indice Firestore requerido (participantes + timestamp) y documentarlo.
- [ ] Checklist de pruebas rapidas para cambios de chat (unread, quota_exceeded, indices).

## Seccion 2 - Usuarios (model/usuarios.js)
- [ ] Validar email antes de crear documento.
- [ ] Registrar fecha de creacion y ultimo login.
- [ ] Normalizar nombre/apellido (opcional).
- [ ] Endpoint para actualizar datos del usuario (si el TP lo requiere).

## Seccion 3 - Productos (model/productos.js)
- Nota: ya existen endpoints `/products` (GET) y `/products/:id` (PUT/DELETE) con detección de rol (cliente/ordenador/admin) y soft delete, además de los wrappers POST `/products/update` y `/products/soft-delete` que reutilizan los mismos helpers.
- [ ] Validar que no existan productos duplicados.
- [ ] Soporte para imagenes multiples.
- [ ] Guardar stock y permitir actualizarlo.

## Seccion 4 - Pedidos (model/pedidos.js)
- [ ] Agregar campo "observaciones" en pedido.
- [ ] Validar que el carrito no este vacio.
- [ ] Confirmar logica de counters para numeracion.

## Seccion 5 - Seguridad
- [ ] Sanitizar inputs del FE.
- [ ] Unificar respuestas JSON (status + message + data).
- [ ] Manejar errores con try/catch en todas las rutas.
- [ ] Validar roles (admin / operador / cliente) en endpoints restringidos.

## Seccion 6 - Documentacion
- [ ] Completar `estado_actual.md` con la descripcion del chat (mantener fecha al dia).
- [ ] Documentar estructura de Firestore en un archivo aparte.
- [ ] Mantener actualizado este archivo de tareas.

---

### Pendiente de revision
- Definir si el TP exige autenticacion JWT real o si la implementacion actual es suficiente.
