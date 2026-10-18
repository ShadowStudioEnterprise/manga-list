# Verificación Spark — 18/10/2026

Base remota comprobada con fetch: `main` = `eb7a38b2f0f9c7807b3c4641817b091b65ff3f50`.
Rama de revisión: `development/spark-guardrails-2026-10-18`.
No se modificaron los archivos sincronizados de `sources/`.

## Evidencia remota de solo lectura

Consulta realizada durante esta sesión y registrada a las 07:05:28 Europe/Madrid.
Se reutilizó la autenticación existente del CLI para tres peticiones GET, sin ejecutar
helpers que habiliten APIs. Se usó el almacén de certificados del sistema; no se desactivó TLS.
No se guardaron tokens ni datos de usuarios.

- Cloud Billing `projects/mangalist-61bb8/billingInfo`: `billingEnabled: false`,
  `billingAccountName` vacío/ausente. No hay cuenta de facturación asociada.
- Firestore `projects/mangalist-61bb8/databases/(default)`: `FIRESTORE_NATIVE`,
  `databaseEdition: STANDARD`, ubicación `eur3`.
- Service Usage: una página completa de APIs habilitadas, sin `nextPageToken`.

APIs habilitadas observadas (dominio `.googleapis.com` en todos los casos):

```text
analyticshub appengine apptopology bigquery bigqueryconnection bigquerydatapolicy
bigquerydatatransfer bigquerymigration bigqueryreservation bigquerystorage
cloudaicompanion cloudapis cloudresourcemanager cloudtrace dataform dataplex datastore
fcm fcmregistrations firebase firebaseappdistribution firebasehosting
firebaseinstallations firebaseremoteconfig firebaseremoteconfigrealtime firebaserules
firestore identitytoolkit logging monitoring pubsub runtimeconfig securetoken
servicemanagement serviceusage sql-component storage-api storage-component storage
telemetry testing
```

Este inventario describe APIs habilitadas, no recursos activos ni consumos. No constituye
un inventario exhaustivo de recursos históricos, IAM, proveedores Auth efectivos ni
utilización de cuotas. El cliente del repositorio usa App/Auth/Firestore y Hosting estático.
No se han deshabilitado APIs ni cambiado IAM o proveedores. El estado de facturación es
puntual, no una garantía frente a futuros cambios administrativos.

## Resultados locales

| Verificación                              | Resultado                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run check:spark`                     | Correcto: inventario/configuración/SDK/workflows compatibles                                                  |
| `npm test`                                | 42/42: regresiones, presupuestos, cuota, listener excesivo, borrado parcial/concurrente, importación detenida |
| `npm run test:rules` en emulador Standard | 13/13: aislamiento, esquema, marcador, concurrencia y límites de listado                                      |
| `npm run test:e2e`                        | 5/5 Chromium: sesión, dos pestañas, importación/exportación, móvil y borrado Auth local                       |
| `npm run lint:check`                      | Correcto                                                                                                      |
| `npm run build` y `npm run build:pwa`     | Correcto con configuración `demo-mangalist`; no despliegan                                                    |
| Validación de evidencia remota simulada   | Rechaza billing activo, cuenta asociada, proyecto equivocado, edición Enterprise y evidencia incompleta       |

Los emuladores usan `demo-mangalist`, Auth 9199 y Firestore 8188 en localhost.
Node 24, Java 23, Firebase CLI 15.32.1 y Chromium local. SPA/PWA muestran el aviso existente
de bundle superior a 500 kB; no es un fallo de compilación. No se actualizaron dependencias
ni lockfiles y la revisión de vulnerabilidades previa continúa pendiente.

El comando remoto de despliegue requiere `gcloud`, ausente en este entorno. Su ejecución
aislada bloquea con salida no cero antes de cualquier despliegue; no se invocó `firebase deploy`.
La lectura remota de esta sesión se hizo mediante clientes GET del CLI existente. No se
declara probado un despliegue real ni una publicación de reglas. Antes de una publicación
autorizada habrá que preparar el `gcloud` de solo lectura y ejecutar de nuevo las comprobaciones.

## Límites pendientes

- Los presupuestos son por pestaña y no impiden abusar directamente de la API. La cuota
  puede agotarse por listeners, reconexiones, varias cuentas, clientes antiguos o reglas.
- No hay garantía de terminar un borrado si el cliente desaparece. Los tests cubren fallo
  parcial y reanudación; no prueban un trabajador independiente, porque no existe.
- El marcador conserva UID/fechas. El titular debe decidir retención y asistencia manual.
- Las nuevas reglas requieren consultas acotadas: los clientes antiguos necesitan actualizarse.
- La capacidad visible inicial de 1000 obras es una decisión pendiente de aceptación;
  no se presenta una exportación parcial como completa.
- Protección de main, IAM, App Check y cualquier modificación remota requieren autorización
  independiente. Este trabajo no fusiona, despliega ni modifica cuentas/datos de producción.

Consultar [política y operación](spark-only.md) y [roadmap](roadmap.md).

## Continuación de la revisión del PR #2

El commit inicial `1a6fdf6` superó todas las comprobaciones remotas:
[CI del PR](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39099656177)
y [CI de la rama](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39099608485).
Incluyen compatibilidad Spark, formato/lint, tests, reglas, E2E y compilaciones SPA/PWA.

La revisión posterior cerró una omisión del análisis estático: ahora reconoce imports sin
`from`, reexports, importaciones dinámicas literales, CommonJS y accesos directos a
`@firebase/*`. Examina también `src-pwa` y extensiones JS/TS habituales, omitiendo
`node_modules`. El inventario de dependencias recorre JSON y las rutas transitivas de
ambos lockfiles, en lugar de depender de nombres solo en el manifiesto raíz.
Los scripts `.mjs` quedan incluidos en formato y ESLint de CI.

Se añadieron dos pruebas de regresión del detector y una prueba en Firestore Standard que
interrumpe el borrado después de 400 obras y crea un cliente nuevo, sin transferir estado
local: el marcador sigue bloqueando escrituras y retirada, queda una obra y el cliente nuevo
puede finalizar la limpieza. Esto prueba reanudación desde servidor cuando vuelve un cliente;
no implica finalización automática si nadie vuelve.

Resultado local de esta continuación: 32 tests y 11 pruebas de reglas correctos,
compatibilidad Spark, formato, ESLint y diff sin errores. No cambian el cliente de la app
ni las reglas; los cinco E2E y compilaciones están respaldados por el CI inicial.
El nuevo commit debe volver a superar el CI antes de considerarlo validado remotamente.

## Revisión de dependencias posterior

El estado anterior de dependencias pendientes queda actualizado por la
[revisión H8](dependencies-2026-10-18.md): ambos lockfiles tienen cero avisos conocidos
reportados por npm después de correcciones seleccionadas. CI incorpora una auditoría
que bloquea ante nuevos avisos o fallo del registro. Se mantienen las limitaciones
Spark, los avisos de mantenimiento transitivo y la necesidad de revisión continua.

## Recuperación de importaciones H5

Se añade [importación recuperable](import-recovery.md) sin nuevas rutas, campos ni servicios:
IDs estables por cuenta/texto/formato/fila y transacciones que no sobrescriben una obra
existente. La vista previa reconoce IDs ya guardados al volver a seleccionar el archivo.
No se almacena el archivo ni se prometen importaciones en segundo plano.

Regresiones actuales: 37/37 correctas. Reglas en emulador Standard: 12/12 correctas,
incluyendo commit real con respuesta perdida, cliente nuevo, concurrencia por fila,
aislamiento entre cuentas y marcador de borrado. Los cinco flujos de navegador pasan;
el de importación incluye recarga y reselección del archivo con otro nombre, con la fila
ya importada desactivada. Spark, formato y ESLint correctos. Las compilaciones se
verifican nuevamente con configuración de demostración antes de cerrar el commit.

Esta recuperación solo reconoce IDs del flujo v1 mientras la obra siga existiendo;
archivos modificados, borrados de obras e importaciones antiguas tienen los límites
explicados en el documento. Cada fila añade lectura transaccional y consume presupuesto
local de lectura, además del permiso de escritura. No se garantiza evitar cuotas agotadas.

## Estado de sincronización y exportación H6

Se incorporan [metadatos y copia comprobada](synchronization-and-export.md). El listener
solicita eventos de metadatos y la UI distingue caché, cambios pendientes y última copia
recibida del servidor. Una caché vacía no certifica que la biblioteca esté vacía.

La descarga realiza una lectura acotada de servidor, comprueba cuenta/metadatos/tamaño
antes de descargar y no sustituye un fallo por la lista local. JSON usa un contenedor v2
con `mangas` y procedencia; CSV añade columnas de procedencia. Ambos siguen siendo
reimportables. La hora es del cliente, sin certificación, y la copia solo cubre obras.

Resultados locales: 42 pruebas y 13 pruebas de reglas correctas. Los cinco E2E existentes
pasaron en la suite; el nuevo caso de desconexión/reconexión pasó de forma aislada tras
ajustar la espera de la navegación y la selección del aviso. En ese caso no se descarga
sin red y se obtiene una copia con procedencia al volver la conexión. El sondeo externo
conocido del SDK se aborta expresamente; el resto de destinos externos siguen provocando
fallo de aislamiento. CI volverá a ejecutar los seis escenarios juntos.

Spark, formato y ESLint correctos. Se repiten las compilaciones con configuración demo.
No se cambia la persistencia de Firestore ni se promete conservar datos/formularios después
de cerrar o recargar. La consulta adicional consume cuota y sigue sujeta a los límites de Spark.

Se refuerza además el seguimiento de operaciones en curso por UID, manteniéndolo al
reiniciar el listener de la misma cuenta. La regresión comprueba que una eliminación
aún no resuelta bloquea la confirmación aunque los metadatos de la consulta no marquen
cambios, sin trasladar ese estado a otra cuenta. La batería actual suma 42 pruebas.

## Borradores y actualización PWA H6–H7

Se añaden [borradores opcionales y aviso pasivo](drafts-and-pwa-updates.md), sin escrituras remotas ni nuevos servicios. La recuperación conserva la base original para detectar conflictos. La PWA espera al cierre de todos los clientes y nunca fuerza recarga desde la aplicación. La prueba del worker compilado utiliza solo un servidor local y dos revisiones simuladas; no es validación en producción ni sustituye dispositivos reales.

Resultados locales de esta continuación: 48/48 regresiones, 7/7 recorridos Chromium con emuladores y compilaciones SPA/PWA demo correctos. La prueba local de actualización del worker pasa con dos pestañas; CI vuelve a ejecutar reglas y auditorías, además del nuevo ciclo PWA. Permanecen el aviso de bundle grande, la validación de otros navegadores/dispositivos y las decisiones operativas ya indicadas.

## Primera revisión H3: accesibilidad y pantallas pequeñas

Se incorporan [correcciones de encabezados, foco, navegación y contraste](accessibility-2026-10-18.md), con axe solo en desarrollo. Se auditan cinco estados a 320 píxeles CSS y la biblioteca también a 768 y 1280; otra prueba recorre registro, salto, navegación y diálogo de capítulo con teclado. Los informes completos, incluidos resultados que requieren revisión humana, se conservan siete días en los artefactos de CI. No es una certificación WCAG ni prueba con lectores de pantalla o dispositivos reales. Se mantiene documentada la revisión pendiente del aviso de ResizeObserver en redimensionamiento continuo.

Resultados locales H3: 48 regresiones y 9 recorridos Chromium correctos; siete informes de axe sin infracciones detectadas, con resultados de contraste incompletos conservados para revisión humana. Auditoría npm sin avisos conocidos en ambos árboles. Las compilaciones SPA/PWA demo y la prueba del ciclo de actualización terminan correctamente; permanece el aviso de bundle grande.

## Escala H6: biblioteca por páginas

Se añade [representación acotada a 24 tarjetas](library-scale-2026-10-18.md) tras medir 100 y 1000 obras sintéticas. Conserva todos los filtros y el orden antes de paginar, mantiene los límites y consultas Spark y no cambia reglas remotas. Las regresiones recorren todos los registros, verifican exportación completa tras filtrar y comprueban que la paginación no añade objetivos al listener existente. Las medidas de DOM/heap/tiempos son muestras locales, sin garantía de memoria, latencia ni ahorro de cuotas.

Resultados locales H6: 51 regresiones y 11 recorridos Chromium correctos, incluidos los dos tamaños sintéticos. La navegación no añade objetivos al listener, los filtros se aplican a toda la biblioteca y la exportación contiene todas las obras con la edición confirmada. La auditoría de paginación a 320 píxeles pasa sin infracciones detectadas y conserva su informe completo para revisión humana. Spark, formato y ESLint correctos; compilaciones SPA/PWA demo y ciclo de actualización PWA correctos, con el aviso de bundle grande ya documentado.

## Trazabilidad H4 y recuperación compatible

Se añaden [sellos de compilación, inventarios y procedimiento de recuperación](releases-and-recovery.md). La versión copiada solo contiene campos públicos de build. El verificador rechaza artefactos alterados, fuente/proyecto distintos, contratos desconocidos y árboles modificados; la única excepción de desarrollo se limita a demo. Hosting exige la comprobación como último hook local. Las pruebas no ejecutan despliegue ni rollback, no alteran reglas remotas y no certifican el estado de producción.

Resultados locales H4: 56/56 regresiones, 13/13 pruebas de reglas y 12/12 recorridos Chromium correctos. Ajustes pasa la revisión de ancho y contraste a 320 píxeles; copiar la versión excluye datos de cuenta y comunica el fallo del portapapeles. Se comprueban inventarios alterados, archivos extra o ausentes, enlaces simbólicos, entradas especiales y la negativa a aceptar proyectos o revisiones incorrectos. Los inventarios SHA-256 comprueban coherencia; no son firmas ni pruebas de procedencia confiable.

## Matriz H3: Firefox

Se añaden nueve recorridos Firefox a los doce Chromium en CI, con las mismas aserciones,
datos sintéticos y bloqueo de peticiones externas. La [matriz y evidencia local](browser-coverage-2026-10-18.md)
detalla el fallo inicial de la suposición de retorno circular del foco, la repetición correcta
del teclado en ambos motores y el aviso de Vue Router pendiente de revisión. CDP, permisos
de portapapeles y ciclo PWA conservan su alcance Chromium. No se añaden servicios ni se
modifican cuentas, reglas o configuración de producción.

## Historial: causa del aviso y regresión de navegación

La [reproducción específica en Firefox](navigation-history-2026-10-18.md) muestra que un
`goto` de prueba redundante sobre la ruta actual dejaba `history.state` en `null`. Se retira
y se rechaza `VUE_ROUTER_R0121` en todas las páginas de la suite portátil. Dos escenarios
nuevos comprueban cancelación con Escape sin guardar el capítulo, foco, Atrás/Adelante y
recarga. Resultado local: 23/23 recorridos (13 Chromium y 10 Firefox), Spark, formato y
ESLint correctos. No se cambia el router de la aplicación ni se silencia el aviso.

## ResizeObserver: transición de cabecera y captura de errores

La [reproducción y el control negativo](live-resize-2026-10-18.md) identifican el cambio de
altura mínima de barra al cruzar 599/600 píxeles. La barra mantiene ahora 68 píxeles en móvil
y escritorio; se retira el cálculo de página móvil basado en 60. La suite portátil captura
el evento de error ResizeObserver además de las excepciones y lo rechaza. Reintroducir
temporalmente el CSS anterior dentro del ensayo Chromium produce siete errores y falla la
comprobación; se retira la inyección antes del cambio final.

Se añaden transiciones sobre biblioteca y formulario con campos sin guardar en ambos motores,
sin recargar entre anchos. La matriz pasa a 25 recorridos. Dispositivos, zoom del sistema y
arrastre continuo siguen fuera de esta comprobación. No se modifican SDK, reglas, cuotas,
servicios, facturación ni producción.

## H1: recuperación de credenciales en emuladores

La [prueba de recuperación](password-recovery-emulator.md) solicita el enlace desde la app,
confirma el código por REST local y comprueba códigos inválidos/reutilizados, rechazo de
contraseña anterior, acceso con la nueva y biblioteca conservada tras recarga. La repetición
dirigida pasa 2/2 en Chromium y Firefox; se aborta y contabiliza el sondeo WebChannel exacto
identificado en el primer ensayo, manteniendo el rechazo de cualquier otra petición externa.
La matriz pasa a 27 casos. No se envía correo real ni se valida la página alojada o la
revocación de otras sesiones. H1 operativo sigue pendiente de autorización y aceptación.
