# ML-19 · Dependencias y bundles web

Medición del 6 de noviembre de 2026. Base `dc8bfab`, candidato medido `a5a43fe`.
Node 24.18.0, npm 11.16.0 y Chromium 153.0.8010.12. SPA y PWA usan el proyecto
ficticio de CI. VitePress se sirve desde el build estático local.

## Dependencias y seguridad

| Lockfile | Base, npm audit                                   | Candidato, npm audit | Cambio                                                                                                                     |
| -------- | ------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Raíz     | FAIL · 6 entradas moderadas, un aviso de origen   | PASS · 0 avisos      | Retirar el arranque y compilador i18n sin consumidores. Fijar `minimatch@11.0.1` para ESLint y su config array.            |
| PWA      | FAIL · 3 entradas moderadas, dos avisos de origen | PASS · 0 avisos      | Mantener Workbox 7.4.1 y el parche local de deepmerge. Fijar `glob@14.0.2` y su `minimatch@11.0.1` en el árbol de Workbox. |

Las entradas incluyen paquetes afectados indirectamente. Las correcciones responden a
[minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
y [glob GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4).
Los overrides cruzan rangos mayores de dependencias transitivas de desarrollo. Verificar
lint, instalación limpia, generación del worker y comportamiento de precache y actualización
al revisar el PR. Los dos `npm ci` finalizaron correctamente.

El inventario de versiones conserva Firebase 12.18.0, Quasar 2.35.1, Vue 3.5.42,
Vue Router 5.3.0, Vite 8.2.4 para la aplicación y VitePress 1.6.4 con su Vite 6.4.5.
`npm outdated` mostró versiones más recientes de varios paquetes, entre ellas Firebase
13.2.0 y Playwright 1.65.0. El candidato se limita a las correcciones de los avisos y
a retirar el i18n sin uso. Los textos de la aplicación y la configuración de idioma de
Quasar siguen en español.

## JS y CSS antes y después

Bytes medidos como archivos únicos descargados al abrir la ruta en un contexto nuevo,
sin interacción y con service worker bloqueado. Gzip se calcula por archivo. La cifra
excluye HTML, imágenes, fuentes, caché de Hosting, precache y tiempos de red de producción.

| Entrada                          | Archivos antes → después | Bytes sin comprimir antes → después | Bytes gzip antes → después |
| -------------------------------- | -----------------------: | ----------------------------------: | -------------------------: |
| SPA · inicio de sesión           |                  18 → 15 |               1 106 645 → 1 055 512 | 323 584 → 305 263 (−5,7 %) |
| PWA · inicio de sesión           |                  19 → 16 |               1 115 666 → 1 064 281 | 327 601 → 309 159 (−5,6 %) |
| VitePress · portada pública      |                  18 → 18 |                   402 250 → 399 444 |          124 552 → 124 138 |
| VitePress · portada del proyecto |                  18 → 18 |                   402 250 → 399 456 |          124 552 → 124 131 |
| VitePress · despliegues          |                  22 → 22 |                   458 656 → 458 616 |          141 838 → 142 470 |

Distribución completa JS/CSS en gzip, SPA 407 111 → 388 574, PWA 416 349 →
397 673, portal 693 052 → 708 539. El portal añade documentación y el índice
de búsqueda crece de 181 343 a 185 197 bytes gzip. Las dos portadas ahora
importan sus componentes desde su ruta. La aplicación mantiene las rutas diferidas y
el módulo Firebase de 556 KB sin comprimir sigue siendo su chunk mayor. Se conserva la
inicialización de Auth/Firestore de ML-15 y el aviso de tamaño del compilador.

## Repetición

1. Hacer checkout de cada revisión por separado y ejecutar `npm ci` y
   `npm ci --prefix src-pwa`. Instalar Chromium de Playwright.
2. Ejecutar `npm run audit:dependencies` y registrar fecha y salida del registro.
   Para diagnosticar ambos lockfiles aunque falle el primero, ejecutar
   `npm audit --json` y `npm audit --prefix src-pwa --json` por separado.
3. Compilar SPA/PWA con las variables demo de CI y ejecutar `npm run docs:build`.
4. Desde el candidato, ejecutar `node scripts/measure-web-bundles.mjs`. Para medir
   la base con el mismo instrumento, añadir sus tres directorios SPA, PWA y docs en
   ese orden. Comparar entradas, distribución completa y los tres mayores chunks.

Pendientes para aceptación de rendimiento, observaciones en navegador nativo móvil
y tiempos de producción, donde la caché, compresión y latencia pueden ser distintas.
