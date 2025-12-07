# Backlog - rusticoslanus (Backend)

## Pendientes Proximo Sprint
- Chat: ajustar estilos del input, validar `unread` en UI, mejorar scroll automatico, panel de conversaciones mas limpio.
- App general: terminar Ionic/mobile, agregar observaciones al carrito, mejorar vistas /users (pipe filtro), carrusel y carga de imagenes en productos, test login/signout/roles, revisar seguridad de rutas FE.

## Ideas Futuras
- Metricas de uso del chat (tiempos de respuesta, conteo por rol).
- Notificaciones push/email para mensajes no leidos prolongados.
- Tests de integracion BE (endpoints chat/usuarios/pedidos) con emulador Firestore.
- Auditoria basica (logs estructurados) en endpoints sensibles.

## Riesgos / Deudas Tecnicas
- Sin autenticacion/verificacion de UID en backend (riesgo de suplantacion).
- Indices Firestore para chat (array-contains + orderBy) deben confirmarse/crearse.
- Validaciones minimas en payloads (tamanos de texto, formatos email).
- Inconsistencias menores en `productos.js` (mezcla async/await con .then, codigos de estado).
