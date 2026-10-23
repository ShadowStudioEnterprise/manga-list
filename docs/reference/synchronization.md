# Cursores, coordinación y Pinia

Referencia interna ML-04 sobre `a6627d0`, 23/10/2026. Complementa los
[servicios](/reference/services) y [diagramas](/architecture/diagrams).

## Cursores y listeners

`src/services/library-cursors.js` exporta
`subscribeCursorLibrary(reference, deserialize, onData, onError)` y
`fetchCursorLibrary(reference, deserialize, assertSession)`. La primera devuelve
cancelador; la segunda una promesa de array. Ambas construyen consultas con
`orderBy(documentId())`, inicio exclusivo `startAfter(lower)`, fin inclusivo
`endAt(upper)` cuando proceden y `limit(pageDocuments + 1)`: actualmente 5001.
No usan offsets ni orden por campos mutables.

Cada rango desbordado espera un snapshot autoritativo, cancela el padre y abre
hijos disjuntos. En el extremo abierto, la frontera es el ID número 5000; en un
rango cerrado, el número 2500. El hijo izquierdo debe confirmar su subárbol antes
de abrir el derecho. Una barrera evita publicar un subconjunto durante la división.
No se fusionan rangos vacíos automáticamente. El orden de hojas sigue caminos de
árbol y conserva el orden ID para desempates de los sorts del cliente.

`onData(items, metadata)` recibe `fromCache`, `hasPendingWrites` y `complete`.
La primera confirmación de cada hoja exige ambos flags SDK explícitamente falsos.
La confirmación se recuerda para `complete`; los flags actuales siguen avisando de
caché o cambios pendientes posteriormente. Cada apertura real consume admisión de
lectura y cada suscripción lógica consume `listen`. Más de 10000 documentos o
64 rangos produce `app/library-budget`, cancela todo y no certifica una carga parcial.
Un fallo de rango también cancela la suscripción completa.

ML-09 añade un plazo de 60 s sin confirmación completa del servidor al abrir,
dividir rangos o volver a caché/cambios pendientes. Repetir snapshots locales no
reinicia el plazo. Al vencer, cancela todos los targets, informa
`app/listener-timeout` y requiere reintento manual. Una confirmación completa
cancela el plazo. El SDK puede reconectar internamente dentro de ese intervalo;
no se afirma un número exacto de intentos ni lecturas facturadas.

La exportación lee las primeras 5000 obras de cada página de hasta 5001; continúa
después de la última incorporada, releyendo el centinela. Comprueba sesión antes y
después de cada lectura. Rechaza metadatos ausentes, caché, escrituras pendientes,
cursor inmóvil y exceso de biblioteca. El error descarta el resultado completo.
Las páginas sucesivas **no son una instantánea atómica**: una inserción detrás del
cursor puede quedar fuera sin que esta función lo detecte.

## Pestañas y dispositivos

`src/services/shared-library.js` exporta
`subscribeSharedLibrary(key, start, onData, onError, isCurrent, runtime = globalThis)`.
Sin documento, Web Locks o BroadcastChannel delega directamente en `start`:
puede haber listeners independientes por pestaña. Con esas capacidades, un lock
por origen/proyecto/ruta UID elige propietario y el canal distribuye datos en memoria.
Otros dispositivos, perfiles, particiones y orígenes no comparten esa coordinación.

El cancelador cierra canal, timer, suscripción y lock; puede exponer
`requestSnapshot()` para pedir la última entrega del propietario. Esto manda
`hello`, sin lectura Firestore y sin garantizar una lectura nueva del servidor.
El propietario emite latido cada 5 s. Tras más de 15 s sin actividad, una seguidora
con datos conserva las obras pero marca `fromCache: true` y `coordinationStale: true`.
No roba el lock ni abre un segundo listener al suspenderse el propietario.
Cerrar o recargar el propietario libera el lock; el relevo abre nuevos rangos.

La época de propietario impide que paquetes retirados sobrescriban al sucesor.
localStorage solo conserva época y fallo (código/tiempos), sin obras ni credenciales.
El fallo terminal se consulta antes de asumir propiedad; cuotas Firestore dejan
pausa compartida de 15 minutos. Un fallo de almacenamiento/coordinación termina
con error, sin bucle de reapertura. `isCurrent` protege entregas por sesión.
El canal no es frontera de seguridad frente a scripts del mismo origen.

## Presupuestos y Spark

`src/utils/spark-budget.js`: `createSparkBudget(now = Date.now, runtime, namespace = 'default')` devuelve
`remaining(kind)`, `retryAfterMs(kind)`, `take(kind)`, `record(error)`,
`onPause(observer)` (devuelve cancelador) y `listenerConfirmed()`;
`sparkBudget` es la instancia del cliente. Ventanas de 60 s por pestaña: read 60,
write 120, listen 3, auth 10. Un tipo desconocido o ventana agotada rechaza la
admisión. `record` pausa 15 min ante `resource-exhausted`,
`firestore/resource-exhausted`, `auth/quota-exceeded` y `auth/too-many-requests`.
Los listeners de rangos se registran con `onPause`: una cuota recibida desde
cualquier operación los detiene. La instancia del cliente persiste solo el plazo
numérico en localStorage por proyecto y lo propaga mediante eventos storage.
Sobrevive recargas y cierra listeners de otras pestañas del mismo origen/perfil.
Sin almacenamiento funciona en memoria; otros dispositivos no comparten la pausa.
No se guardan obras, UID, mensajes ni contadores remotos. Vencer la pausa permite
un intento manual, nunca certifica restauración de cuota diaria.
`unavailable` y `app/listener-timeout` retrasan nuevas escuchas 2, 4, 8, 16, 32 y
60 s (máximo), además del límite de 3 admisiones/minuto. Una confirmación completa
reinicia esa progresión. No hay temporizador que reabra listeners automáticamente.

`SPARK_LIMITS`: libraryDocuments 10000, pageDocuments 5000, libraryRanges 64,
deletionBatch 400, deletionBatches 5, transactionAttempts 3,
listenerUnconfirmedMs 60000. Son límites de cliente,
no máximos de Firestore, capacidad garantizada ni permisos de reglas.
Los 60 reads cuentan admisiones a consultas/targets/intentos, **no documentos**.
Cada intento de lectura del marcador en la transacción de borrado consume admisión;
las evaluaciones de reglas y reconexiones pueden añadir lecturas fuera del contador.

Como referencia de planificación, Firestore Standard publica cuota gratuita de
50000 lecturas, 20000 escrituras y 20000 borrados diarios, 1 GiB y 10 GiB de salida
mensual; se comparte por proyecto y reinicia el día alrededor de medianoche del
Pacífico. Una consulta vacía y las reglas pueden consumir lecturas. Consultado
23/10/2026: [cuotas oficiales](https://firebase.google.com/docs/firestore/quotas) y
[coste de listeners y reglas](https://firebase.google.com/docs/firestore/pricing).
El emulador no reproduce facturación ni cuotas de producción. Se mantiene Spark
exclusivamente; no habilitar billing para resolver un agotamiento.

## Store de biblioteca

`src/stores/manga-store.js`, `useMangaStore`, ID Pinia `mangas`.

| Estado / getter                                                                  | Significado                                                                                                                                   |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `mangas`, `libraryRevision`                                                      | Array completo en memoria; revisión aumenta en cada entrega, incluso metadatos                                                                |
| `loading`, `syncError`, `subscribedUid`                                          | Carga inicial, mensaje de error de escucha y cuenta suscrita                                                                                  |
| `snapshotReceived`, `snapshotFromCache`, `coordinationStale`, `hasPendingWrites` | Evidencia de observación; no certifica conectividad presente                                                                                  |
| `pendingWritesByUid`, `pendingOperations`                                        | Map de escrituras de store aún en curso y contador para cuenta suscrita                                                                       |
| `searchQuery`, `filters`                                                         | Consulta local, estado/tipo/géneros/favoritos                                                                                                 |
| `libraryOwnerUid`                                                                | Dueño de la selección local; permite conservar búsqueda/filtros al reintentar la misma cuenta y los limpia al cambiar de cuenta o desuscribir |
| `filteredMangas`                                                                 | Filtra toda la biblioteca y ordena según settings; intersección de géneros                                                                    |
| `counters`, `syncStatusMessage`                                                  | Contadores globales y explicación conservadora de sincronización                                                                              |

`subscribe(uid)` evita duplicar cuenta activa, cancela anterior y protege callbacks
con UID y versión. `unsubscribe()` limpia obras, búsqueda, filtros y metadatos;
conserva el Map de operaciones en curso y no reinicia `libraryRevision`.
El error de escucha conserva la última lista pero retira UID, marca caché y error;
esa lista no debe tratarse como confirmada.

Acciones locales: `setSearchQuery(value)`, `setFilters(filters = {})`,
`resetFilters()`, `requestSharedSnapshot()`. `runTrackedWrite(uid, operation)`
incrementa/decrementa por cuenta con `finally`; las promesas de escrituras de otra
cuenta no pasan al contador de la nueva. `createManga`, `updateManga`, `deleteManga`
delegan servicios mediante este seguimiento; `findDuplicates(uid, name)` consulta
servicio. `toggleFavorite(uid, manga)` incluye valor esperado. `changeChapter(uid,
manga, direction)` devuelve `{ changed: true, chapter, requiresManual: false }` o
`{ changed: false, chapter, requiresManual: true }` ante capítulo manual; otros
errores se propagan. La paginación visual de `src/composables/use-library-pagination.js`
es de 24 tarjetas tras filtrar/ordenar; no cambia las consultas Firestore.

## Stores de Auth y preferencias

`src/stores/auth-store.js`: `useAuthStore`, ID `auth`; estado `user`, `loading`,
`initialized`, `error`, getter `isAuthenticated`. `initialize()` comparte promesa y
observa Auth; cambia suscripción de biblioteca por UID y borra borradores al salir
de una cuenta. Una configuración ausente termina inicializada con usuario nulo;
otros fallos permiten reintentar. Acciones `login(email, password)`,
`register(email, password)`, `loginWithGoogle()`, `logout()`, `resetPassword(email)` y
`deleteCurrentAccount(options)` gestionan loading/error. Login/registro devuelven
usuario serializado. El borrado desuscribe primero, limpia ajustes/borradores al
terminar y vuelve a suscribir el UID si falla.

`src/stores/settings-store.js`: `useSettingsStore`, ID `settings`; único ref
`sortBy`, inicial `updated-desc`. `SORT_OPTIONS` admite name-asc/name-desc,
updated-desc/created-desc/chapter-desc y normaliza alias antiguos. `hydrate()` relee,
`setSortBy(value)` devuelve valor normalizado, `persist()` devuelve éxito booleano y
`resetSettings()` restaura y retira clave. Guarda solo preferencias bajo
`mangalist.settings.v1`; errores de almacenamiento mantienen valores en memoria.
No existe sincronización Firestore de ajustes ni acción pública para cargar páginas remotas.

Pruebas: `tests/library-cursors.test.js`, `tests/shared-library.test.js`,
`tests/manga-store.test.js`, `tests/spark.test.js`, `tests/firestore/library-cursors.test.js`,
`tests/firestore/ml07-consumption.test.js` y `tests/e2e/ml07-tabs.spec.js`.
