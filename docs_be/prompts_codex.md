# Prompts para Codex - rusticoslanus (Backend)

## Guia Rapida
- Siempre pedir cambios pequenos y por archivo.
- Incluir: objetivo, archivo(s), restricciones, que NO tocar, formato de entrega (diff/snippet).
- No dejar que elimine imports o metodos desconocidos.

## Plantillas

### Prompt Codex BE (codigo)
"Actua como Codex backend. Objetivo: [describir].
Archivo(s): [ruta].
No tocar: [listar].
Restricciones: [frameworks/versiones].
Entrega: diff claro o archivo completo si es pequeno.
Validar inputs y no romper otras rutas."

### Prompt Codex BE (revision)
"Actua como revisor backend. Revisa archivo/diff. Senala bugs, riesgos, validaciones faltantes. No sugerir refactors enormes, solo mejoras puntuales."

## Consejos
- Pasar el archivo original y el objetivo exacto.
- Si hay indices Firestore requeridos, mencionarlos en el prompt.
- Para chat, recordar `chatId`, `leidoPor`, `participantes`, `tipo` siempre `privado`.
- Para usuarios, doc id = UID Firebase Auth, rol default `cliente`, sin `pass`.
- Evitar cambios en frontend desde esta consola (scope backend).
