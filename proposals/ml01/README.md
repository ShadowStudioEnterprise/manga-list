# ML-01 — auditoría del portal público y correcciones propuestas

26/10/2026, Europe/Madrid. **ML-01 no está cerrada. No se recomienda cerrarla con el portal actual.**

La auditoría de https://mangalist-docs.web.app encontró problemas de accesibilidad en
la 404 y en el sidebar de informes, y 28 variantes históricas `.html` que devuelven 404. Este candidato los corrige localmente y añade pruebas de regresión. Requiere
revisión, fusión y publicación expresamente autorizadas, y comprobación pública
posterior. Este informe no autoriza ninguna de esas operaciones.

## Fuente, Hosting y atribución del build

- `main` consultado por fetch: `f8aa43069c7dab5c340e97ffa6230ed2752d80e3`.
- Árbol: `e37efb190587c05dcd3c1f62d37e21243d126136`.
- Rama de trabajo independiente: `audit/ml01-public-20261026`.
- Versión activa consultada por API de solo lectura:
  `sites/mangalist-docs/versions/335d0b18ab1863cc`, `FINALIZED`.
- Release: `sites/mangalist-docs/channels/live/releases/1793033175253000`,
  publicado el 26/10/2026 a las 17:46:15 CET (`16:46:15Z`).
- **300/300 archivos** del build conservado de esa publicación coinciden por
  SHA-256 con sus respuestas públicas descomprimidas. Su checkout está limpio y
  apunta al mismo commit/árbol de `main`. El inventario remoto contiene esos 300
  archivos y dos archivos generados por Hosting, `/__/firebase/init.js` y
  `/__/firebase/init.json`, que no forman parte del build VitePress.
- No existe marcador público de revisión en `/build-info.json` ni
  `/build-evidence.json` (404); la versión solo etiqueta `deployment-tool`.
  **La atribución del commit es indirecta**, mediante checkout, build conservado,
  registro de publicación e igualdad de archivos; Hosting no declara ese SHA.

Se repitieron `npm run docs:build` y `npm run docs:check` sobre el checkout separado
de `main`, y después sobre el candidato. Ambos pasan. Integridad: 78 páginas
documentales, 28 huellas fuente, 63 commits y 742 destinos locales. Hay 80 HTML
incluyendo las páginas legales generadas. Persisten los avisos de chunks mayores
de 500 kB y de `jsconfig.json` cuando falta el archivo generado de Quasar.

La primera compilación no pudo consultar Git por la propiedad del checkout. Se
repitió con una excepción de propiedad limitada al proceso, sin cambiar la
configuración global. Además, compartir dependencias mediante junction entre
checkouts cambia IDs de ámbito Vue y nombres de assets: una recompilación en una
carpeta distinta no coincide byte a byte. No se interpreta eso como código antiguo
en Hosting. La comprobación definitiva usa el build conservado, no nombres de
assets de otra compilación. Se guardaron los diagnósticos iniciales por separado.

## Matriz de aceptación

PASS significa comprobación superada dentro del alcance indicado. FAIL significa
defecto reproducido. BLOCKED significa que no se certificó ese aspecto, con causa
expresa. Un PASS local no cambia un FAIL público.

| Comprobación                                      | Portal publicado                                | Candidato local | Evidencia y criterio                                                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portada y portal técnico                          | PASS                                            | PASS            | `/` y `/project/`, carga, H1 y contenido visibles                                                                                                    |
| Recorrido completo                                | PASS                                            | PASS            | 80 rutas HTML, 200; ruta inexistente 404                                                                                                             |
| Build e integridad                                | PASS                                            | PASS            | `docs:build`, `docs:check`, sin omitir controles                                                                                                     |
| Assets del release                                | PASS                                            | PASS            | 300 archivos públicos iguales al build conservado; imágenes sin fallos en la matriz                                                                  |
| Enlaces internos y anclas                         | PASS                                            | PASS            | 742 destinos de HTML y assets, 200 y anclas existentes; suite local comprueba además 657 enlaces de navegación                                       |
| Navegación desktop y móvil                        | PASS                                            | PASS            | Guía, menú, sidebar y cambio a Servicios y errores                                                                                                   |
| Búsqueda local                                    | PASS                                            | PASS            | Ctrl/Command+K, foco en campo, tildes, resultados, sin resultados, flecha/Enter y Escape                                                             |
| Enlaces profundos                                 | PASS                                            | PASS            | Resultado con hash, acceso directo y recarga conservan documento/ancla                                                                               |
| URLs limpias                                      | PASS                                            | PASS            | Canonical documental sin `.html`; `/reports` normaliza a `/reports/` en navegador y los enlaces relativos funcionan                                  |
| Legacy configurado inicialmente                   | PASS                                            | PASS            | 29 redirecciones históricas 301 al destino esperado                                                                                                  |
| Legacy `.html` omitido                            | **FAIL**                                        | PASS            | 28/28 variantes públicas 404; candidato añade 28 reglas 301 y comprueba los 57 destinos                                                              |
| 404: estado y recuperación                        | PASS                                            | PASS            | HTTP 404 real y vuelta a portada por teclado; no es fallback 200                                                                                     |
| 404: accesibilidad                                | **FAIL**                                        | PASS            | Nombre accesible distinto del texto visible, sin landmark principal; candidato usa main, H1 y enlace coherente en español                            |
| Sidebar de informes: accesibilidad                | **FAIL**                                        | PASS            | Controles anidados `nested-interactive`; candidato usa un único botón nativo por grupo, Enter/Space y `aria-expanded`                                |
| Responsive y temas                                | PASS                                            | PASS            | Todos los documentos a 1440 px claro/oscuro; 11 rutas representativas a 320/390/768/1440, sin overflow del documento ni imágenes rotas               |
| Axe completo                                      | **FAIL**                                        | PASS            | Público: 226 estados, 136 con incidencias en 62 rutas; candidato: 226 estados, cero violaciones                                                      |
| Teclado y persistencia                            | PASS, con defectos de nombre/control anteriores | PASS            | Skip link, búsqueda, FAQ Enter/Space, navegación; tema por control y persistencia tras recarga                                                       |
| Consola y red                                     | PASS                                            | PASS            | Sin excepciones JS; solo 404 deliberadas. Traza pública complementaria: 109 peticiones al propio origen, cero fallidas y ninguna a Firebase de datos |
| Firefox                                           | PASS limitado                                   | PASS limitado   | Navegación/carga móvil y overflow en portada, portal técnico, diagramas y guía; no matriz completa                                                   |
| Enlaces externos públicos                         | PASS limitado                                   | PASS limitado   | 165/169 respuestas HTTP correctas; no certifica significado ni todos los fragmentos externos                                                         |
| Enlaces externos con acceso restringido           | BLOCKED                                         | BLOCKED         | Tres consolas Google llevan a login; ajustes de reglas GitHub devuelve 404 sin permisos. No se ha intentado eludir autenticación                     |
| Safari, dispositivos físicos y lector de pantalla | BLOCKED                                         | BLOCKED         | Sin entorno/operador de aceptación disponible; emulación de tamaños no equivale a dispositivos físicos                                               |
| Spark y aislamiento operativo                     | PASS                                            | PASS            | Lectura confirma billing deshabilitado/desvinculado y Firestore Standard; no hubo despliegue ni modificación remota                                  |

## Defectos y solución

1. **404 accesible.** El tema publicado muestra `Take me home`, pero el enlace se
   llama `go to home` para tecnologías de asistencia (WCAG 2.5.3). También faltan
   los landmarks detectados por `landmark-one-main` y `region`. Un slot del tema
   proporciona una 404 en español, con un `main`, H1 y enlace a la portada.
2. **Sidebar de informes.** VitePress 1.6.x genera un elemento con `role=button`
   que contiene otro control enfocable. El adaptador de compilación conserva el
   componente y sus estilos, elimina el control exterior y usa un botón nativo
   de disclosure con nombre y `aria-expanded`. La compilación falla expresamente
   si cambia la estructura upstream que adapta; habrá que revisarlo al actualizar
   VitePress. No se modifica `node_modules` ni se suprimen reglas de Axe.
3. **Legacy `.html`.** Las redirecciones documentales migradas solo contemplaban
   la ruta sin extensión. Se añaden las 28 variantes `.html` a `hosting:docs`.
   No se cambia el target app, reglas, proyecto, plan ni comandos de despliegue.

La suite local ahora sirve el fallback 404 compilado y simula las redirecciones
de configuración, verifica los 57 pares origen/destino y prueba la 404 y el
sidebar con Axe completo y teclado. Espera el fin de las transiciones de color
antes de medir contraste. Las pruebas públicas originales quedan separadas.

## Cobertura y límites

Chromium `153.0.8010.12`: 80 rutas, 226 auditorías completas de Axe 4.14,
claro/oscuro. Once rutas representativas cubren además móvil/tablet: portada,
portal técnico, guía, diagramas, servicios, importación/exportación, inventario,
roadmap, índice de informes, legal y 404. Las tablas pueden tener desplazamiento
local sin provocar overflow de la página. Firefox `155.0`: smoke móvil adicional.
Se realizó también comprobación interactiva en el navegador integrado.

No se afirma conformidad WCAG completa: Axe deja comprobaciones `incomplete` de
contraste que requieren juicio humano; texto integrado en capturas y aceptación
con tecnologías de asistencia no quedan certificados automáticamente. Los
BLOCKED de consolas administrativas no son enlaces públicos rotos ordinarios.
`/guide/introduction/` devuelve 404; la URL soportada es `/guide/introduction`.
Las 28 variantes históricas omitidas sí se consideran regresión a corregir.

La CI ejecuta builds, integridad, pruebas y auditorías locales. **No certifica el
portal público y no despliega automáticamente.** Este informe usa peticiones y
navegación contra el portal público, separadas de los resultados locales.

## Evidencias

- [Matriz automatizada pública](evidence/public-audit.json): rutas, estados,
  detalles de incidencias y comprobaciones interactivas.
- [Igualdad del release y enlaces](evidence/release-parity.json): 300 hashes,
  742 destinos y cero fallos en ese inventario.
- [Versión remota](evidence/hosting-current.json) e
  [inventario de Hosting](evidence/hosting-files.json), solo lectura.
- [Legacy `.html` público](evidence/legacy-html-current.json): 28 respuestas 404.
- [Enlaces externos](evidence/external-links.json): resultado HTTP y clasificación.
- [Repetición completa del candidato](evidence/candidate-scans.json) y
  [suite local ampliada](evidence/candidate-portal.json).
- [404 publicada](evidence/public-404.png) y
  [404 corregida localmente](evidence/candidate-404.png).
- [Sidebar publicado](evidence/public-reports.png) y
  [sidebar corregido localmente](evidence/candidate-reports.png).
- Logs de build/integridad/Spark junto a los JSON. La traza HAR y capturas
  adicionales se conservan en el directorio local `audit-evidence/ml01-20261026/`.

## Criterios para recomendar el cierre

1. Revisar y fusionar el candidato con aprobación expresa y controles vigentes.
2. Publicar exclusivamente `hosting:docs` desde el commit fusionado, solo tras
   aprobación expresa, manteniendo Spark y los controles existentes.
3. Volver a leer la versión activa y vincularla al build que se publique; verificar
   archivos, rutas, 57 redirecciones, búsqueda, deep links, 404, responsive, temas,
   teclado, Axe y consola/red **en el portal público**.
4. Resolver cualquier nuevo FAIL. Registrar la aceptación explícita del alcance
   de los BLOCKED humanos/administrativos si no forman parte del cierre acordado.
5. Solo entonces emitir una recomendación de cierre sustentada en pruebas nuevas.

No se fusionó ni desplegó. No se cambiaron Firebase remoto, reglas, IAM, billing,
usuarios ni datos. La tarea queda con auditoría realizada y candidato revisable,
pendiente de aceptación y publicación para eliminar los FAIL públicos.
