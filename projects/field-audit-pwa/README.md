# FieldAudit PWA

Aplicación para inspecciones de sucursales o instalaciones que puede seguir registrando hallazgos cuando el dispositivo pierde conexión. Guarda borradores localmente con IndexedDB, muestra el estado de conexión y permite exportar el registro como JSON para sincronizarlo con un sistema corporativo.

**Lenguaje:** JavaScript  
**Tecnologías:** PWA, Service Worker, IndexedDB, Web App Manifest  
**Caso de uso:** auditorías de seguridad, apertura de tienda o revisión de equipos.

## Ejecutar

Usa cualquier servidor estático local desde esta carpeta; por ejemplo, npx serve . Luego abre la URL que muestra el servidor. Service Workers requieren localhost o HTTPS.

Las inspecciones de demostración se almacenan en el navegador actual. No introduzcas datos personales reales. El botón Exportar crea un archivo JSON descargable.
