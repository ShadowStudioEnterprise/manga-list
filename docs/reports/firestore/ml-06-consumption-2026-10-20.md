# ML-06: consumo de Cloud Firestore — 20/10/2026

## Dictamen y alcance

El índice completo en memoria permite búsqueda y orden globales, pero el límite
técnico de 10000 obras no acredita capacidad operativa en Spark. Una carga fría y
una exportación de ese tamaño representan **29018 lecturas de documentos en el
modelo de planificación**, el 58,04 % del cupo diario compartido. Tres pestañas
frías representarían 57027, antes de actividad adicional. Son escenarios derivados,
no lecturas facturadas observadas. La recomendación es mantener Spark, reducir
reaperturas y definir una mezcla de uso antes de aprobar capacidad.

Base: `b1bc5f3b74b159fad0872a6227284d971a2d8bec`, último `origin/main` consultado
el 20/10/2026. Rama: `development/ml-06-firestore-consumption-2026-10-20`.
Se parte de los informes de [coste](firestore-cost-review-2026-10-19.md),
[transacciones](transaction-read-budget-2026-10-19.md) y
[10000 obras](verification-10000-2026-10-19.md). El cambio de main reorganizó
documentación; conserva el algoritmo de rangos y la admisión por intento.

Solo emuladores Standard y datos sintéticos. La edición Standard/eur3 y Spark
constan en la [verificación histórica](../security/verification-spark-2026-10-18.md);
no se consulta Firebase real ni se certifica de nuevo su estado. No se cambian
aplicación, reglas, índices, persistencia, dependencias declaradas, cuentas, datos
reales, billing ni servicios. No hay fusión ni despliegue.

## Qué se mide y qué se estima

| Métrica                        | Instrumento                                   | Significado y límite                                                                  |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Aperturas de targets y activos | Adaptador que delega al SDK real `onSnapshot` | Consultas abiertas por la aplicación; no sockets ni unidades facturadas               |
| Documentos iniciales           | Primera instantánea confirmada de cada target | Documentos materializados en cliente, posiblemente con reutilización de caché         |
| Cambios de listener            | `docChanges()` de instantáneas confirmadas    | Cambios entregados; no se suma `snapshot.size` de cada callback como nuevas lecturas  |
| Exportación/duplicados         | Llamadas SDK y tamaño devuelto                | Documentos recibidos y peticiones; una consulta vacía devuelve cero documentos        |
| Transacción                    | Cada `transaction.get` real                   | Intentos de lectura de aplicación; reintentos internos de transporte fuera de alcance |
| Admisiones                     | Envoltorio del presupuesto real por cliente   | Límite local por minuto; no cuota diaria ni protección de servidor                    |
| Consumo de cuota               | Modelo explícito y documentación oficial      | **No medido por el emulador**; tampoco se ha consultado facturación real              |

Se descartan eventos de caché o escrituras pendientes al contar confirmaciones.
Una transición de metadatos puede producir un callback sin nueva lectura. Una
reconexión puede consumir cuota sin crear targets o admisiones de aplicación.
Por tanto no hay una columna de «facturación real» que pueda rellenarse con
honestidad: `billedReadsMeasured: false` en la evidencia.

## Método reproducible

Requisitos: lockfile de esta base, Node 24.18.0, Java 21+ (ejecución local: 23.0.1),
Firebase CLI 15.32.1, SDK Firebase 12.18.0, emulador Firestore 1.22.0.
Instalar las dependencias con `npm ci`. La matriz SDK no requiere navegador;
para el ensayo de pestañas instalar Chromium/Firefox con
`npx playwright install chromium firefox`.
En Windows, colocar el directorio real de Java antes del shim de Oracle en PATH.
En equipos con poca memoria, ejecutar los archivos en serie y acotar el heap de
Java, por ejemplo `JAVA_TOOL_OPTIONS=-Xms64m -Xmx512m`. Es memoria del proceso
local, no un cambio de cuota Firebase. En esta ejecución el arranque sin cota llegó
a exceder los 60 segundos del CLI; el ensayo definitivo utiliza heap acotado.

```sh
npm test
firebase emulators:exec --project demo-mangalist --only firestore "node --experimental-vm-modules --test --test-concurrency=1 tests/firestore/*.test.js"
node scripts/model-ml06-consumption.mjs
firebase emulators:exec --project demo-mangalist --only auth,firestore "npx playwright test tests/e2e/ml06-tabs.spec.js"
npm run lint:check
npm run docs:build
node scripts/check-spark.mjs
```

`tests/firestore/ml06-consumption.test.js` exige `127.0.0.1:8188` antes de
crear contextos y usa `demo-mangalist-ml06`. Siembra 0/100/1000/2500/5000/10000
obras por UID con reglas deshabilitadas **solo en ese emulador**; la fase de ensayo
usa reglas de main y contextos autenticados independientes. Se excluye la siembra.

Para cada tamaño se mide: arranque completo, getters/acciones reales de Pinia,
todos los cortes visuales de 24 obras, exportación íntegra desde servidor,
duplicado presente/ausente/texto vacío, segundo cliente, incremento transaccional,
recepción del cambio, desconexión/reconexión y cierre/reapertura. Comprueba integridad,
identidad y cero listeners tras cerrar. El reloj local avanza 60000 ms únicamente
antes de reabrir; no se modifica el límite ni se simula reinicio diario de Spark.

La matriz utiliza dos contextos SDK independientes por tamaño como aproximación
a pestañas sin coordinación. **Por sí sola no mide dos pestañas del mismo origen.**
El intento local de navegador agotó 180 segundos al navegar al registro, antes de
medir la biblioteca; no se considera evidencia de coste ni regresión demostrada.
Se añadió la [prueba de pestañas de la versión ML-06](https://github.com/ShadowStudioEnterprise/manga-list/blob/4547f7d/tests/e2e/ml06-tabs.spec.js)
para completar esta observación en CI. Su sucesora actual es
`tests/e2e/ml07-tabs.spec.js`; el comando histórico anterior requiere aquella revisión:
dos pestañas del mismo contexto y origen con 2500 obras, autenticación compartida,
mensajes WebChannel `addTarget`, búsqueda, incremento y recarga de una pestaña.
El ensayo bloquea peticiones fuera de los tres puertos locales. Pasó en ambos
navegadores en las dos CI del código `5326add`; las cuatro observaciones quedan
conservadas en el JSON de pestañas. La limitación de carga local de Windows se
mantiene documentada, pero ya existe observación de pestañas reales en CI Linux.

Resultados brutos revisables:
[servicio](../../measurements/ml06-consumption-2026-10-20.json),
[modelo](../../measurements/ml06-model-2026-10-20.json) y
[pestañas en CI](../../measurements/ml06-tabs-2026-10-20.json).
Los originales nuevos se generan en `test-results/`. Una muestra por escenario;
no se presenta comparación estadística de latencia ni benchmark de producción.

## Carga inicial, rangos y exportación

En biblioteca estable, tamaño B=1000 y P=ceil(N/B), cada división sustituye
un target por dos rangos disjuntos ordenados por ID. La consulta usa `limit(1001)`.
Para N>0: targets/admisiones iniciales T=2P−1; activos P;
documentos iniciales I=N+1001(P−1). El hijo cerrado repite hasta 1000 documentos.
Exportación: P peticiones, E=N+P−1 documentos recibidos, incluidos los centinelas
repetidos. Estas fórmulas se contrastan contra el servicio real en el emulador.

| N     | Rangos | Targets/admisiones arranque | Docs arranque I | Docs exportación E | I+E   | % de 50000 |
| ----- | ------ | --------------------------- | --------------- | ------------------ | ----- | ---------- |
| 100   | 1      | 1                           | 100             | 100                | 200   | 0.40       |
| 1000  | 1      | 1                           | 1000            | 1000               | 2000  | 4.00       |
| 2500  | 3      | 5                           | 4502            | 2502               | 7004  | 14.01      |
| 5000  | 5      | 9                           | 9004            | 5004               | 14008 | 28.02      |
| 10000 | 10     | 19                          | 19009           | 10009              | 29018 | 58.04      |

I y E son primero métricas de documentos del cliente. Para presupuestar se supone
que cada consulta nueva al servidor consume sus documentos completos, sin descuento
por caché/reutilización. Se adopta I como estimación conservadora de arranque frío,
no como lectura facturable demostrada ni límite superior ante reintentos y cambios
concurrentes. Una caché caliente puede materializar documentos sin transferencia
equivalente; el SDK/emulador no permite convertir estas métricas en recibo real.

Los rangos usan solamente `documentId()` y no offsets. Según el contrato de
[consumo de consultas](https://firebase.google.com/docs/firestore/pricing), el
modelo no añade entradas de índice a estas consultas de un solo campo de rango.
No se ejecuta Query Explain remoto. Consultas futuras con más campos de rango
requieren rehacer esa hipótesis.

N=0: un target, una admisión `read` y una `listen`, cero documentos recibidos;
exportación: una petición y una admisión. El modelo asigna el mínimo de una lectura
a cada consulta vacía. La carga vacía más exportación cuesta dos en ese modelo,
no cero.

Ejemplo auditable de rangos con 2500: las primeras respuestas de los cinco
targets contienen 1001, 1000, 1001, 1000 y 500 documentos (4502 en total).
Quedan tres rangos activos de 1000, 1000 y 500. Exportar recibe 1001, 1001 y 500
(2502), y entrega 2500 obras únicas. Los documentos extra de la división y los
centinelas no son obras nuevas. La página visual 2 no abre el segundo rango:
todos se abren al inicio.

## Matriz de comportamientos adicionales

| Escenario                                                 | Observación de aplicación                                             | Planificación de lecturas                                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Páginas visuales, búsqueda por fragmento, filtros y orden | 0 llamadas SDK y 0 admisiones adicionales tras cargar                 | 0 incremental; el coste inicial ya pagó el índice completo                                                        |
| Páginas visuales para N solicitados                       | 5 / 42 / 105 / 209 / 417 cortes de 24                                 | No confundir con rangos Firestore 1 / 1 / 3 / 5 / 10                                                              |
| Comprobar duplicado exacto                                | Consulta `normalizedName ==`, límite 10; 1 admisión                   | max(1,D), D entre 0 y 10, si consulta servidor; caché no prueba consumo nuevo                                     |
| Nombre vacío en duplicados                                | 1 admisión, 0 consultas por retorno temprano                          | 0; contraejemplo de admisión equivalente a lectura                                                                |
| Incremento sin contención                                 | 1 `transaction.get`, 1 admisión read y 1 write; 0 targets nuevos      | 1 lectura transaccional + entregas a sesiones + dependencia de reglas del commit                                  |
| Edición con valores esperados / favorito                  | Transacción con máximo de 3 intentos                                  | Entre 1 y 3 gets; cada intento toma admisión; el commit añade reglas                                              |
| Edición directa sin valores esperados                     | `updateDoc`, sin get de aplicación                                    | Entregas a listeners y dependencia de reglas; no asumir cero lecturas totales                                     |
| Importación idempotente                                   | 1 get por fila/intento, incluso si ya existe                          | Lecturas de existencia + reglas si hay escritura + entregas; posibles reintentos                                  |
| Alta / borrado                                            | Alta directa sin get; borrado sin dependencia de manga en reglas      | Alta: entregas y regla de marcador; borrado: sin lectura por retirada del listener; posibles divisiones por altas |
| Listener sin cambios y sin desconexión                    | Sin consultas adicionales por mero tiempo abierto                     | 0 incremental de documentos bajo estas condiciones                                                                |
| Cambio de otro cliente                                    | 1 documento modificado observado en el segundo cliente, todos los N>0 | 1 entrega por sesión que escucha el documento; no N por cada callback                                             |
| Reconexión estable                                        | 0 targets y 0 admisiones nuevas                                       | N documentos por cliente sin persistencia; con rangos vacíos sumar mínimos                                        |
| Cierre/reapertura                                         | Repite T targets/admisiones e I documentos iniciales                  | Presupuestar otra carga fría; caché caliente no es garantía de ahorro                                             |
| Exportar de nuevo                                         | Repite P admisiones y E documentos                                    | Relectura deliberada; no reutiliza el índice local para certificar copia                                          |

La semántica oficial de
[listeners](https://firebase.google.com/docs/firestore/pricing#listening_to_query_results)
cuenta altas, modificaciones y retiradas debidas a cambios; distingue la eliminación
real del documento. Aquí las fronteras por ID evitan que editar nombre/capítulo
mueva la obra a otro rango. Insertar hasta desbordar un rango sí abre nuevos
targets y relee hijos. La fórmula de arranque estable no describe fragmentación
histórica, ráfagas ni rangos vacíos persistentes. El máximo 64 de rangos tampoco
garantiza cabida en cuota.

Las colisiones ya tienen ensayo real del SDK en
`tests/firestore/transaction-budget.test.js`: capítulo, edición e importación
repiten dos gets/admisiones con una colisión inducida; con una admisión restante
se corta antes del segundo get y se conserva la escritura concurrente. Se mantiene
la evidencia separada; una colisión forzada no estima frecuencia real de contención.

### Reglas y lecturas auxiliares

Las reglas de manga `get/list` solo comprueban propietario y límite: no consultan
el documento padre. No se añade una lectura de marcador por target, documento,
actualización de escucha o exportación. En cambio `create/update` usan
`getAfter(users/{uid})`: modelar una lectura dependiente por petición de escritura
que la necesite, no por cada condición ni necesariamente por cada fila de un batch.
Un rechazo que haya evaluado dependencias también puede consumir lecturas.
La comprobación/revisión del marcador en borrado de cuenta queda fuera de la mezcla
de biblioteca y debe salir de la reserva. La siembra con reglas deshabilitadas
no se usa para estimar el coste de esas escrituras.

`auth-service.js` usa Auth sin lecturas Firestore de perfil en registro/inicio.
`getManga` en `manga-service.js` sí admite y ejecuta un `getDoc` para una obra;
su coste depende de servidor/caché. `account-service.js` lee el marcador dentro de
una transacción y consulta mangas por lotes de 400 para borrado; el get del marcador
no toma admisión `read` actualmente. Esta omisión auxiliar no altera la matriz de
biblioteca, pero impide tratar el contador como inventario completo. Estas rutas,
reintentos, errores e intervención operativa están excluidos de los totales de la
mezcla y deben contabilizarse en el resto del proyecto.

### Reconexión y pestañas

`getFirestore()` mantiene caché de memoria por instancia. La persistencia de Auth
en localStorage no habilita persistencia Firestore ni coordinación de consultas.
No se configura `persistentLocalCache` ni `persistentMultipleTabManager`.
La [documentación de caché](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
y el [contrato de reconexión](https://firebase.google.com/docs/firestore/pricing#listening_to_query_results)
obligan a presupuestar consulta nueva al reconectar sin persistencia. Si se adoptara
persistencia, desconexiones de más de 30 minutos conservan ese riesgo. No se activa
en esta tarea: requeriría evaluar privacidad y limpieza de datos por cuenta.

Para rangos estables, reconectar activos relee N; reabrir la biblioteca vuelve a
dividir y se presupuesta I. En 10000: 10000 frente a 19009. La prueba de reconexión
corta/restaura la red del SDK, no simula 30 minutos ni prueba deduplicación de backend.
En múltiples clientes, arrancar T pestañas independientes multiplica I por T y
las entregas de cambios por el número de oyentes. El presupuesto se multiplica
también: 60 lecturas/minuto **por pestaña**, no 60 globales.

La continuación del 20/10/2026 observa dos pestañas reales del mismo contexto y
origen, con 2500 obras, en Chromium y Firefox sobre Ubuntu 24.04 de CI. Ambas ven
el incremento de capítulo confirmado desde una de ellas. Cada navegador se ensaya
dos veces, en las ejecuciones de rama y PR del mismo código:

| Navegador                            | Targets iniciales de ambas pestañas | Targets nuevos al buscar/actualizar | Targets al recargar una pestaña | Peticiones externas |
| ------------------------------------ | ----------------------------------- | ----------------------------------- | ------------------------------- | ------------------- |
| Chromium 153.0.8010.12, dos muestras | 5 + 5                               | 0 + 0                               | 5                               | 0                   |
| Firefox 155.0, dos muestras          | 5 + 5                               | 0 + 0                               | 5                               | 0                   |

Son mensajes WebChannel `addTarget` observados, no admisiones instrumentadas ni
lecturas facturadas. Confirman aperturas independientes en esta muestra; no
demuestran cuántos documentos facturaría el backend ni permiten atribuir ahorro
por caché. El modelo conserva `2I=9004` para dos cargas frías de 2500 y `I=4502`
adicionales para reabrir una. No se presentan estos importes como consumo real
medido por los diez o cinco mensajes de transporte.

## Presupuesto Spark compartido y sensibilidad

Las [cuotas Standard](https://firebase.google.com/docs/firestore/quotas) publicadas
son 50000 lecturas, 20000 escrituras y 20000 borrados diarios, 1 GiB almacenado y
10 GiB de salida mensual para la base gratuita del proyecto. El reinicio diario es
aproximadamente medianoche del Pacífico, no medianoche de Madrid. La cuota no se
reparte por usuario, UID, pestaña ni sitio Hosting; el portal documental comparte
proyecto, aunque sus archivos estáticos no realizan estas consultas Firestore.

En Spark el riesgo es indisponibilidad al alcanzar límites, no una ampliación
automática autorizada de gasto. La [ayuda de cuotas sin coste](https://support.google.com/firebase/answer/9628313?hl=en)
describe el tope. No habilitar billing para superarlo. Los presupuestos locales
60 read/120 write/3 listen/10 auth por minuto no controlan documentos, entregas,
reglas ni día compartido. La pausa existente de 15 minutos ante cuota no garantiza
que haya cupo al reintentar; no debe generar tormentas de reaperturas.

Para cuantificar sensibilidad se propone, **sin implementarla ni aprobarla como
capacidad**, una reserva del 20 %: 10000 lecturas para resto del proyecto y 40000
para las mezclas. Ajustar la reserva si el resto real supera ese valor.

Un caso auxiliar muestra por qué el 20 % no es una garantía: el borrado de una
cuenta de 10000 obras en `account-service.js`, sin fallos ni contención, requiere
cinco invocaciones de hasta cinco lotes de 400. Las cuatro primeras leen además
400 documentos de control antes de detenerse, que se releen al reanudar. El modelo
es `10000 + 4×400 + 1 consulta vacía + 5 gets del marcador = 11606` lecturas, antes
de posibles dependencias de reglas y reintentos; son 30 admisiones de consultas,
más cinco gets que el contador local no incluye. Consume además 10000 borrados,
con cupo separado. Es una derivación del código, no una nueva medición de borrado
ni una autorización para actuar sobre cuentas. Por sí sola supera la reserva
propuesta de 10000 lecturas.

- Mezcla A: una pestaña fría, una exportación, 20 incrementos sin colisión y una
  búsqueda de duplicado sin coincidencias. A=I+E+20×(1 get+1 entrega+1 regla)+1.
- Mezcla B: dos pestañas frías, una reconexión estable de cada una, una exportación,
  los mismos 20 incrementos y una comprobación sin coincidencias.
  B=2I+2N+E+20×(1 get+2 entregas+1 regla)+1.

Las mezclas cuentan conservadoramente entrega también al escritor. No incluyen
colisiones, altas/divisiones, aperturas adicionales, comprobaciones auxiliares ni
reintentos de exportaciones. Son supuestos elegidos para comparación, no telemetría
de usuarios ni garantía de que el cupo exacto admita esa cantidad.

| N     | Dos arranques | Tres arranques | Mezcla A | A con reserva | Mezcla B | B con reserva |
| ----- | ------------- | -------------- | -------- | ------------- | -------- | ------------- |
| 100   | 200           | 300            | 261      | 153           | 581      | 68            |
| 1000  | 2000          | 3000           | 2061     | 19            | 5081     | 7             |
| 2500  | 9004          | 13506          | 7065     | 5             | 16587    | 2             |
| 5000  | 18008         | 27012          | 14069    | 2             | 33093    | 1             |
| 10000 | 38018         | 57027          | 29079    | 1             | 68108    | 0             |

«Con reserva» es floor(40000/mezcla), en unidades de mezcla/día, no usuarios
concurrentes soportados. Una sola mezcla B de 10000 supera incluso las 50000
lecturas; dos A suman 58158. Dos pestañas frías de 10000 dejan solo 1982 de la
reserva de biblioteca, antes de exportar o actualizar.

Para una mezcla heterogénea sumar `Σ aperturas_i×I_i + Σ reconexiones_i×N_i +
Σ exportaciones_i×E_i + Σ intentos transaccionales + Σ entregas + reglas +
auxiliares + mínimos/errores`. Comparar con `50000 − restoProyecto`.
No sustituir sumas por media de usuarios ni multiplicar admisiones por una constante.

Almacenamiento y red pueden limitar antes: 10000 documentos a 1 KiB neto son unos
9,77 MiB antes de nombres, metadatos e índices; el máximo de notas de 5000 caracteres
no es un máximo de 5000 bytes. La hipótesis 1/5 KiB por documento entregado da para
I+E de 10000 unos 28,34/141,69 MiB y 361/72 sesiones al mes bajo 10 GiB, si todo
el cupo fuese para ellas. Son sensibilidades aritméticas, no bytes medidos de salida.
No se deriva ocupación real del tamaño de JSON exportado.

## Recomendaciones priorizadas

1. **P1 — aceptar capacidad con mezcla y margen.** No aprobar 10000 como capacidad
   operativa solo porque pasan integridad y límites. Registrar sesiones frías,
   reconexiones, pestañas y exportaciones esperadas; usar esta calculadora y reservar
   cuota para auxiliares, incluidos los borrados reanudables que releen controles.
   Con el patrón B, 10000 no cabe en Spark compartido.
2. **P1 — evitar relecturas accidentales.** Mantener la deduplicación del store por
   UID, no reconstruir listeners al buscar/filtrar/paginar y conservar acción manual
   tras cuota. Documentar el impacto de varias pestañas y de reexportar. No introducir
   actualización periódica de biblioteca completa ni reintento automático en bucle.
3. **P2 — rediseñar la división con evidencia.** La repetición modelada de arranque
   es I−N: 0/0/2002/4004/9009. Es la oportunidad principal antes de ajustar el tamaño
   de página otra vez; exigir pruebas de inserción/borrado en fronteras y caché antes
   de cambiar rangos. No se modifica ese contrato aquí.
4. **P2 — completar el inventario de admisiones auxiliares.** Evaluar admisión por
   intento en la transacción del marcador de `account-service.js`, con pruebas de
   contención y recuperación. Mejora la coherencia del control local; no convierte
   el contador en cuota facturable global ni reduce las lecturas necesarias.
5. **P2 — estudiar coordinación de pestañas y caché.** Un coordinador o persistencia
   compartida podría evitar repetición, pero requiere ensayos de cierre del líder,
   cambio de cuenta, recuperación y privacidad. No prometer ahorro solo por habilitar
   IndexedDB. Medir offline corto/largo sin datos reales antes de adoptarlo.
6. **P2 — decidir el coste del índice global.** Mantener todas las búsquedas actuales
   exige N en memoria; carga bajo demanda reduciría la apertura pero debe resolver
   búsqueda parcial, géneros y orden global sin resultados incompletos. Requiere
   decisión de producto. No proponer buscador externo ni servicios de pago.
7. **P3 — ganancias pequeñas y observabilidad local.** El centinela de exportación
   añade solo 0/0/2/4/9 documentos; no priorizarlo sobre divisiones. Considerar
   diagnóstico local de admisiones y targets, con privacidad y sin añadir escrituras
   a Firestore por evento. Mantener alerta de exportación no confirmada.

Quedan fuera Functions, Run, App Hosting, Extensions, TTL, PITR, backups administrados,
Blaze y cualquier servicio de pago. La recuperación/exportación sigue siendo cliente
y manual compatible con Spark.

## Validación y límites de cierre

Pasan 83 regresiones locales y las 21 pruebas de Firestore ejecutadas en serie.
La matriz nueva pasó en 60,3 segundos: seis tamaños incluido cero, dos clientes
independientes, exportación, duplicados, actualización, reconexión y reapertura.
Coincide con la tabla de transporte y verifica cero consultas/admisiones nuevas
para búsquedas, filtros, orden y cortes visuales. Es tiempo descriptivo de ejecución
local, no latencia del producto. Los 20 ensayos previos incluyen colisiones reales,
aislamiento, JSON/CSV íntegros, barrera de borrado, pausa de cuota y recuperación.
Pasan formato/lint, compilación local del portal con comprobación de enlaces y
control Spark local.

La continuación verifica el código `5326add1e9fda07eba8a89ebd7eb3b7d76e9dfdb` en
[CI del PR](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39430766297)
y [CI de la rama](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39430760261).
Ambas terminan correctamente: 83 regresiones, 21 pruebas Firestore, 31 recorridos
de navegador y una prueba de actualización PWA. Incluyen los dos ensayos nuevos
de pestañas; pasan también auditoría de ambos lockfiles, control Spark, formato,
documentación, compilaciones SPA/PWA con proyecto demo y contratos de build.
Las compilaciones son locales al runner y no publican la aplicación. El JSON
conserva commit, versiones, identificadores de artefacto, cuatro resultados y
estados de CI; su permanencia en el repositorio no depende de la retención de
siete días de los artefactos originales.

ML-06 entrega análisis y reproducción; no cierra aceptación operativa de capacidad,
no certifica consumo diario real, estado remoto Spark, cuota restante, frecuencia
de colisiones, latencia de eur3, otros navegadores/dispositivos o tamaños en
multi-pestaña real distintos de la muestra de 2500, ni persistencia tras 30 minutos.
Una futura verificación de métricas reales sería una actuación separada: no se ha
usado para este informe ni se ha tocado ninguna cuenta real.
