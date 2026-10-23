# ML-05: vigencia y coherencia documental

23/10/2026, Europe/Madrid. Revisión de todas las páginas Markdown de VitePress,
navegación/configuración, componentes del portal, descargas, referencias de código,
commits y evidencia histórica. El inventario por página está en
[alcance completo](/maintenance/page-inventory); el informe mecánico se genera en
`test-results/docs-integrity/results.json`. Una comprobación estructural correcta
no demuestra por sí sola coherencia semántica ni vigencia de un servicio externo.

## Base comprobada y aislamiento

Antes de elegir base se actualizaron referencias remotas y se consultaron ambos PR
por GitHub REST, sin basarse en nombres de rama ni en el preview del chat:

| Trabajo | Rama / head                               | Estado confirmado           | Integración |
| ------- | ----------------------------------------- | --------------------------- | ----------- |
| ML-02   | codex/ml02-docs-design / `163a098`        | PR #15 cerrado, merged=true | `aee7070`   |
| ML-03   | codex/ml03-technical-diagrams / `744cf70` | PR #16 cerrado, merged=true | `a6627d0`   |

Ambas cabezas son antecesoras de `origin/main`, comprobado con Git. Se eligió
`a6627d0a00371d2aaff0605884f05e7a1750f9f9`, en worktree y rama aislados
`codex/ml04-ml05-contracts-audit`. No se modifica ni reescribe ninguna de esas ramas.
La conversación enlazada devolvió referencias sin texto sustantivo; no se inventan
decisiones a partir de ellas. Esta entrega no fusiona, despliega, consulta Firebase
remoto ni toca usuarios, bibliotecas, IAM, billing o servicios de pago.

## Hallazgos y tratamiento

| ID  | Contradicción o riesgo                                                                                | Resolución                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D01 | Firestore describe ML-07 como propuesta pendiente de reglas, mientras el roadmap registra publicación | Referencia actual corregida; se separa código versionado de registro de publicación histórico                                                    |
| D02 | Política Spark mezcla consulta 501 y reglas 1001 con implementación 5001                              | Política y referencia de exportación corregidas a 5001/5000 útiles; no se alteran mediciones históricas                                          |
| D03 | Diseño de cursores conserva 1001/1000 y fórmulas de coste anteriores                                  | Aviso explícito de versión histórica sustituida por ML-07 y contrato actual; cifras preservadas como evidencia de aquella revisión               |
| D04 | Roadmap y especificación dicen ML-08/ML-14 en PR borrador, aunque ya constan merges #7/#13/#14        | Encabezado y estados vigentes actualizados; licencia integrada se distingue de aceptación operativa pendiente                                    |
| D05 | Informe ML-03 dice sin fusión y enlaza evidencias por rama mutable                                    | Aviso posterior de merge #16 y enlace de evidencias fijado al commit de fusión                                                                   |
| D06 | «No desplegado» en informes de ML-07/08 puede leerse como estado actual                               | Avisos históricos y matriz de evidencia; informes no se usan para certificar producción presente                                                 |
| D07 | Roadmap agrupa licencia y protección de main como decisiones futuras                                  | Separadas: licencia versionada y activación histórica del ruleset; IAM, seguridad privada y aceptación real siguen pendientes                    |
| D08 | Rutas limpias, descargas JSON y página legal generada no se verifican solo leyendo Markdown           | Validación sobre HTML construido y guardas existentes del portal; se preservan rutas/anclas históricas                                           |
| D09 | Enlaces blob/main o por rama cambian de significado; SHA corto no indica versión publicada            | Resolución local de refs/rutas y commits documentados; contrato anclado a base con huellas; no se interpreta un enlace como prueba de despliegue |
| D10 | Preview, importación normal y copia dividida pueden confundirse con una sola API                      | Referencias internas separan funciones puras, persistencia y guardas UI; sin API pública inventada                                               |
| D11 | «5 MB» de importación corresponde en código a 5 × 1024² bytes                                         | Referencia usa 5 MiB y hace explícito el texto UI existente; sin cambiar comportamiento de producto                                              |
| D12 | Admisiones, lecturas de documentos y cuota Spark se mezclan                                           | Documentados puntos exactos, reintentos, reglas, reconexiones y lectura de marcador fuera de admisión read                                       |
| D13 | Procedencia y SHA-256 pueden interpretarse como autenticidad o snapshot atómico                       | Límites expresos: reloj cliente, consultas sucesivas, manifiesto sin firma, descarga solicitada sin prueba de archivo guardado                   |

Los documentos de informes mantienen fecha, resultados y límites originales; un
aviso distingue historia de referencia vigente. No se reescriben resultados de
emulador para simular ejecuciones nuevas. Los paquetes de cuentas ML-11/12 siguen
siendo preparación/ensayo, sin canal operativo ni retirada automática del marcador.
Las propuestas Nextcloud/Proton no acreditan activación de custodia ni gasto.

## Implementado, probado y publicado

| Capa                                      | Evidencia disponible                                                                           | Qué no acredita                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Código implementado en base               | Árbol `a6627d0`, servicios, stores, reglas y tests inspeccionados; ML-02/03 fusionados         | Que el mismo árbol esté servido por Hosting                    |
| Pruebas unitarias locales de esta entrega | Registro de comandos y resultados junto al PR                                                  | Facturación real, OAuth real ni aceptación de dispositivos     |
| Emuladores, evidencia histórica           | Informes de cursores, consumo ML-07, multipart y ML-12, con comandos y resultados fechados     | No son una nueva ejecución ML-04/05 ni medición de cuota Spark |
| CI de cada candidato                      | Enlaces y SHA de runs que complete GitHub; conservar estados reales en PR                      | Un workflow definido no significa una ejecución correcta       |
| Publicación ML-07/08                      | Roadmap y registro local de 21/10: `23e9b1d` incluye ML-08; registro sin repetir acceso remoto | Versión actualmente servida, consumo o capacidad garantizada   |
| Publicación ML-14                         | Registro operativo aportado del 22/10: `056ff69`, ambos sitios; no comprobado remotamente aquí | Que ML-02, ML-03 o esta documentación hayan sido publicados    |
| ML-04/05                                  | Documentación y validaciones propuestas en PR borrador                                         | Sin fusión ni despliegue; sin cambios de runtime o Firebase    |

Los registros operativos aportados existen en el espacio local del proyecto;
no se publican credenciales ni sus archivos privados. La evidencia de producción
se describe como **registro histórico**, no certificación renovada. Verificar las URLs de
consola, Hosting y Auth requeriría inspección remota fuera del alcance de esta
tarea; se conservan como referencias sin abrirlas.

## Validación reproducible

Desde un clon completo (los commits históricos se verifican con Git), Node según
`.nvmrc` y dependencias del lockfile:

```sh
npm ci
npm run docs:build
npm run docs:check
npm run lint
npm run lint:check
npm run check:spark
node --test tests/docs-integrity.test.js
node --experimental-vm-modules --test tests/library-cursors.test.js tests/shared-library.test.js tests/manga-store.test.js tests/import-recovery.test.js tests/export-verification.test.js tests/multipart-backup.test.js tests/multipart-panel.test.js tests/transaction-budget.test.js tests/account-service.test.js tests/spark.test.js
node scripts/check-docs-portal.mjs
git diff --check
```

`docs:check` no inicia la app, emuladores ni Firebase, y no realiza solicitudes de
red. Comprueba inventario de páginas, referencias literales de código, commits,
enlaces del repositorio resolubles en Git, huellas de contratos, destinos/anclas y
assets del HTML compilado. Genera inventario de URLs externas y fuentes de cada
una, marcadas sin certificar HTTP/autenticación/estado remoto. El comprobador de
portal añade navegador local, navegación, accesibilidad automática y enlaces DOM,
con red externa bloqueada. CI ejecuta ambos tras construir docs.

La revisión opcional `node scripts/check-docs-public-links.mjs` hace HEAD solamente
a dominios públicos de documentación permitidos, con timeout y redirecciones
controladas. Excluye las aplicaciones Hosting, consolas, APIs de proyectos,
credenciales y ejemplos. Produce `test-results/docs-integrity/public-links.json`;
403/429/timeouts son inconclusos y HEAD no comprueba anclas externas ni contenido.
No se ejecuta en CI ni en hooks de publicación.

Las huellas de `docs/maintenance/contracts.json` obligan a revisar esta referencia
cuando cambia el código inspeccionado: no prueban semántica ni deben regenerarse a
ciegas. Para una modificación legítima, inspeccionar diff, actualizar contratos y
huella SHA-256 del archivo completo, añadir nuevas páginas con disposición en
`docs/maintenance/pages.json`, repetir comprobaciones y registrar evidencia.
El inventario de símbolos exportados es informativo; el comportamiento se explica
en [servicios](/reference/services), [sincronización](/reference/synchronization) e
[importación/exportación](/reference/import-export).

## Pendientes explícitos

La comprobación también detectó una referencia literal eliminada a la prueba de
pestañas ML-06. Se conserva con enlace al archivo en `4547f7d` y se identifica su
sucesora ML-07; el comando histórico no se presenta como ejecutable sobre main.
Los enlaces blob/main se resuelven contra el árbol base auditado, y CI descarga
historia completa para verificar commits anteriores desde un checkout separado.

La revisión HEAD pública final obtuvo 65 respuestas 200 y dos 202 de EUR-Lex.
Una primera consulta de la FAQ de identificación de AEPD devolvió 503; la segunda
respondió 200. No se encontraron respuestas 404 en los destinos consultados.
Las dos páginas EUR-Lex quedan pendientes de comprobación de contenido;
no se eliminan ni se sustituyen por fuentes no oficiales.
Los destinos excluidos y los fragmentos externos no quedan certificados.

La revisión de las cinco páginas nuevas también detectó contraste insuficiente
en la etiqueta de lenguaje de los bloques de comandos (2,72:1 en claro). Se aplica
el color secundario del tema a esa etiqueta y se verifica en claro/oscuro, móvil
y escritorio con el comprobador del portal; sin alterar estilos de la aplicación.

La regresión `tests/docs-integrity.test.js` crea un repositorio ficticio temporal:
prueba aceptación y rechazo de huella cambiada, servicio/página sin revisión,
referencia de código/commit inexistente, ruta/asset roto y ancla ausente. No altera
el checkout, inicia Firebase ni consulta red.

- Renovar comprobaciones externas de URLs cuando se autorice el alcance necesario;
  disponibilidad, redirects, permisos, páginas de consola y versión servida no se
  deducen del build local. Las cuotas oficiales citadas en la referencia se
  contrastaron como documentación pública, sin acceder al proyecto Firebase.
- Revisar con responsables humanos la operación ML-11/12, custodia, retención,
  canal privado y respuesta de incidentes. No se cierran por documentación.
- Certificar capacidad/coste real, OAuth/correo, Safari, dispositivos físicos y
  accesibilidad humana; emuladores y auditorías automáticas no los sustituyen.
- Cualquier fusión o publicación posterior requiere una instrucción separada.
