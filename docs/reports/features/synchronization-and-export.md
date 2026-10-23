# Sincronización y exportación comprobada

::: info Lectura de versión — ML-05, 23/10/2026
Referencia contrastada con el código actual: 5001 documentos por consulta, 5000 útiles.
Los resultados de pruebas siguientes son históricos, no nuevas ejecuciones de ML-04/05.
El contrato actual está en [importación/exportación](/reference/import-export).
Véase [estado y evidencias](/maintenance/documentation-audit).
:::

Continuación H6 sobre `7bf1d41`. No cambia servicios, reglas, esquema remoto ni plan.
Se utiliza Firestore Standard en Spark y no se publica ningún cambio.

## Qué significa el estado mostrado

La suscripción solicita `includeMetadataChanges` y conserva por separado si recibió
una instantánea, si viene de caché y si contiene escrituras locales pendientes.
La UI distingue espera inicial, datos locales, cambios pendientes y última instantánea
recibida del servidor sin cambios locales pendientes. También se cuentan las operaciones locales en curso por cuenta, incluidas eliminaciones
que ya no aparezcan en la lista. Reiniciar el listener no pierde ese seguimiento;
las operaciones de otra cuenta no se muestran como pendientes de la actual.
Los eventos que solo cambian
metadatos actualizan ese estado aunque los documentos sean iguales, según el
[contrato de listeners](https://firebase.google.com/docs/firestore/query-data/listen).

«Última instantánea recibida» describe una observación pasada: no asegura conexión
actual, una detección instantánea de desconexión ni ausencia de cambios en otros clientes.
No se utiliza `navigator.onLine` para certificar el estado del servidor.
Una caché vacía no basta para anunciar que la biblioteca está vacía.

Los errores del listener siguen separados de conflictos o fallos de edición. Al cambiar
de cuenta, desuscribir o reiniciar se restablecen los metadatos, y los callbacks antiguos
no pueden modificar el estado de una sesión nueva.

## Cómo se obtiene una copia

La descarga de la UI recorre de nuevo el servidor con `getDocsFromServer`, cursores
por ID y límite de 5001 documentos por página, sin usar la lista en memoria. Comprueba:

1. La cuenta actual antes y después de cada página, y de nuevo antes de descargar.
2. Que la biblioteca no exceda el presupuesto de 10000 obras: no entrega un subconjunto.
3. Que `fromCache` sea explícitamente `false` y `hasPendingWrites` sea explícitamente `false`.
4. Que no haya cambios locales pendientes, otra revisión observada de biblioteca ni fallo de sincronización al descargar.

Si faltan metadatos, hay cambios pendientes, se agota la cuota, cambia la cuenta o
falla la lectura, no se genera una descarga. No existe fallback silencioso a caché.
Solo puede haber una solicitud de exportación en curso en la vista; los clics repetidos
no abren nuevas lecturas. Tampoco se permite comenzar una importación durante esa lectura.

La copia representa las obras devueltas por esa lectura. No garantiza incluir escrituras
que aparezcan después o que aún estén pendientes en otro dispositivo. No es un backup de
Authentication, ajustes, marcador de borrado ni todos los recursos de Firebase.

## Formatos y compatibilidad

La descarga JSON utiliza ahora un contenedor con `formatVersion: 2`, `verification`
y `mangas`. `verification` incluye `source: server`, `hasPendingWrites: false` y
`observedAtClient`: la hora del reloj del cliente al recibir la respuesta. Esa fecha
puede estar desviada; no es la hora firmada de una transacción ni una certificación.
No se añade UID, email ni tokens a la procedencia.

CSV añade `exportSource` y `exportObservedAtClient` en cada fila de datos.
Los nombres de ambas descargas empiezan por `mangalist-server-` y contienen la fecha
de creación del archivo. Un CSV vacío solo tiene cabeceras y la fecha del nombre;
JSON conserva también los metadatos completos cuando no hay obras.

El importador de MangaList acepta el contenedor JSON y las columnas adicionales de CSV.
Los serializadores puros mantienen la salida anterior si se llaman sin `verification`;
no deben confundirse con una copia verificada. Consumidores externos que esperaban un
array JSON en la raíz deben leer ahora `mangas` cuando usen las descargas de la UI.
La procedencia es información descriptiva, no un mecanismo antifalsificación del fichero.

## Red, persistencia y cuotas

Cada descarga admitida consume una admisión de lectura por página, además de los
listeners existentes. Las consultas usan cursores ID y límite 5001; incorporan hasta
5000 obras y continúan hasta completar la biblioteca. Pueden consumir lecturas de
reglas y mínimos por consulta vacía. Un fallo no revierte lecturas ya consumidas.
El diseño, coste y límite local de 10000 obras se detallan en
[cursores Firestore 1.0](../firestore/firestore-cursors-v1.md). Las páginas son lecturas sucesivas,
no una transacción global; evitar cambios concurrentes durante la copia.
Los errores de cuota activan la pausa local existente y no reintentan en un bucle propio.

Solicitar metadatos no añade otra suscripción ni un polling. Las lecturas por cambios y
reconexiones del SDK siguen sujetas a las cuotas. Los presupuestos de pestaña no ofrecen
una garantía global contra abuso o agotamiento.

El proyecto sigue usando caché de documentos en memoria, coherente con las
[opciones web de persistencia](https://firebase.google.com/docs/firestore/manage-data/enable-offline); no se activa persistencia
de Firestore en disco. Poder seguir viendo datos de una pestaña no garantiza que estén
disponibles después de recargar, cerrar o cambiar de cuenta. Las escrituras pendientes
no son guardados confirmados: este trabajo no añade una cola durable ni recuperación
de todos los formularios. No se promete exportar sin conexión una copia del servidor.
Los cambios pendientes en otros dispositivos no se pueden detectar desde esta pestaña.

## Verificación

Las pruebas cubren procedencia JSON/CSV y reimportación, eventos de metadatos,
callbacks de sesiones anteriores, rechazo de copias locales/pendientes, tamaño excesivo,
lecturas fallidas, cuotas, cambios de cuenta y clics concurrentes.
El emulador Standard verifica una lectura real con metadatos y datos actualizados,
además de rechazar acceso desde otra cuenta. Chromium comprueba la descarga verificada,
el rechazo sin red sin crear un archivo y la recuperación al volver la conexión.

La recuperación opcional de borradores y el aviso PWA se describen en [borradores y actualizaciones](drafts-and-pwa-updates.md). Siguen pendientes
las pruebas de dispositivos/otros navegadores y las decisiones operativas del roadmap.

La prueba de desconexión bloquea expresamente el sondeo WebChannel a
`www.google.com/images/cleardot.gif`; no lo permite salir del navegador. El resto de
peticiones externas se abortan y hacen fallar el control global de aislamiento.
