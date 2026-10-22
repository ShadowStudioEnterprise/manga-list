# ML-02 — rediseño del portal VitePress

Propuesta implementada el 22/10/2026, Europe/Madrid. Base remota verificada:
`056ff6934e3eeff059c6a7b70660f3773fbb4ea8` (`origin/main`). Rama:
`codex/ml02-docs-design`. Sin fusión ni despliegue.

## Resultado

La portada estándar se sustituye por un hero editorial, una biblioteca ilustrada
con títulos ficticios y accesos a las seis secciones y los informes. Usa el índigo
del producto, fondos cálidos, superficies oscuras y tipografía local de VitePress.
La cabecera agrupa Referencia y Proyecto, la sidebar prioriza la introducción y
la instalación y los controles configurables se muestran en español.

Se extiende el tema predeterminado: búsqueda local, landmarks, salto al contenido,
sidebar de informes y navegación de documentos conservan su implementación de
VitePress. La portada desactiva solo los estilos Markdown mediante
`markdownStyles: false`; las páginas de documentación mantienen sus estilos.
Se conserva el ancla histórica `/#sobre-mangalist`, además de todas las rutas HTML.
Los focos son visibles y los botones de la portada tienen 48 px de alto.

El rastreo encontró un 404 anterior a ML-02 en la descarga de la auditoría ML-11:
los JSON de los informes no se copiaban al directorio compilado. `buildEnd` incluye
ahora explícitamente los dos JSON públicos de auditoría ML-11/ML-12, conservando
sus rutas, además de las mediciones ya copiadas. No se modifican sus contenidos.

## Evidencia antes y después

El antes se compiló localmente desde el HEAD indicado, sin cambiar sus fuentes.
Las capturas comparables usan Chromium, con fuentes locales y tamaños de
1440 × 1000 y 390 × 1000. La lectura HTTP de la portada pública desplegada devolvió
200 y el título `Sobre MangaList | MangaList Docs`, con el hero anterior
`Documentación técnica`; esto no identifica por sí solo su commit desplegado.

| Vista              | Antes                                  | Después                                    |
| ------------------ | -------------------------------------- | ------------------------------------------ |
| Escritorio, claro  | [Captura](evidence/before-desktop.png) | [Captura](evidence/after-desktop.png)      |
| Móvil, claro       | [Captura](evidence/before-mobile.png)  | [Captura](evidence/after-mobile.png)       |
| Escritorio, oscuro | —                                      | [Captura](evidence/after-desktop-dark.png) |
| Móvil, oscuro      | —                                      | [Captura](evidence/after-mobile-dark.png)  |

[Búsqueda local](evidence/search.png) · [Guía y sidebar](evidence/guide.png) ·
[Resultado estructurado](evidence/results.json).

## Validación local

| Comprobación                                                | Resultado                                                                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run docs:build`                                        | Correcto; comprobador de enlaces de VitePress activo                                                                   |
| `npm run lint:check`                                        | Correcto                                                                                                               |
| ESLint adicional del tema Vue/JS                            | Correcto                                                                                                               |
| `npm run check:spark`                                       | Correcto; política e inventario locales                                                                                |
| `node --experimental-vm-modules --test tests/spark.test.js` | 12/12                                                                                                                  |
| `node scripts/check-docs-portal.mjs`                        | Correcto, Chromium y recorrido móvil Firefox                                                                           |
| Enlaces y anclas compilados                                 | 544 destinos internos únicos, 68 páginas HTML                                                                          |
| Rutas respecto a la base                                    | Las 68 rutas HTML se conservan                                                                                         |
| Accesibilidad automatizada                                  | 0 infracciones WCAG A/AA detectadas en 10 análisis                                                                     |
| Responsive                                                  | Sin desbordamiento a 320, 390, 768 y 1440 px, claro y oscuro                                                           |
| Comportamiento                                              | Búsqueda y selección por teclado, salto al contenido, foco visible, cambio/persistencia del tema, menú móvil y sidebar |
| Ejecución del portal                                        | Sin errores de consola/JavaScript ni peticiones externas en el recorrido Chromium                                      |

La compilación mantiene el aviso de chunks superiores a 500 kB ya observado en la
base. La copia aislada, sin preparación de Quasar, también avisa de la ausencia de
`.quasar/tsconfig.json`; el portal compila correctamente. No se han alterado
dependencias ni lockfiles para ocultar estos avisos.

Para reproducir: instalar las dependencias del lockfile y los navegadores Chromium
y Firefox de Playwright, compilar el portal y ejecutar el script anterior. Por
defecto escribe en `test-results/docs-portal/`. `DOCS_EVIDENCE_DIR` cambia la carpeta
de salida. Opcionalmente, `DOCS_BASELINE_DIR` señala la salida compilada del HEAD
anterior para comparar rutas y generar sus capturas. El servidor de prueba sirve
solo archivos locales en `127.0.0.1`, usa un puerto temporal y se cierra al acabar.

Los análisis automáticos no sustituyen revisión humana ni pruebas con lector de
pantalla o dispositivos físicos. Firefox verifica entrada móvil a la guía y
ausencia de desbordamiento; la matriz completa y axe se ejecutan en Chromium.
No se certifican Safari ni el estado remoto de Spark o la disponibilidad de todos
los destinos externos. La evidencia describe esta rama, no producción.

## Procedencia y alcance

Diseño, HTML/CSS y títulos ficticios creados con asistencia de Codex. El logo es
una copia exacta del SVG original del repositorio; no se añaden cubiertas,
fuentes remotas ni assets de terceros. Véase [procedencia](../../ASSET-PROVENANCE.md).
La licencia Apache-2.0 y los avisos de dependencias existentes se conservan.

No se modifican Firebase, reglas, facturación, políticas Spark, datos reales,
aplicación, workflows ni contratos de release. No se ejecutan comandos de
despliegue, operaciones remotas de datos ni consultas autenticadas a Firebase.
El PR se entrega en borrador para revisión y no autoriza publicación.
