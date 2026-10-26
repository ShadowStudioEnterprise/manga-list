# ML-16 — corrección del aviso y ensayo de múltiples clientes

**Corrección local, sin publicar.** 24/10/2026, Europe/Madrid. Producción continúa en `0c871abbc25fffa3930390ffc8b64204ae473f82`. Nueva candidata: **0bb93e755d76fc5cd92f54978e732c5924ba27e7**, rama local `fix/ml16-uncontrolled-update-notice`, basada en la versión publicada. Árbol limpio. Incluye el primer ajuste dd84706 y la corrección de instalación inicial 0bb93e7.

## Causa reproducida y cambio

La dependencia instalada register-service-worker emite `updated` al terminar de instalar un worker si la página tiene controller; si la página no está controlada, emite `cached`. La aplicación escuchaba registered y updated. Una pestaña inicial sin controller puede tener otro cliente controlado que mantiene un worker nuevo esperando: en ese caso faltaba el aviso.

Se añadió el mismo observador a cached. El observador exige ahora **active y waiting**: la primera instalación puede exponer waiting de forma transitoria y no debe anunciarse como actualización. Se mantienen skipWaiting:false y clientsClaim:false; no se añaden recargas forzadas, polling ni escrituras de fondo.

Regresión previa en Chromium sobre el build 0c871ab: controlado PASS; sin controlador FAIL por ausencia del aviso (timeout 10 s). `followup-evidence/regression-before.log`. No se atribuye una reproducción Chromium a Safari. El ensayo nativo posterior confirma la corrección local en los dos tipos de cliente.

Se corrigió además DOC-01 en la guía de recuperación: límite 5001 e importación recuperable v1. No se modifican reglas, contratos, dependencias, Hosting ni SDK de autenticación.

## Resultados del candidato local

| Prueba                                                                              | Estado                 | Evidencia                                                                                                                                                         |
| ----------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build demo limpio e inventario                                                      | PASS                   | build-demo.log, verify-demo.log y FOLLOWUP.json; proyecto demo-mangalist                                                                                          |
| Unitarias                                                                           | PASS, 119/119          | unit.log; incluye cached con/sin active y waiting                                                                                                                 |
| PWA automatizadas Chromium                                                          | PASS, 4/4              | pwa-after.log: licencias, offline legal, actualización con primer cliente controlado y sin controlar, sin aviso falso inicial                                     |
| Formato y ESLint                                                                    | PASS                   | lint.log                                                                                                                                                          |
| Spark local                                                                         | PASS                   | spark-local.log; no certifica estado remoto nuevo                                                                                                                 |
| Documentación compilada e integridad                                                | PASS                   | docs-build.log y docs-check.log: 77 páginas, 25 huellas, 59 commits                                                                                               |
| Build con configuración pública de producción / check:release / auditoría compilada | PASS                   | production-build.log, production-check.log y production-security.log: 297 archivos compilados, cero hallazgos; revisión 0bb93e7 limpia. No equivale a publicación |
| CI remoto de esta candidata                                                         | BLOCKED / no ejecutado | Los resultados remotos de 0c871ab no se heredan a 0bb93e7                                                                                                         |

## Safari REAL nativo

Safari **18.6 (20621.3.11.11.3)** sobre macOS **15.7.9 (24G830)**. Builds demo de 0bb93e7, no Playwright WebKit. Se sirvieron solo en loopback. Los marcadores 1/2 son instrumentación del worker para identificar activo y waiting; no son dos releases públicas. La lógica de activación de la app no se modificó.

| Ensayo                                          | Estado | Observación guardada                                                                                                                                                                                                               |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalación inicial sin controller              | PASS   | 23:26:49, active 1, waiting null, aviso false. native-first-install.txt                                                                                                                                                            |
| Primera pestaña controlada                      | PASS   | 23:27:03, controller true, activo 1. native-first-controlled.txt                                                                                                                                                                   |
| Segunda pestaña controlada antes del cambio     | PASS   | 23:27:31, controller true, activo 1. native-second-controlled.txt                                                                                                                                                                  |
| Dos clientes controlados tras cambio local      | PASS   | 23:28:02, activo 1, waiting 2, aviso true y texto sintético presente. native-two-waiting.txt/png                                                                                                                                   |
| Cerrar solo una pestaña                         | PASS   | 23:28:14, controller true, activo 1, waiting 2 y texto presente. native-one-waiting.txt/png                                                                                                                                        |
| Salir del último cliente y reabrir              | PASS   | 23:28:35, controller true, activo 2, waiting null y aviso false. native-no-clients.txt y native-reopened.txt/png                                                                                                                   |
| Caso sin controller con otro cliente controlado | PASS   | 23:29:08 primer controller false, aviso false; segundo controller true 23:29:43; 23:30:04 primer controller false, activo 1, waiting 2, texto sintético y aviso true. native-uncontrolled-*.txt/png y native-holder-controlled.txt |

Las consolas del laboratorio muestran un bloqueo CSP esperado de apis.google.com: el servidor auxiliar impide conexiones externas y carga de scripts externos. No se declara consola limpia ni OAuth válido en este laboratorio. Una navegación empezó antes de terminar el build y recibió sw.js 404; se repitió la carga después de terminarlo antes de iniciar las medidas. Ninguna prueba autenticada ni biblioteca personal se utilizó.

La primera tentativa cached sin exigir active produjo un falso aviso en instalación inicial; se corrigió y se volvió a compilar antes de los PASS anteriores. La primera ejecución unitaria heredó variables demo que interferían con un fixture dotenv; al aislar el entorno, pasan las 119 pruebas sin cambiar esas aserciones. Logs previos conservados en first-fix-trial. Durante el control nativo algunos clics AX no enfocaron la consola; las entradas accidentales en el campo sintético se retiraron, sin enviar formularios. Los estados posteriores se registraron desde la consola enfocada por coordenadas. La conservación del texto tras actualización también está observada en el árbol AX anterior a esas entradas.

Se cerraron los clientes locales de ensayo, se detuvieron únicamente los tres servidores auxiliares creados en este seguimiento y Safari quedó en el login público. Los servicios previos y emuladores no se tocaron.

## Estado y siguiente aceptación

SAFARI-UPDATE-01 queda **corregido y verificado localmente**, pendiente de aceptación en una futura publicación autorizada. SETUP-01 queda resuelto en el ensayo local con controller verificado para ambos clientes. La transición estricta entre dos releases públicas con dos clientes controlados sigue **BLOCKED**: el nuevo ensayo local no se presenta como prueba pública.

No se ha publicado esta nueva revisión, no se ha fusionado la PR #22 y no se ha realizado otra operación remota de escritura. La autorización anterior se aplicó a 0c871ab; esta candidata cambia código y necesita revisión/autorización propia antes de publicarse. Para aceptar la siguiente release real: registrar controller en cada cliente antes de publicar, texto sintético, worker antiguo/nuevo y aviso; cerrar uno, comprobar waiting, salir del último y comprobar versión nueva al reabrir. Evitar una publicación vacía solo para obtener un PASS.

Entrega: followup.patch contra 0c871ab; followup.bundle de la rama; FOLLOWUP.json; followup-demo; followup-production; followup-evidence. No contiene node_modules ni credenciales. Los builds usan únicamente configuración web pública o ficticia demo. Los hashes detectan cambios de bytes, no constituyen aprobación.

## Actualización vigente — 25/10/2026

Publicada con autorización la revisión **0bb93e755d76fc5cd92f54978e732c5924ba27e7**, únicamente en hosting:app, a las 00:19 Europe/Madrid. **PASS del caso pendiente entre releases públicas en Safari real**: ambas pestañas controladas antes de publicar, worker anterior retenido y nuevo waiting, aviso visible y texto conservado; cerrar una mantiene waiting, cerrar la última y reabrir carga la nueva revisión. Spark y reglas comprobados, sin cambios de reglas ni merge. El estado histórico BLOCKED de ese caso queda superado. No equivale a una revalidación integral de todas las funciones en 0bb93e7; CI remoto y flujos autenticados/offline de esta revisión no se repitieron. Informe vigente: ../ML16-release-review/CIERRE-ACTUALIZACION-PUBLICA.md.

Estado posterior: CI y cobertura nativa ampliados el 25/10/2026. Véase AMPLIACION-CI-Y-SAFARI.md para el resultado vigente, distinguiendo SHA publicado, árbol equivalente y entorno de emuladores.
