# ML-14 — decisión de licencia y reutilización

**Actualización posterior:** el titular eligió Apache-2.0 e indicó el nombre
Francisco Navarrete Lopez. La aplicación autorizada está en esta rama mediante
[LICENSE](../../LICENSE), [alcance](../../LICENSE-SCOPE.md) y
[avisos de terceros](../../THIRD-PARTY-NOTICES.md). Main permanece sin cambiar.
El estudio siguiente y los archivos `*.draft.md` se conservan como antecedentes
no vigentes de la comparación inicial; sus menciones a decisión pendiente describen
ese momento. Los derechos sobre material ajeno y assets no se presumen resueltos.

**Revisión ampliada:** [distribuciones y procedencia exacta de assets](distribution-review.md),
[inventario de artefactos](distribution-audit.json) y
[textos legales adicionales](distribution-license-texts.md). Se confirma que los
builds actuales no copian automáticamente los avisos raíz a sus distribuciones.

**BORRADOR NO VIGENTE — 22/10/2026.** Este directorio contiene propuestas para
revisión. No concede una licencia al código de MangaList, no declara titularidad
y no sustituye derechos ni licencias de terceros. Publicar esta rama o fusionar
documentación de análisis no equivale a aprobar una licencia. No copiar los
textos propuestos a la raíz sin aprobación expresa del titular.

## Estado comprobado

- Repositorio público `ShadowStudioEnterprise/manga-list`, rama predeterminada
  `main`, SHA remoto `118c3acade42f446e150440ed2ae7a01887a7bdd`, comprobado con
  Git remoto y API de GitHub el 22/10/2026. API: `license: null`; ningún PR abierto
  al comenzar. El estado es una fotografía de esa revisión.
- No hay LICENSE, COPYING o NOTICE versionados en el árbol de main; tampoco
  historial de archivos LICENSE/NOTICE en las referencias locales revisadas.
  README y CONTRIBUTING declaran expresamente la decisión pendiente. La ausencia
  de reconocimiento por GitHub por sí sola no demostraría ausencia de licencia.
- `package.json`: versión `0.0.1`, autor `shadowstudio`, `private: true`, sin campo
  `license`. `src-pwa/package.json`: versión `1.0.0`, también privado y sin licencia.
  `private` impide publicación accidental en npm; no es una reserva de derechos,
  no privatiza GitHub y no constituye permiso de reutilización.
- `git shortlog -sne origin/main`: 77 commits de `shadowstudio` y 12 de
  `ShadowStudioEnterprise`, con el mismo correo noreply de la cuenta. Esto no
  acredita identidad jurídica, titularidad laboral, cesión ni derechos sobre
  plantillas, aportaciones asistidas o material copiado. No se encontró CLA/DCO
  ni política vigente que documente esas autorizaciones.
- Revisados README, CONTRIBUTING, SECURITY, CHANGELOG, especificación, roadmap,
  documentación de dependencias, ambos manifiestos/lockfiles, configuración Quasar,
  manifest PWA, assets versionados, servicios de importación/exportación y modelo
  de datos. No se consultaron cuentas ni contenido remoto de usuarios.
- La conversación de referencia solo devolvió marcadores de contenido; no permite
  recuperar decisiones previas de licencia. No se infiere aprobación de ellos.

## Comparación para decidir

| Opción                                               | Reutilización y comercio                                                                                                   | Redistribución y modificaciones                                                                                                                                                                                           | Patentes                                                                                                                                                               | Encaje y coste                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| MIT                                                  | Permite uso comercial, venta, modificaciones y derivados cerrados                                                          | Mantener copyright y texto de permiso en copias o partes sustanciales; no exige publicar fuentes                                                                                                                          | No incluye concesión expresa de patentes; no prometer inmunidad ni ausencia absoluta de derechos implícitos                                                            | La más sencilla si se prioriza mínima carga documental                                            |
| Apache-2.0                                           | Permite uso comercial y derivados cerrados                                                                                 | Entregar licencia, preservar avisos pertinentes, indicar archivos modificados y reproducir atribuciones pertinentes de NOTICE si existe; no exige abrir fuentes                                                           | Concesión expresa limitada a reivindicaciones de los contribuyentes necesariamente infringidas por su aportación; terminación en el supuesto de litigio descrito en §3 | Recomendada provisionalmente por claridad de patentes y contribuciones, con más trabajo de avisos |
| GPLv3                                                | Permite uso comercial, cobro y modificación                                                                                | Al transmitir obra cubierta/derivada: GPLv3, avisos de cambios y acceso al código fuente correspondiente; atender requisitos de instalación cuando procedan. No obliga a publicar modificaciones privadas no transmitidas | Concesión expresa de contribuyentes y protecciones adicionales de §11                                                                                                  | Adecuada si el objetivo es reciprocidad al distribuir; más carga y restricciones de combinación   |
| Código visible sin licencia general de reutilización | No hay permiso general adicional para explotar el código propio; excepciones legales y términos de GitHub siguen aplicando | Visualizar/fork en GitHub no concede por sí solo permiso general de redistribución, adaptación o explotación fuera de esos términos                                                                                       | Sin concesión expresa adicional                                                                                                                                        | Mantiene control, dificulta contribuciones y autoalojamiento; no es open source                   |

Las tres licencias abiertas permiten usos comerciales: ninguna implementa una
prohibición de competencia, de venta o de uso comercial. Si eso es un requisito,
hay que elegir conscientemente una política restrictiva separada y no denominarla
MIT/Apache/GPL ni open source. GPLv3 no cubre por sí sola la interacción de red
sin entrega de copia; sí debe analizarse la entrega de JavaScript/PWA al navegador.
AGPL sería otra decisión, fuera de la propuesta actual. Un servidor de terceros
no adquiere por la licencia acceso al Firebase de MangaList.

**Recomendación condicionada:** Apache-2.0 para código propio, pruebas, scripts,
reglas/configuración originales y documentación técnica original expresamente
identificada. Facilita aprendizaje, autoalojamiento y contribuciones con claridad
de patentes sin imponer reciprocidad. No hay evidencia de patentes concretas ni
se ofrece una garantía de no infracción. Si se prefiere absoluta sencillez, MIT
es una alternativa razonable; si prima que derivados distribuidos sigan abiertos,
GPLv3 puede ser preferible. Si no se desea permitir reutilización comercial,
mantener la decisión pendiente hasta definir la política restrictiva.

Una concesión abierta ya otorgada no se retira retroactivamente de las copias
recibidas en cumplimiento de sus términos. Cambiar futuras versiones requiere
derechos suficientes de todos los titulares; no basta con ser administrador del repo.

## Qué abarcaría cada régimen

| Material                                                                                        | Política propuesta, pendiente de aprobación                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Código, tests, scripts y configuración originales                                               | Apache-2.0, tras confirmar titulares y procedencia de plantillas/fragmentos                                                                                                                                  |
| Documentación técnica y ejemplos originales                                                     | Misma Apache-2.0 para evitar una segunda licencia; citas y material ajeno conservan su régimen                                                                                                               |
| Nombre MangaList, nombres comerciales y logotipos                                               | Sin permiso de marca o aval; verificar titularidad y disponibilidad. La atribución de origen y usos legalmente permitidos no se prohíben                                                                     |
| Iconos en `public/`                                                                             | Pendientes de procedencia y autorización; no declarar propios ni relicenciar con el código                                                                                                                   |
| Librerías, fuentes, iconos y textos ajenos                                                      | Sus propias licencias y avisos, independientemente de la opción del proyecto                                                                                                                                 |
| Bibliotecas privadas, notas, URLs, exportaciones, respaldos, identificadores y datos de cuentas | Fuera del alcance de la licencia del código. No se concede acceso, publicación, entrenamiento ni reutilización de datos de terceros. Derechos, consentimiento y protección de datos se valoran separadamente |
| Obras, portadas y contenido de webs enlazadas                                                   | No se adquieren derechos por guardar un título o URL. No se autoriza scraping ni redistribución de obras                                                                                                     |
| Datos sintéticos de pruebas                                                                     | Incluir solo ejemplos originales identificados; nombres de obras y referencias de terceros no se convierten en propiedad del proyecto                                                                        |

No añadir restricciones de uso a Apache-2.0 mediante NOTICE. Las exclusiones
delimitan materiales ajenos al código licenciado y derechos de marca/datos;
no recortan la libertad comercial sobre el código propio efectivamente licenciado.

## Dependencias y avisos

[Inventario reproducible](dependency-inventory.json): 660 entradas en el lockfile
principal y 349 en PWA; no son 1009 productos únicos ni 1009 módulos distribuidos.
Todas declaran metadatos de licencia, lo que no prueba que estén completos/correctos.
Las 32 dependencias directas instaladas coinciden con la versión fijada; se
inventarían sus archivos de licencia/NOTICE. `firebase` y
`@firebase/rules-unit-testing` no traen LICENSE en su raíz instalada: completar
evidencia de avisos del SDK y módulos incorporados antes de distribuir una release.

- Vue 3.5.42, Quasar 2.35.1, Pinia 4.0.3, vue-i18n 11.4.10,
  vue-router 5.3.0, register-service-worker 1.7.2 y Workbox 7.4.1: metadatos MIT.
  Workbox está en devDependencies pero genera código para el worker: no descartarlo
  del cumplimiento por su clasificación npm.
- Firebase 12.18.0 y sus módulos: metadatos Apache-2.0; preservar licencia/avisos
  aplicables. Esto no licencia el servicio Firebase ni cambia sus condiciones.
- `@quasar/extras` 2.0.4 declara MIT en su raíz, pero Roboto y Material Icons
  habilitados en `quasar.config.js` contienen licencias Apache-2.0 propias bajo
  `exports/roboto-font/LICENSE` y `exports/material-icons/LICENSE`, comprobadas.
  No deducir la licencia de esos recursos de la licencia del paquete contenedor.
- VitePress 1.6.4, Vite y herramientas MIT; Playwright/rules-unit-testing Apache.
  `@playwright/test` trae NOTICE que debe revisarse si se redistribuye la herramienta.
- MPL-2.0: axe-core, @axe-core/playwright y Lightning CSS/binaries. Afecta a esos
  componentes, no transforma automáticamente el código independiente en MPL.
  Si se redistribuyen archivos MPL modificados, cumplir sus obligaciones sobre
  fuentes de archivos cubiertos. Lightning CSS aparece sin `dev` por el grafo:
  comprobar su uso efectivo como herramienta, no inferir inclusión en la PWA.
- `caniuse-lite` CC-BY-4.0 (atribución si se distribuyen sus datos), datos de
  `@iconify-json/simple-icons` CC0 (marcas siguen siendo separadas), BlueOak,
  ISC, BSD-2/3, 0BSD, `(MIT OR CC0-1.0)` y
  `@bufbuild/protobuf` `(Apache-2.0 AND BSD-3-Clause)`: respetar ambas partes de
  AND y documentar la elección de OR. No se detecta GPL en los metadatos revisados.

No se demuestra cumplimiento de un bundle desplegado con un lockfile. Antes de
activar/distribuir: trazar SPA, PWA/service worker y portal de documentación;
conservar textos completos/copyright y NOTICE pertinentes en cada distribución,
incluidos recursos que se copian o minifican. Un resumen o enlace no sustituye los
textos exigidos. No se ha auditado el bundle de producción ni se certifica ausencia
de fragmentos de terceros no declarados. No se ejecutó `npm ci` ni lifecycle scripts.

## Riesgo concreto: identidad gráfica

Los 16 assets versionados se enumeran con SHA-256 en el inventario. Proceden de
los commits iniciales `a430ea1` (01/09/2026) y `effcef4` (04/10/2026). La inspección
visual de `public/icons/icon-512x512.png` muestra un icono coincidente con Quasar;
no es una verificación byte a byte del original ni demuestra permiso.

El repositorio oficial `quasarframework/quasar-art` tiene una **Quasar License**
separada del MIT del framework. Describe derechos de marca y requisitos de permiso
expreso para usar/modificar versiones de su logo. También menciona una versión
original bajo CC-BY-4.0; esa mención no permite atribuir sin más todos los archivos
actuales a aquella versión. Verificar archivo de origen, versión, condiciones y
autorización, o sustituir por identidad original con procedencia documentada.
Esto requiere una tarea posterior aprobada; ML-14 no modifica iconos ni producción.
Una atribución no subsana por sí sola la falta de autorización.

## Borradores y activación futura

- [LICENSE propuesto](LICENSE.draft.md): texto Apache canónico, como muestra no vigente.
- [NOTICE propuesto](NOTICE.draft.md): estructura de atribuciones, sin restricciones adicionales.
- [README y contribuciones propuestos](policy.draft.md): textos condicionales para después de aprobar.
- [Decisiones y validación](decisions.md): condiciones de cierre y controles de este PR.

No se cambia README raíz, CONTRIBUTING raíz, `package.json`, cabeceras SPDX,
licencias efectivas ni publicación de docs. No se crea LICENSE/NOTICE raíz.
La aprobación debe identificar opción, alcance, titular y candidato concreto.
Una aprobación del análisis o de su PR no equivale a aprobar la activación.
Firebase Spark permanece como requisito; no se accede a producción, IAM, datos,
facturación, consola, reglas remotas ni despliegues.

## Fuentes consultadas el 22/10/2026

- [MIT, texto OSI](https://opensource.org/license/mit).
- [Apache-2.0, §§2–6 y 9](https://www.apache.org/licenses/LICENSE-2.0).
- [GPLv3, texto canónico FSF](https://www.gnu.org/licenses/gpl-3.0.html);
  [copia íntegra consultada](https://choosealicense.com/licenses/gpl-3.0/).
- [GitHub: licencia de repositorios](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
  y [ausencia de permiso general](https://choosealicense.com/no-permission/).
- [Quasar Art y procedencia](https://github.com/quasarframework/quasar-art),
  [condiciones gráficas](https://github.com/quasarframework/quasar-art/blob/master/LICENSE),
  contenido comprobado mediante API GitHub.

Evaluación técnica para decidir; identidad jurídica, cadena de titularidad,
compatibilidad de combinaciones concretas y condiciones locales de datos requieren
confirmación por el titular y revisión jurídica cuando proceda.
