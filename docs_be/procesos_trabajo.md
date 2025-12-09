# Procesos de Trabajo - Proyecto RusticosLanus (Backend /srv)

Este documento define como trabajamos en el backend (Node.js + Express + Firebase Admin) y como usar la IA (ChatGPT/Codex) sin romper el proyecto.

---

## Objetivo del documento
- Integrar rapido a devs o IA.
- Evitar errores repetidos y re-trabajo.
- Alinear reglas operativas de backend.

---

## Estructura y contexto
- Alcance: solo backend en `/srv` (Node + Express + Firebase Admin).
- Documentos relevantes en `/srv/docs_be/`:
  - `estado_actual.md`
  - `backlog.md`
  - `prompts_codex.md`
  - `agentes_ia_rusticos.md`
  - `tareas_pendientes.md`
- Separacion FE/BE: no mezclar cambios frontend en esta consola.

---

## Flujo recomendado
1) **PM/Coordinador** acuerda objetivo y tarea (MUST/NICE) en backlog.
2) **Arquitecto BE** define blueprint (archivos, rutas, indices, emulator si aplica).
3) **Implementador BE** prepara prompt para Codex (scope de archivos, que tocar/que no, formato diff/snippet).
4) **Codex** aplica cambio acotado en BE.
5) **QA** verifica logs/errores/indices/quotas, 500 vs 503, que GET `/products` respete roles y que los endpoints de productos solo permitan admin.
6) Probar local (preferible primero contra Firestore Emulator).
7) Actualizar docs/backlog si aplica.

---

## Reglas para trabajar con IA (BE)
- Siempre indicar archivos permitidos y objetivo concreto.
- No pedir "refactor general" ni mezclar FE/BE.
- Cambios chicos y atomicos; revisar con `git diff`.
- No alterar `chatId` ni estructuras Firestore sin pedido explicito.
- No agregar dependencias externas sin aprobacion.

---

## Pruebas minimas (BE)
- Chat (`model/chat.js`):
  - POST `/chat` crea mensaje con `chatId`, `participantes`, `leidoPor` con remitente.
  - GET `/chat` usa `chatId`, `limit`, orden desc/asc, y marca `leidoPor` para `uidActual` via `markMessagesAsReadForUser` (batch commit antes de responder).
  - GET `/chat/conversaciones` lista ultimas conversaciones.
  - GET `/chat/unread` devuelve conteo por `chatId` usando `getUnreadCountsByChatForUser` (mismo criterio `isUnreadForUser` que el marcado).
- Usuarios: `/signup`, `/usuarios`, `/obtenerUsuario`, `/google-login` devuelven datos consistentes (sin `pass`).
- Pedidos: `/addOrder`, `/updateOrder`, `/orders` funcionan; mantener compatibilidad de datos.
- Productos: `/productos` estable.

---

## QA / Debug
- Revisar logs: que GET/POST no spamee y marquen errores claros.
- Errores: 500 para generales, 503 `quota_exceeded` si Firestore devuelve code 8 o quota exceeded.
- Indices: atender mensajes de Firestore, crear indice (chatId+timestamp, participantes+timestamp) si lo pide.
- Emulator: cuando se pueda, probar primero con Firestore Emulator (envs `USE_FIRESTORE_EMULATOR` o `FIRESTORE_EMULATOR_HOST`).
- Productos: verificar que admin puede alta/edicion/soft delete y recibe `{ res: "ok", producto }` (incluye `imagenUrl`), y que cliente/operador solo ven activos en GET `/products`.

---

## Registro de tareas
- Usar `backlog.md` y `tareas_pendientes.md` para pendientes backend.
- Mantener "Ultima actualizacion" en `estado_actual.md` al dia cuando haya cambios relevantes.

---

## Ritmo de trabajo
- Sesiones cortas (1-2h), cambios pequenos + revision.
- Cerrar una feature antes de abrir otra.
- Al final del dia: actualizar docs y dejar resumen breve.

---

## Resumen operativo
1. Identificar problema/tarea (BE).
2. Revisar `estado_actual.md` y `backlog.md`.
3. Preparar prompt chico (ver `prompts_codex.md`).
4. Ejecutar en Codex.
5. Probar local (ideal emulator primero).
6. Revisar diff y logs/errores/indices.
7. Actualizar docs si aplica.
