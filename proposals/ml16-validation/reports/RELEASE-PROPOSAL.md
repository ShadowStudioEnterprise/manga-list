# MangaList — candidata de release para revisión

**Preparada localmente, sin desplegar. No aprobada todavía para publicación.**

Esta propuesta permite revisar una segunda versión concreta antes del último ensayo ML-16, sin crear una publicación vacía ni incorporar cambios pendientes de ML-09. Fecha: 24/10/2026, Europe/Madrid.

## Candidata y destino propuesto

| Campo                            | Valor                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| Revisión candidata               | `0c871abbc25fffa3930390ffc8b64204ae473f82`                                         |
| Base                             | `main`, `7f5ff099510e13b8c186bbd67b2f767cdeaed014`                                 |
| Rama local                       | `review/ml16-release-7f5ff099`                                                     |
| Publicación observada            | `9006459c54893de65f967439006c70c2446d05d5`                                         |
| Artefacto propuesto              | `artifacts/pwa-production/`, PWA estática, `dirty:false`                           |
| Sello de compilación             | 24/10/2026 17:36:16 Europe/Madrid, reloj local de compilación                      |
| Proyecto / sitio                 | `mangalist-61bb8` / `mangalist-61bb8`, target `hosting:app`                        |
| Fuera del alcance de publicación | Portal `docs`, reglas, datos, Auth, IAM y facturación                              |
| Estado remoto                    | PR #22 en borrador y rama de revisión; sin release, etiqueta, fusión ni despliegue |

El build usa **solo los seis valores de configuración web públicos existentes**, obtenidos de Hosting y contrastados con el asset Firebase publicado. No contiene cuentas de servicio, tokens ni credenciales demo. La configuración pública no sustituye a las reglas ni acredita permisos de publicación.

## Cambios para revisar

El candidato remoto `0c871ab` tiene el mismo árbol Git `b51fc8471a70fda3ba34dc8c5e34f933f5c8e442` que el preparado localmente como `ace8311`. Se usó la conexión GitHub porque Git local carecía de credenciales de push. Los builds se regeneraron con el SHA remoto. El smoke Safari previo corresponde al mismo contenido con sello local; no se convierte retrospectivamente en prueba del SHA remoto.

El diff de la candidata respecto a `main` consta de **tres archivos, 17 líneas añadidas y 9 eliminadas**:

- `package-lock.json`: serialize-javascript **7.1.2 → 7.1.4**.
- `src-pwa/package-lock.json`: la misma actualización y fast-uri **3.1.8 → 3.1.9**.
- `CHANGELOG.md`: entrada «Sin publicar» que describe estas actualizaciones y su estado de revisión.

Son dependencias transitivas de compilación. Las auditorías iniciales registraron un aviso bajo en el árbol principal y dos paquetes con avisos en PWA; después de actualizar, ambas auditorías informan **cero vulnerabilidades conocidas** con el umbral original. Se conservaron los metadatos de plataformas del lockfile; no se aceptó el ruido de reescritura generado por npm.

No se modifican `src/`, reglas, contratos, configuración Hosting ni manifiestos de dependencias respecto a la base elegida. **Esto no significa que todo `main` coincida con producción:** la revisión pública `9006459` no se pudo recuperar desde GitHub ni de los clones locales consultados. No se presenta un diff semántico completo contra esa revisión como si estuviese verificado.

La comparación contra el inventario público sí acredita igualdad de bytes en `firestore.rules`, `firebase.json`, `spark-policy.json` y `release-contract.json`; los dos lockfiles son diferentes. Esta evidencia procede del build publicado, no de una inspección de reglas efectivas o estado de facturación. Se mantienen Spark, barrera de borrado v1, consulta acotada a 5001, importación recuperable v1 y exportación comprobada v2.

La base elegida ya incorpora la landing ML-P06 y tiene [CI aprobado de su commit exacto](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40039960823/job/120708454911). El PR #19 ML-09 sigue pendiente y **no forma parte de esta candidata**. No se heredan sus pruebas ni su aprobación.

## Validación realizada

| Comprobación                                      | Resultado                                                                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalaciones desde ambos lockfiles               | PASS, `npm ci`, sin modificar los lockfiles                                                                                                                                         |
| Auditoría de dependencias, ambos árboles          | PASS, cero avisos conocidos                                                                                                                                                         |
| Formato y ESLint                                  | PASS                                                                                                                                                                                |
| Pruebas unitarias                                 | PASS, **119/119**                                                                                                                                                                   |
| Spark local y auditoría de fuentes                | PASS, inventario permitido y cero hallazgos del escáner                                                                                                                             |
| Build SPA demo + inventario                       | PASS, `demo-mangalist`                                                                                                                                                              |
| Build PWA demo + inventario                       | PASS, misma revisión candidata y árbol limpio                                                                                                                                       |
| Portal y comprobación documental                  | PASS, **77 páginas**, 25 huellas y 59 commits documentados                                                                                                                          |
| Pruebas PWA                                       | PASS, **3/3**: textos legales completos, avisos offline y actualización pasiva con dos pestañas                                                                                     |
| Safari nativo sobre build demo                    | PASS limitado: login, recuperación y recarga bajo controlador SW activo; revisión candidata identificada                                                                            |
| Build PWA con configuración pública de producción | PASS, `mangalist-61bb8`, `dirty:false`                                                                                                                                              |
| `npm run check:release`                           | PASS, inventario y contratos consistentes                                                                                                                                           |
| Auditoría de artefactos                           | PASS, 297 archivos compilados, cero hallazgos del escáner                                                                                                                           |
| Estado Spark remoto actual                        | **PASS por lecturas autenticadas:** billing desactivado/sin cuenta y Firestore Native Standard eur3, 24/10/2026 17:45:40; el hook CLI gcloud sigue sin poder ejecutarse en este Mac |
| CI del nuevo commit / E2E y reglas completos      | **PASS en rama y PR #22:** cada ejecución aprueba 119 unitarias, 26 Firestore, 2 borrado interrumpido, 45 E2E y 3 PWA                                                               |
| Cambio entre releases en Hosting                  | **Pendiente de publicación separadamente autorizada**                                                                                                                               |

Los cambios locales fueron probados y después fijados en el commit; los builds, inventarios, pruebas PWA y smoke de Safari identifican el commit candidato. No se añadieron pruebas que reproduzcan la edición de lockfiles.

Los fallos preparatorios quedan conservados: la primera suite PWA carecía del portal compilado; la primera verificación documental carecía del historial Git completo. Se construyó el portal, se recuperó el historial y pasaron las comprobaciones sin rebajar aserciones. El build demo produce `API_KEY_INVALID` al inicializar la configuración ficticia de Auth en Safari; no se inició sesión en ese build ni se declara consola limpia. El smoke no sustituye la matriz autenticada ni el ensayo de actualización pública.

## Bloqueos antes de aprobar una publicación

1. Revisar y aceptar el candidato exacto y sus diferencias respecto a la versión pública. La fuente de `9006459` no está disponible en los repositorios inspeccionados; la coincidencia de cuatro hashes críticos no sustituye esa revisión completa.
2. Ejecutar u obtener CI del **commit candidato**, conservando las pruebas completas que se exijan para publicar. Completado: CI de rama sobre 0c871ab y de integración sobre f1a2a70, con logs y artefactos preservados.
3. Mantener comprobaciones frescas de **Spark sin cuenta de facturación**, **Firestore Standard**, release/version de Hosting activa y reglas efectivas al publicar. Billing y edición ya se verificaron por GET el 24/10/2026 a las 17:45:40. El hook protegido sigue requiriendo gcloud en el entorno de publicación; no se modificó para eludir esa condición. La sesión Firebase CLI fue autorizada y completada personalmente por el titular.
4. Acordar responsable de publicación, aprobador, asistencia a borrados pendientes y retención de evidencias. No se han inventado esos responsables ni un SLA.
5. Obtener autorización **separada** sobre revisión exacta, sitio y alcance. Este documento y los artefactos no la conceden.

No se solicita aquí aprobación para desplegar: el encargo actual es preparar la release para revisión.

## Ensayo ML-16 después de una publicación aprobada

Conservar primero la versión anterior en Safari/app instalada y un formulario con texto sintético sin enviar. Tras la publicación, comparar revisión pública nueva con la cacheada, solicitar comprobación de worker y verificar aviso, estado waiting y texto conservado. Cerrar un cliente y comprobar que la versión anterior continúa activa mientras queda otro; cerrar todos y reabrir para comprobar la candidata activa. Guardar revisión, fecha, consola/red y resultados. No usar skipWaiting, borrar cachés ni provocar agotamiento de cuota para forzar el resultado.

El artefacto antiguo no se considera rollback aprobado: las reglas y contratos activos se evalúan aparte. Ante una incidencia, conservar evidencias y preparar una corrección compatible; no rebajar reglas, eliminar marcadores ni restaurar cuentas/datos borrados.

## Entrega revisable

- `candidate.patch`: cambios exactos sobre la base.
- `candidate.bundle`: historia Git necesaria para clonar la rama y revisar el commit.
- `artifacts/pwa-production/`: build propuesto con `build-info.json` y `build-evidence.json`.
- `artifacts/pwa-demo/`: build usado para los ensayos locales.
- `evidence/`: logs, inventarios, CI de la base, configuración web pública y cotejos.
- `SHA256SUMS`: huellas de la entrega; detectan cambios de bytes, no constituyen firma ni aprobación.

Las notas y el pequeño cambio de changelog se han redactado con asistencia automatizada. No se incorporan assets nuevos ni textos de terceros ajenos a las dependencias ya declaradas; se preservan los avisos legales del proyecto. La entrega no incluye `node_modules`, credenciales privadas ni bibliotecas personales.

## Revisión en GitHub

[PR #22 en borrador](https://github.com/ShadowStudioEnterprise/manga-list/pull/22). CI de rama: [40107588410](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40107588410). CI de integración del PR: [40107590809](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40107590809). Ambas aprobadas. El build de rama identifica 0c871abbc25fffa3930390ffc8b64204ae473f82; el del PR identifica el commit temporal f1a2a70b493151161c12376e8b75bd32ee01c392, sin fusionar main. Se descargaron los cuatro artefactos originales y sus SHA-256 coinciden con los digests de GitHub; los ZIP y logs completos quedan en evidence/.

El usuario completó personalmente el acceso administrativo de Firebase CLI 15.34.1 y confirmó Firebase conectado. Terminal está bloqueado para el control nativo; el código se introdujo personalmente siguiendo FIREBASE-LOGIN.md, sin recogerlo en el chat ni en evidencias.

## Verificación Spark remota de solo lectura

El 24/10/2026 a las **17:45:40 Europe/Madrid**, dos peticiones GET autenticadas confirmaron `billingEnabled:false`, sin cuenta vinculada, y base `(default)` de tipo FIRESTORE_NATIVE, edición STANDARD y región eur3. Se aplicó sin modificar `validateRemote` de `source/scripts/check-spark.mjs`. Evidencia: `evidence/spark-remote-readonly.json`; código del inspector: `inspect-spark-readonly.mjs`. Solo se leyeron esos metadatos, sin documentos de bibliotecas, cambios de APIs, IAM, cuentas o facturación. No hay servidor MCP Firebase conectado; se utilizó el cliente autenticado de Firebase CLI y los endpoints oficiales de [Billing GET](https://cloud.google.com/billing/docs/reference/rest/v1/projects/getBillingInfo) y [Firestore database GET](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases/get).

No se invocó el helper que habilita APIs. El hook protegido `check:spark:remote` sigue requiriendo gcloud, ausente en este Mac: no se modificó ni suplantó. Esta evidencia no es un pase de ese comando ni una autorización de despliegue; su entorno de ejecución y las lecturas frescas deberán estar disponibles al publicar.

La primera copia de los builds regenerados contenía assets sobrantes de ace8311. La verificación de inventario la rechazó. Se limpiaron únicamente las carpetas generadas, se corrigió el empaquetador para no fusionar salidas previas y ambos inventarios archivados pasaron. `evidence/artifact-copy-repair.json` conserva el incidente.

## Resultado final de CI

PASS de rama y de integración del PR. Cada una: **119 unitarias, 26 Firestore, 2 borrado interrumpido, 45 E2E y 3 PWA**, además de auditorías, documentación, diagramas, landing, compilaciones e inventarios. Los 45 E2E tardaron aproximadamente 12,7 y 12,6 minutos respectivamente. La revisión nueva no se acredita con el CI anterior de main. `evidence/ci-summary.json` identifica los dos sellos reales; los cuatro ZIP de CI se conservaron con sus digests verificados. Producción continúa en 9006459 según la lectura final; no hay fusión ni despliegue.

## Revisión adicional de preparación operativa

Revisión estática del 24/10/2026, sin nuevas pruebas de navegador ni operaciones remotas. El patch contiene únicamente los tres archivos descritos.

- **PASS:** el target app mantiene la secuencia protegida de comprobación Spark remota, reconstrucción PWA y verificación de release. No se retiró ningún control.
- **Condición de publicación:** el hook reconstruye dist/pwa; el ZIP revisado no será necesariamente el artefacto servido byte por byte. Registrar el sello e inventario del build realmente generado, comprobar revisión/proyecto/árbol limpio y conservar sus hashes junto con la versión y release reales de Hosting. Los hashes del paquete actual acreditan este paquete, no una publicación futura.
- **Incidencia documental reproducible DOC-01:** source/docs/reports/operations/releases-and-recovery.md, apartado Contratos y compatibilidad, dice consultas acotadas a 1001 e identidad de importación v1. El contrato y el comprobador actuales exigen boundedLibraryQuery:5001 y recoverableImport:1. La candidata no cambia esa guía heredada; debe corregirse y revisarse antes de utilizarla como referencia operativa. Esta discrepancia no es un fallo demostrado del runtime.
- **Pendientes:** revisión completa frente a la fuente pública no recuperada; identificación de release activa y reglas efectivas; entorno con gcloud para ejecutar el hook original; responsables y aprobación expresa del alcance. La preparación está completa como propuesta, no como autorización de publicación.

## Estado posterior: publicación autorizada

El 24/10/2026 el usuario autorizó y se publicó 0c871ab exclusivamente en hosting:app, a las 23:04:26 Europe/Madrid. El hook original gcloud pasó y las reglas efectivas permanecieron sin cambios. El estado histórico de preparación anterior queda superado por PUBLICACION-Y-VALIDACION.md. Hay PASS de detección waiting, texto conservado y apertura posterior de versión nueva; FAIL observado de aviso visual y BLOCKED del ensayo estricto con dos clientes controlados (la primera pestaña tenía controller:null). No hay PASS global de ML-16 ni fusión de PR.

## Actualización vigente — 25/10/2026

Publicada con autorización la revisión **0bb93e755d76fc5cd92f54978e732c5924ba27e7**, únicamente en hosting:app, a las 00:19 Europe/Madrid. **PASS del caso pendiente entre releases públicas en Safari real**: ambas pestañas controladas antes de publicar, worker anterior retenido y nuevo waiting, aviso visible y texto conservado; cerrar una mantiene waiting, cerrar la última y reabrir carga la nueva revisión. Spark y reglas comprobados, sin cambios de reglas ni merge. El estado histórico BLOCKED de ese caso queda superado. No equivale a una revalidación integral de todas las funciones en 0bb93e7; CI remoto y flujos autenticados/offline de esta revisión no se repitieron. Informe vigente: ../ML16-release-review/CIERRE-ACTUALIZACION-PUBLICA.md.
