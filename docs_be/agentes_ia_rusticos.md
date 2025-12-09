# Sistema de Agentes para Asistirme con IA (ChatGPT + Codex)
Proyecto: rusticoslanus (Angular + Node + Firebase)

Este documento define como quiero que la IA trabaje conmigo para lograr cambios limpios, seguros y eficientes en el proyecto.

---

# 1. Estructura de Roles / Agentes (Backend)

Los agentes NO son codigo del proyecto.  
Son roles mentales para organizar el trabajo.

## Coordinador
Objetivo: alinear backlog y prioridades BE, decidir alcance y tiempos.

## PM  Planificador
Objetivo: analizar objetivo y producir plan claro (requisitos, riesgos, MUST/NICE).

## Arquitecto BE
Objetivo: definir blueprint tecnica (componentes, rutas, flujos FEBE, indices Firestore, uso de emulator, manejo de quotas).

## Implementador BE
Objetivo: escribir codigo o prompts para Codex BE, acotados a archivos permitidos.  
- Para chat: respetar `chatId`, `participantes`, `leidoPor`, indices de Firestore.  
- Para Firestore: indicar indices requeridos y opcion de emulator.
- Para productos: respetar roles (`admin` vs `operador`/`cliente`), `activo` como soft delete, y documentar campos como `imagenUrl`/`orden`.

## QA / Debugger
Objetivo: revisar bugs, logs, cuotas, indices. Verificar 500 vs 503, mensajes de indice requerido y errores de Firestore.
- Para productos: probar que `/products` respeta roles/soft delete, `/products/update` y `/products/soft-delete` solo aceptan admin y devuelven `{ res: "ok", producto }` con `imagenUrl` cuando existe.

## Codex BE
Objetivo: aplicar cambios pequenos por archivo. No tocar FE. Seguir prompts con scope, restricciones y formato de entrega.

---

# 2. Flujo de Trabajo Recomendado

1. **PM:** definimos objetivo y tareas  
2. **Arquitecto:** definimos como se resuelve  
3. **Implementador:** generamos cambios o prompts Codex  
4. **Codex:** aplica cambios en BE  
5. **QA:** revisa logs/errores/indices/quotas  
6. **Prueba real en tu maquina** (idealmente contra Firestore Emulator primero)  
7. **Iteracion con cambios pequenos**

---

# 3. Ventajas del Sistema

- Trabajo mas limpio y ordenado  
- Cambios chicos y verificables  
- Menos errores y menos tiempo perdido  
- Documentacion automatica  
- Codex recibe prompts mas claros -> resultados mas precisos  
- Evita cambios gigantes que rompen todo

---

# 4. Como empezar cada dia

En una nueva conversacion de ChatGPT, pega esto:

"Quiero trabajar usando el sistema de agentes.  
Este es mi proyecto: [pegar resumen del proyecto actual].  
Arranquemos con el agente PM para planificar la tarea del dia: [objetivo]."

---

# 5. Notas para el Futuro
- Este documento puede ampliarse a medida que agreguemos Ionic, test unitarios o despliegue.  
- Podes agregar roles extra (por ejemplo: Disenador UI/UX).
