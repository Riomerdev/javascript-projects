# Regional Ops Dashboard

Panel de control de inventario para equipos que operan en varias regiones. Ayuda a localizar SKU bajo su mínimo de reposición, filtrar por región y exportar una vista CSV. Abre directamente con datos ficticios y puede sincronizarse con Inventory Control API en C#.

## Tecnologías

React 19.3, TypeScript 7, Vite 8, consumo REST, diseño adaptable y compilación de producción mediante GitHub Actions.

## Ejecutar

Requiere Node.js 22.12 o superior y npm. Desde esta carpeta:

~~~sh
npm install
npm run dev
~~~

Vite muestra la dirección local al iniciar. Para compilar la distribución usa npm run build.

## Conectar con la API

Copia .env.example como .env.local y configura VITE_INVENTORY_API_URL. En este portafolio, Inventory Control API escucha en http://localhost:5080 y permite el origen del servidor Vite. Pulsa Conectar API; si el servicio no está disponible, el dashboard conserva la muestra local.

La interfaz incluye búsqueda, filtro regional, filtro de reposición, resumen de disponibilidad por región y exportación CSV de los resultados visibles. El contrato esperado es GET /api/products?page=1&pageSize=100 con una respuesta paginada items/total/page/pageSize.

## English

Responsive React and TypeScript inventory control tower with multi-region filters, replenishment prioritization, CSV export and an optional REST connection to the .NET Inventory Control API. Fictional local data keeps the dashboard usable without a backend.
