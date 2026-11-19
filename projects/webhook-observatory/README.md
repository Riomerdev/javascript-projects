# Webhook Observatory

Panel local para equipos de integración. Recibe eventos JSON, oculta campos sensibles antes de almacenarlos, muestra las entregas recientes y permite repetir una entrega dentro del simulador local.

**Lenguaje:** JavaScript  
**Stack:** Node.js, HTTP nativo, JSONL  
**Caso de uso:** investigar por qué una integración envió una carga inesperada sin reenviar datos a un tercero.

## Ejecutar

~~~bash
cd projects/webhook-observatory
npm start
~~~

Abre http://127.0.0.1:3400. En otra terminal puedes enviar un evento de demostración:

~~~bash
curl -X POST http://127.0.0.1:3400/hooks/billing -H "Content-Type: application/json" -d "{"event":"invoice.paid","customerEmail":"demo@example.test","token":"do-not-store"}"
~~~

El almacenamiento local data/events.jsonl se ignora en Git. El servidor escucha solo en localhost; el botón Reintentar llama al receptor simulado incluido y no a una URL arbitraria.
