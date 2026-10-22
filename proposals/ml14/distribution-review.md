# ML-14 — revisión de distribuciones y procedencia de assets

Revisión ampliada del 22/10/2026, fuente
`a6a7dae15b386a5ebc5164b7e885dade446f41d8`. Complementa el estudio inicial.
No autoriza fusión, despliegue o uso de gráficos de terceros.

## Qué se ha comprobado

Se exportó esa revisión a una copia aislada sin `.env`, utilizando las
dependencias ya instaladas y fijadas por los lockfiles. Se compilaron SPA, PWA y
portal con configuración Firebase `demo-mangalist`, sin abrir sesiones, contactar
con Firebase ni acceder a datos de usuarios.

Solo en esa copia se añadió un plugin que registra los módulos de los chunks y
sus archivos de salida. No se modificó la configuración de la rama del PR. Los
resultados son compilaciones de auditoría, sin validez como candidatos de release:
la instrumentación añade un asset de inventario y altera la lista de precaché.
La herramienta conserva también entradas de CSS y módulos con tamaño renderizado
cero de forma conservadora. No representa prueba exhaustiva de procedencia de
cada byte ni auditoría del sitio desplegado.

| Artefacto local                | Paquetes observados por el compilador | Archivos inventariados, excluyendo el inventario añadido |
| ------------------------------ | ------------------------------------- | -------------------------------------------------------- |
| SPA                            | 23                                    | 65                                                       |
| PWA, código de aplicación      | 24                                    | 68 en la distribución PWA completa                       |
| Portal, compilación de cliente | 14                                    | 241                                                      |

El worker generado se trata aparte: aparecen módulos Workbox core, routing,
precaching y strategies. Los paquetes instalados y lockfiles indican 7.4.1, pero
sus propios `_version.js` contienen marcadores 7.4.0, reproducidos en el worker.
Se registran ambas evidencias; no se deduce una versión de paquete del banner.
El archivo `src-pwa/sw/custom-sw.js` no es el worker utilizado: la configuración
activa es `GenerateSW`, no `InjectManifest`.

El conjunto de evidencia legal abarca 40 identidades de paquete, incluidas las
observadas y avisos conservadores de runtime generado de Vite/Rolldown. Se
recopilan **44 textos legales distintos** de paquetes, módulos y recursos. Los
[textos completos](distribution-license-texts.md) complementan los avisos raíz.
El [inventario con hashes](distribution-audit.json) identifica resultados y límites.
No se incluye un recuento de paquetes como sustituto de sus obligaciones.

## Hallazgos de licencias y distribución

- La aplicación incorpora módulos transitivos de Firebase, Intlify, Vue, `idb`
  y `re2js`; no basta con conservar solo los nombres de dependencias directas.
- El portal incorpora VueUse, DocSearch CSS, focus-trap, mark.js, MiniSearch y
  tabbable, además de Vue/VitePress. El LICENSE ausente en la raíz instalada de
  `@docsearch/css` se completó con el texto del repositorio oficial en `v3.8.2`,
  blob `78f811663b829b603f9abd9473a07a38b00d016f`.
- Varios paquetes Firebase no tienen LICENSE raíz; sus módulos contienen avisos
  copyright/licencia, conservados en la recopilación. El texto Apache completo
  está en LICENSE. Avisos incrustados pueden ser relevantes aunque el metadato
  npm indique una única licencia.
- Roboto y Material Icons tienen textos separados del MIT de `@quasar/extras`.
- **Los builds actuales no copian automáticamente LICENSE, NOTICE ni la
  recopilación de terceros de la raíz a `dist` o al portal.** Tener estos archivos
  en Git no garantiza que se entreguen al usuario del artefacto web. Antes de una
  futura distribución hay que preparar y verificar un paquete de avisos accesible
  y conservado con cada salida, sin que la minificación lo elimine.

Esta revisión no cambia hooks, workflows ni despliegues para resolver ese último
punto. No certifica cumplimiento jurídico de una distribución futura ni ausencia
de licencias en rutas no estándar o contenido externo. La colección debe revisarse
cuando cambien dependencias o modalidad de compilación.

## Procedencia exacta de gráficos

Se compararon SHA-256 de los 16 assets versionados en `public/` con todos los
archivos de plantillas del paquete instalado `@quasar/app-vite` 3.8.1.

- **12 coincidencias exactas:** cuatro Apple icons, favicon-128, cinco iconos PWA
  de 128/192/256/384/512 píxeles, ms-icon-144 y safari-pinned-tab.svg.
- **4 sin coincidencia en esas plantillas:** favicon.ico y favicon-16/32/96.
  No se atribuyen automáticamente a otro autor o licencia por similitud visual.

Esto prueba coincidencia con el material de plantilla instalado, sin demostrar
por sí solo cuál fue el archivo histórico copiado. El paquete contenedor declara
MIT; el repositorio oficial de identidad gráfica de Quasar tiene condiciones
separadas. No se resuelve esa distinción asumiendo que una declaración MIT general
autoriza el uso de todos los logotipos como identidad de un producto distinto.

La opción conservadora sigue siendo obtener permiso específico documentado o
sustituir todos los assets de identidad por material original con procedencia
acreditable. Esa sustitución cambiaría la identidad visual de la app y requeriría
una implementación y validación propias. No se ha realizado en ML-14.

## Estado de cierre

La licencia elegida para aportaciones originales sigue siendo Apache-2.0, con
alcance separado de assets, marcas y datos de usuarios. No se amplía la concesión
del titular a material ajeno. La rama continúa siendo material de PR borrador.

Antes de una distribución futura quedan dos acciones concretas: resolver los
derechos de los 16 assets de identidad y entregar/verificar los avisos legales con
los artefactos distribuidos. La auditoría queda documentada; esos permisos y esa
implementación de distribución no se presumen realizados.

Fuentes de terceros: [DocSearch v3.8.2](https://github.com/algolia/docsearch/blob/v3.8.2/LICENSE),
[Quasar Art](https://github.com/quasarframework/quasar-art/blob/master/LICENSE),
y textos de las versiones instaladas identificados en los anexos.
