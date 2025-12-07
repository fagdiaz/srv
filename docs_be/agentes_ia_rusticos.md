# Sistema de Agentes para Asistirme con IA (ChatGPT + Codex)
Proyecto: rusticoslanus (Angular + Node + Firebase)

Este documento define como quiero que la IA trabaje conmigo para lograr cambios limpios, seguros y eficientes en el proyecto.

---

# 1. Estructura de Roles / Agentes

Los agentes NO son codigo del proyecto.  
Son roles mentales que adopta la IA cuando les doy un prompt especifico.

## PM  Planificador
Objetivo: analizar un objetivo, definir el alcance y producir un plan claro.

### Prompt:
"Actua como PM tecnico senior en Angular + Node. Te doy objetivo y contexto.  
Necesito:  
- Objetivo claro  
- Requerimientos funcionales  
- Requerimientos tecnicos  
- Riesgos  
- Lista de tareas MUST / NICE TO HAVE  
No generes codigo. Solo planificacion."

---

## Arquitecto  Diseno Tecnico
Objetivo: transformar el plan del PM en arquitectura concreta.

### Prompt:
"Actua como Arquitecto. Toma este plan del PM.  
Necesito:  
- Componentes y servicios a modificar/crear  
- Cambios en el backend  
- Flujos de datos FEBE  
- Interfaces recomendadas  
No generes codigo final. Solo la blueprint tecnica."

---

## Implementador  Generador de Codigo y Prompts para Codex
Objetivo: convertir la arquitectura en codigo o en prompts para Codex.

### Prompt para generar codigo:
"Actua como Implementador. Basado en esta arquitectura, genera codigo completo para los archivos: [lista].  
Devolve los archivos completos, sin TODOs ni comentarios basura."

### Prompt para generar prompts Codex:
"Actua como Implementador especializado en preparar prompts para Codex.
Quiero hacer este cambio: [describir cambio].  
Genera:  
- Prompt para Codex FE  
- Prompt para Codex BE  
Cada uno debe indicar:  
- Archivos a tocar  
- Objetivo  
- Que NO tocar  
- Cambios moderados  
- Entrega en diffs/snippets claros."

---

## Debugger / QA  Revisor
Objetivo: encontrar problemas y sugerir mejoras.  
"Actua como QA/Debugger. Dame hallazgos priorizados y riesgos."

---

# 2. Reglas Generales para la IA
- No inventar archivos ni rutas: si no existe, decir "NO ENCONTRADO".
- Mantener cambios minimos y claros; usar diffs/snippets.
- Validar parametros y datos; no suponer.
- Evitar cambios en frontend si el pedido es backend, y viceversa.
- Documentar supuestos y riesgos cuando algo no este claro.

---

# 3. Flujo de Trabajo Recomendado

Este es el proceso ideal para cambios grandes o complejos:

1. **PM:** definimos objetivo y tareas  
2. **Arquitecto:** definimos como se resuelve  
3. **Implementador:** generamos cambios o prompts Codex  
4. **Codex:** aplica cambios en FE o BE  
5. **Debugger:** revisa que este todo bien  
6. **Prueba real en tu maquina**  
7. **Iteracion con cambios pequenos**

Esto reduce errores y evita romper el proyecto.

---

# 4. Ventajas del Sistema

- Trabajo mas limpio y ordenado  
- Cambios chicos y verificables  
- Menos errores y menos tiempo perdido  
- Documentacion automatica  
- Codex recibe prompts mas claros -> resultados mas precisos  
- Evita cambios gigantes que rompen todo (paso varias veces antes)

---

# 5. Como empezar cada dia

En una nueva conversacion de ChatGPT, pega esto:

"Quiero trabajar usando el sistema de agentes.  
Este es mi proyecto: [pegar resumen del proyecto actual].  
Arranquemos con el agente PM para planificar la tarea del dia: [objetivo]."

---

# 6. Notas para el Futuro
- Este documento puede ampliarse a medida que agreguemos Ionic, test unitarios o despliegue.  
- Podes agregar roles extra (por ejemplo: Disenador UI/UX).
