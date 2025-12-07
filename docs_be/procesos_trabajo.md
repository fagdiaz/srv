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
1) **Detectar** necesidad (bug/feature) y confirmar que es BE.
2) **Contexto**: leer `estado_actual.md` + `backlog.md` y copiar fragmentos de codigo relevantes.
3) **Prompt pequeno** a Codex (un archivo/funcion por vez; usar `prompts_codex.md`).
4) **Ejecutar** cambio en Codex.
5) **Probar local** (`node server.js` o tests manuales de endpoints afectados).
6) **Revisar** (auto-QA) que solo se tocaron archivos esperados; mirar logs/errores.
7) **Actualizar docs** si cambia estado o backlog.

---

## Reglas para trabajar con IA (BE)
- Siempre indicar archivos permitidos y objetivo concreto.
- No pedir "refactor general" ni mezclar FE/BE.
- Cambios chicos y atomicos; revisar con `git diff`.
- No alterar `chatId` ni estructuras Firestore sin pedido explicito.
- No agregar dependencias externas sin aprobacion.
- Si Codex toca archivos indebidos, descartar y reintentar con prompt mas preciso.

---

## Pruebas minimas (BE)
- Chat (`model/chat.js`):
  - POST `/chat` crea mensaje con `chatId`, `participantes`, `leidoPor` (vacio al crear).
  - GET `/chat` trae solo mensajes del par de UIDs, marca `leidoPor` para `uidActual`.
  - GET `/chat/conversaciones` lista ultimas conversaciones.
  - GET `/chat/unread` devuelve conteo por `chatId`.
- Usuarios (`model/usuarios.js`): `/signup`, `/usuarios`, `/obtenerUsuario`, `/google-login` devuelven datos consistentes (sin `pass`).
- Pedidos: `/addOrder`, `/updateOrder`, `/orders` funcionan; mantener compatibilidad de datos.
- Productos: `/productos` estable.

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

## Seguridad minima
- No exponer claves/creds en el repo.
- No loguear datos sensibles en produccion.
- Validar payloads en endpoints criticos.
- Manejar errores con try/catch en modelos.

---

## Resumen operativo
1. Identificar problema/tarea (BE).
2. Revisar `estado_actual.md` y `backlog.md`.
3. Preparar prompt chico (ver `prompts_codex.md`).
4. Ejecutar en Codex.
5. Probar local.
6. Revisar diff.
7. Actualizar docs si aplica.
