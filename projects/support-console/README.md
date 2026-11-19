# Support Console

Consola de soporte para un equipo pequeño: sesión de agente con clave de espacio, chat WebSocket en tiempo real, historial persistido localmente y límites básicos de longitud y frecuencia.

**Lenguaje:** JavaScript  
**Stack:** Node.js, ws, HTTP, WebSocket  
**Caso de uso:** revisar una bandeja de soporte colaborativa en una instalación local controlada.

## Ejecutar

~~~bash
cd projects/support-console
npm install
~~~

Configura SUPPORT_WORKSPACE_KEY con una clave local y luego ejecuta npm start. Abre http://127.0.0.1:3000. El servicio enlaza solo en localhost; esta demo no se debe publicar en Internet sin una capa de identidad y despliegue gestionado.

Los mensajes de ejemplo se guardan en data/messages.jsonl, archivo ignorado por Git.
