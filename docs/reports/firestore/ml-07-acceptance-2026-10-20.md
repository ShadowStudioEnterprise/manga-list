# ML-07: aceptación y capacidad para 50 cuentas de 500 obras

Seguimiento de la [revisión ML-07](./ml-07-sync-2026-10-20.md), sobre el código
`331d40021391fa8a6a1a459576f21e9f572a2aa6`. Se conservan sus resultados y los
intentos fallidos; las comprobaciones nuevas tienen evidencia y alcance propios.

## Aceptación humana del límite

El 20/10/2026 el usuario respondió: **«Acepto 5001 con esas condiciones»** a la
propuesta concreta del PR #6. Queda aceptado el contrato técnico:

- 5000 obras y un centinela como máximo por consulta.
- Acceso solo al propietario; máximo local de 10000 obras y 64 rangos.
- Reglas antes del cliente en una eventual publicación autorizada por separado.

La aceptación no autoriza fusionar, desplegar ni acceder a Firebase remoto,
cuentas o datos reales. No se envía una aprobación GitHub en nombre del usuario.
El PR continúa en borrador. El límite técnico de 10000 tampoco constituye una
aprobación de esa capacidad operativa en Spark.

## Congelación real

El sondeo nuevo usa el ciclo de vida nativo de Chromium sobre un documento
oculto, dentro de un perfil o contexto exclusivo para pruebas. Se observaron
`freeze` y `resume` y ningún avance del contador de temporizadores entre ambos.
Esto supera el ensayo anterior de JavaScript deshabilitado, que podía descartar
callbacks y no demostraba congelación.

El recorrido de MangaList con 500 obras comprueba el aviso de la seguidora, una
edición confirmada por el emulador mientras el propietario está congelado, la
recepción de esa edición al reanudar, la exportación completa y el cierre de un
propietario congelado. Sus resultados se incorporan cuando finalice el ensayo.
El alcance es el documento Chromium: no se extrapola a suspensión del sistema,
congelación del proceso completo o ciclo de vida de Firefox.

El primer intento local de MangaList agotó el tiempo durante el registro, con
aviso de conexión al emulador, antes de alcanzar la congelación. Se conserva su
registro. El ensayo prepara ahora una lectura/escritura de prueba del emulador
antes de abrir la app. El sondeo mínimo del mismo controlador sí confirma el
ciclo nativo en un contexto aislado con interceptación de red. La CI de esta
revisión y su artefacto `ml07-freeze.json` deben confirmar el recorrido completo;
las CI correctas de `331d400` no validan este ensayo nuevo.
El segundo intento local llegó a congelar la biblioteca y mostrar el aviso, pero
falló una comprobación de la propia prueba: `withSecurityRulesDisabled` devuelve
`void` aunque su callback devuelva un valor. Se corrigió capturando el capítulo
dentro del callback. Ese intento no se presenta como validación de la reanudación.
Un tercer intento recibió datos confirmados antes de la orden explícita de
reanudar. El ensayo registra ahora si el navegador ya emitió `resume`, los
contadores y si se solicitó recuperación. Exige al menos 20 segundos de
congelación antes de iniciar la edición, conserva diagnósticos incluso si falla
y no exige que el aviso siga visible después de recibir datos nuevos.

Las CI de `3bbe47a` conservaron 91 pruebas unitarias, 22 de reglas y 39 E2E
correctas, pero el ensayo nuevo no pasa completo. En el PR se observó una
consulta completa adicional en la seguidora tras reanudar (congelación medida
20392 ms y cero avances del contador). En la rama se alcanzaron reanudación,
edición y exportación, y falló la expectativa de 500 resultados mientras seguía
aplicado el filtro de una obra. Se corrige esa expectativa conservando la búsqueda
hasta comprobarla y borrándola explícitamente antes de comprobar las 500 obras.
La consulta adicional sigue exigiéndose ausente: no se relaja esa condición.
Se registran bloqueos, consultas y errores del propietario para explicar el fallo.
Un sondeo aislado de 21 segundos conserva el bloqueo exclusivo durante y después
de congelar, con la otra petición aún pendiente. No prueba el recorrido de la app.
No se presenta ninguna de esas CI como validación completa ni como publicación.

La revisión `7eb4dae` se detuvo en ambas CI antes de las pruebas: la auditoría
identificó [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv)
en Vite 8.2.2. Se fija Vite 8.2.4, compatible con Quasar, sin cambiar umbrales de
auditoría. El archivo de bloqueo cambia solo esa resolución y su dependencia
directa de desarrollo. La validación posterior debe corresponder a ese archivo.
El quinto intento local con diagnósticos agotó 360 segundos antes de crear el
propietario; sus eventos y consultas están vacíos y no validan la congelación.

Las dos CI de `61ac71a` reproducen la consulta adicional. Los diagnósticos
muestran un único bloqueo exclusivo: su titular se conserva mientras está
congelado y cambia a la petición pendiente tras reanudar. Esto demuestra un
relevo; no demuestra dos propietarios simultáneos ni explica todavía su causa.
El cliente del servidor Vite puede recargar al perder su websocket. Para aislar
esa interferencia se desactiva HMR únicamente en E2E con emuladores demo y se
exige una sola navegación, ningún websocket de desarrollo establecido y el mismo titular
del bloqueo antes y después. Se conservan las condiciones de cero consultas
en la seguidora. El resultado de ese ensayo debe confirmarse en CI.

## Suspensión completa de un navegador aislado

El ensayo adicional `ml07-browser-process-freeze.spec.js` ejecuta Chromium
exclusivo de prueba en Linux CI. Obtiene su PID desde `BrowserServer`, exige
un grupo propio separado del controlador y verifica que todos sus descendientes
pertenezcan al grupo. Solo entonces envía `SIGSTOP`, verifica estados de proceso
detenidos y confirma una edición desde una herramienta externa contra el emulador.
Tras al menos 20 segundos reanuda con `SIGCONT`, exige recepción en ambas pestañas,
exportación completa y un único relevo al cerrar al propietario. Un temporizador
de seguridad y el bloque final reanudan siempre el grupo de prueba.

Todas las pestañas del navegador suspendido se detienen juntas: la edición no
se atribuye a una seguidora que siguiese activa dentro de ese navegador. El
propietario puede reconectar una consulta, que se registra como coste adicional;
la seguidora debe seguir sin consulta de biblioteca. El artefacto
`ml07-browser-process-freeze.json` debe confirmar el recorrido completo. Este
ensayo aún no tiene resultado y no demuestra suspensión del sistema, Windows
ni Firefox. Complementa el ciclo nativo del documento, no sustituye sus fallos.

En las CI de `a420261`, las 39 E2E anteriores siguen pasando, pero los ensayos
nuevos se detienen antes de congelar: Playwright ya había iniciado la traza del
contexto y Vite conservaba el websocket pese a `server.hmr=false`. Se elimina el
inicio/cierre duplicado de trazas y se añade `server.ws=false`, que la
[documentación de Vite](https://vite.dev/config/server-options.html#server-ws)
define para desactivar el canal. No se relajan los controles de ausencia de
websocket establecido, navegación única, bloqueo ni consultas. Se registran por separado los intentos del cliente y los handshakes 101: un
intento rechazado no es un canal establecido. Estos fallos no prueban una
suspensión ni se presentan como validación de coordinación.

## Capacidad diaria: presupuesto propuesto

Datos declarados: **50 cuentas y 500 obras por cuenta**. Las frecuencias siguen
desconocidas. El modelo siguiente elige hipótesis para decidir; no las atribuye
al usuario ni las presenta como facturación medida o aprobación operativa.

La [cuota gratuita de Firestore](https://firebase.google.com/docs/firestore/quotas#free-quota)
incluye 50000 lecturas y 20000 escrituras diarias, 1 GiB almacenado y 10 GiB de
salida mensual. Se comparte en el proyecto; el reinicio diario se produce alrededor
de medianoche del Pacífico. Sin persistencia, una reconexión puede cobrarse como
consulta nueva según la [documentación de listeners](https://firebase.google.com/docs/firestore/pricing#listening_to_query_results).

Propuesta: planificar hasta **40000 lecturas diarias**, conservando 10000 de
margen frente a la cuota. Dentro de esas 40000 se asignan otras 5000 a lecturas
auxiliares, dependencias de reglas, operaciones de perfil y reintentos. Es una
asignación de planificación, no un contador global implementado por el cliente.

| Concepto elegido para un día con las 50 cuentas activas             | Lecturas modeladas |
| ------------------------------------------------------------------- | -----------------: |
| Una apertura fría por cuenta                                        |              25000 |
| 20 incrementos sin colisión por cuenta, tres lecturas por operación |               3000 |
| Una búsqueda de duplicado sin coincidencias por cuenta              |                 50 |
| Asignación auxiliar agregada                                        |               5000 |
| Base total                                                          |              33050 |
| Trece eventos completos adicionales, 500 documentos cada uno        |               6500 |
| Total propuesto                                                     |          **39550** |

Quedan 450 lecturas dentro del presupuesto y 10450 respecto a la cuota completa.
Los **13 eventos son entre todo el proyecto**, sumando reconexiones, exportaciones,
reaperturas tras cierre y relevos de propietario; no son 13 por cuenta. El evento
14 da 40050 y rebasa el presupuesto. Las 20 actualizaciones por cuenta suman
1000 escrituras, antes de otras escrituras/importaciones.

Este perfil supone un solo propietario de sincronización por cuenta. Los clientes
independientes añaden su apertura y entregas de cambios mientras permanezcan
activos; no basta contar su apertura como otro evento de 500. Sin coordinación,
dos aperturas por cuenta ya modelan 50000 antes de cambios, auxiliares y reintentos.

Una apertura más una exportación o reconexión diaria por cada cuenta también
alcanza 50000 antes de otras operaciones. Con las actualizaciones y la asignación
auxiliar del perfil propuesto, serían **58050**. Por tanto no se aprueba ese patrón
para Spark ni se garantiza la capacidad diaria con frecuencias desconocidas.

## Alta inicial como escenario presupuestado

Las 25000 obras nuevas exceden las 20000 escrituras gratuitas de un solo día.
Además, el modelo conservador de importación es `3N` lecturas antes de otros usos.
El cálculo reproducible propone seis días con **16, 12, 9, 6, 5 y 2 cuentas nuevas**.
Incluye por día, además del término de importación, una apertura fría adicional,
20 incrementos y un duplicado por cada cuenta ya cargada o recién cargada, más
5000 auxiliares. Las entregas del término `3N` no se vuelven a cobrar como la
misma entrega: la apertura fría es otro evento elegido como margen conservador.

Todos esos días quedan por debajo de 40000 lecturas y 20000 escrituras modeladas.
No se contemplan eventos extra durante esa carga. Es una sensibilidad presupuestada,
no un calendario autorizado, ni una garantía frente a uso o reintentos mayores.
No se ha creado ninguna cuenta ni importado ninguna obra real.

## Almacenamiento y transferencia

No hay tamaños reales ni transferencia mensual medidos. Como sensibilidad,
suponer 5 KiB por cada lectura modelada del perfil de 39550 al día da unos
**5,66 GiB al mes** en 30 días; con 25 KiB da **28,29 GiB**, por encima de 10 GiB.
No se igualan lecturas a bytes reales: el cálculo usa unidades hipotéticas de
transferencia y no contabiliza de forma exacta protocolo, índices o documentos
auxiliares de tamaños diferentes.

Para 25000 obras, 5 KiB por obra serían unos 0,119 GiB de datos y 25 KiB unos
0,596 GiB, ambos **sin índices ni otros documentos**. Por ello los 500 documentos
por cuenta no bastan para aprobar almacenamiento o salida mensual.

## Reproducción y decisión

`node scripts/model-spark-capacity.mjs` reproduce los números y comprueba los
umbrales de los eventos 13/14 y los presupuestos de cada día de carga. Los
[resultados](../../measurements/ml07-spark-capacity-2026-10-20.json) incluyen las
hipótesis y los valores por día. No inicializa Firebase ni abre conexiones.

El límite 5001 queda aceptado. La capacidad Spark queda como **perfil de planificación
condicionado**, pendiente de observar frecuencias, tamaños y consumos auxiliares
dentro de las asignaciones. No es un control agregado de cuota ni una autorización
de operación remota. Se mantiene exclusivamente Spark, sin servicios de pago.
