# Biblioteca con cursores Firestore — propuesta de implementación 1.0

Rama de revisión; no publicada. Base verificada: `main` =
`9a43953d1c0866fcf07cd8f33af53a88cf683d55`. PR #2 integrado el 18/10/2026 a
las 21:54:54 Europe/Madrid. Esta rama no modifica reglas, índices ni configuración remota.
Edición objetivo: Standard nativa, fijada por `spark-policy.json` y la evidencia
anterior de `verification-spark-2026-10-18.md`; la evidencia remota debe renovarse
antes de cualquier publicación autorizada.

## Contrato y elección

Las consultas reales usan `orderBy(documentId())`, `startAfter(id)`, `endAt(id)` y
`limit(501)`. No usan offsets ni una consulta sin límite. Cada rango devuelve hasta
500 obras y un documento centinela que detecta la necesidad de dividirlo. Un rango
final lleno se divide en `(inicio, último ID de las primeras 500]` y
`(ese ID, fin]`. Un rango ya cerrado que crece se divide por su punto medio.
El límite inferior es exclusivo y el superior inclusivo: no hay solapamientos.
El borrado de un documento que sirvió como cursor no invalida el valor del ID.

Cada rango conserva su listener, incluidos los vacíos: detecta nuevas obras,
modificaciones y borrados de otro dispositivo. Un nombre, fecha o capítulo modificado
no mueve el documento entre rangos. Al dividir se espera a ambos hijos antes de
publicar una biblioteca nueva; callbacks de listeners retirados se descartan.
Desconexión de cuenta, fallo de un rango o agotamiento del presupuesto de la
suscripción cierran todos sus listeners.

Se mantiene un índice completo en memoria. Esto conserva exactamente la búsqueda
por fragmentos normalizados, intersección de géneros, contadores globales, orden
español numérico por nombre y comparación de capítulos especiales. Firestore no
ofrece estas búsquedas/órdenes arbitrarias en una sola consulta de página. Por ello
esta es paginación de transporte y sincronización, con representación de 24 tarjetas;
no promete descargar solo las 24 obras visibles ni memoria constante. Buscar, filtrar,
ordenar o cambiar la página visual no crea consultas nuevas.

La primera carga no está completa hasta confirmar todos los rangos con el servidor.
Los datos de caché se identifican como locales y no habilitan importación/exportación
mientras la carga siga incompleta. Tras confirmar la carga, una desconexión conserva
la última biblioteca con metadatos conservadores; no ofrece persistencia offline al
cerrar la pestaña.

## Exportación e importación

La exportación recorre el servidor desde el principio, independientemente de filtros
y página visible. Lee 501, incorpora las primeras 500 y continúa después de la última
incorporada: el centinela se vuelve a leer, nunca se salta. Cada página exige identidad
actual, origen servidor y ausencia de escrituras pendientes. Un fallo en cualquier
página descarta el resultado; nunca se descarga una copia parcial como completa.
JSON y CSV siguen siendo importables con sus campos completos.

Las páginas no constituyen una transacción ni un snapshot global del mismo instante.
La UI cancela la descarga si observa otra revisión de biblioteca durante la lectura.
Cambios concurrentes detrás de un cursor pueden quedar fuera de una exportación;
debe evitarse editar desde otros dispositivos durante la copia. La fecha de verificación
es observación del cliente, no un certificado de consistencia transaccional.

La previsualización de importación recibe la biblioteca completa. Se conservan IDs
idempotentes por cuenta/archivo/fila y progreso recuperable. Los límites de 60 lecturas
y 120 escrituras por minuto pueden detener una importación grande: conservar archivo,
esperar y volver a seleccionarlo permite continuar sin duplicar filas confirmadas.
No hay importador de fondo ni reintentos sin límite.

## Spark y coste

- Máximo local: 10000 obras, 64 rangos activos y 60 admisiones de lectura por minuto.
  Los límites de 3 aperturas lógicas de biblioteca, 120 escrituras y 10 operaciones
  Auth por minuto se mantienen. Cada listener nuevo, incluidos los de una división,
  consume una admisión de lectura. No se introduce dependencia de servidor.
- Con N documentos estables y P = ceil(N/500), el arranque usa hasta `2P-1` targets
  y aproximadamente `N + 501*(P-1)` documentos recibidos del servidor, más consultas
  vacías/mínimos facturables. Para 5000: 19 targets y aproximadamente 9509 documentos.
  Para 10000: 39 targets y aproximadamente 19519 documentos.
- Exportar cuesta aproximadamente `N + P-1` documentos leídos y P peticiones
  (mínimo una). Una copia de 10000 seguida de exportación consume unas 29538 lecturas
  de documentos, antes de reglas, otras sesiones, reconexiones y cambios.
- Los listeners adicionales consumen por cambios y reconexiones según Firebase.
  Metadatos locales no equivalen a nuevas lecturas facturadas. La memoria y listeners
  crecen con la biblioteca; rangos vaciados no se fusionan automáticamente para evitar
  relecturas inesperadas. Mucha fragmentación puede requerir reapertura manual.
- Los presupuestos son por instancia/pestaña, no un contador diario global ni una
  barrera de seguridad. Los límites oficiales gratuitos de Standard son 50000 lecturas,
  20000 escrituras, 20000 borrados diarios, 1 GiB almacenado y 10 GiB/mes de salida.
  El reinicio diario usa la zona del Pacífico. Varias bibliotecas grandes pueden agotar
  Spark; no se garantiza una cifra de usuarios concurrentes ni disponibilidad diaria.
- `resource-exhausted` pausa nuevas admisiones locales 15 minutos y muestra error.
  Si el error llega a un rango, se cierra la suscripción completa. Si llega a una
  exportación, se descarta la copia, pero los listeners ya abiertos se conservan;
  el presupuesto no limita los cambios que estos reciban. Reintentar no cambia a
  Blaze ni resuelve una cuota diaria agotada.
  El SDK puede aplicar su propio backoff de transporte antes de notificar un error;
  no se añade un bucle de reconexión de aplicación.
- Las reglas actuales exigen propietario y límite <=1001; las nuevas consultas de
  501 son compatibles sin desplegar reglas o índices. No se habilitan TTL, backups,
  Functions, Run, Storage, Extensions, App Hosting ni billing.

Fuentes oficiales revisadas el 18/10/2026:
[cursores](https://firebase.google.com/docs/firestore/query-data/query-cursors),
[cuotas Standard](https://firebase.google.com/docs/firestore/quotas),
[coste de listeners y reglas](https://firebase.google.com/docs/firestore/pricing).
El emulador valida funcionalidad y reglas; no reproduce facturación ni cuotas Spark.

## Aceptación pendiente

Revisar coste del índice completo y límites 10000/64, junto con evidencia de pruebas
en `verification-cursors-2026-10-18.md` y la [validación de 10000 obras](verification-10000-2026-10-19.md).
Una búsqueda remota que solo descargue la
página visible requeriría cambiar semántica de búsqueda/orden o mantener otro índice;
no se introduce un servicio de pago para resolverla. Fusión, publicación y operación
real requieren autorización independiente.
