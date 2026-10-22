# Diagramas técnicos

Una lectura visual del código de MangaList 1.0: interfaz, datos y operaciones.
Cada figura es un **SVG original**, disponible sin JavaScript ni servicios externos.
Las flechas indican pasos o dependencias; las condiciones del texto forman parte del contrato.
Puedes abrir cada SVG a tamaño completo. El resumen contiguo ofrece su equivalente textual.

::: info Alcance auditado · 22/10/2026
Base `aee70706fbd638e164a7df16f75b1bee2a2d24c9` de `main`, actualizada desde
GitHub. ML-02 **sí está fusionado**: [PR #15](https://github.com/ShadowStudioEnterprise/manga-list/pull/15),
commit de diseño `163a098`. Se conserva su tema VitePress.

**Implementado** significa comprobado en esas fuentes, no certificado en producción.
La [sincronización ML-07](/roadmap/) cuenta con un registro histórico de publicación;
la versión efectiva de cliente, reglas y configuración remotas no se ha consultado en ML-03.
Los recuadros discontinuos identifican el procedimiento **propuesto, sin activar**.
ML-03 no despliega ni lee Firebase remoto o bibliotecas reales.
:::

## Componentes y servicios

<figure class="ml-diagram">
  <img src="/diagrams/components.svg" alt="Capas: Vue y Quasar, estado Pinia, servicios cliente y SDK Firebase; PWA y VitePress se distribuyen por separado." />
  <figcaption>01 · Dependencias del cliente y distribución. <a href="/diagrams/components.svg">Abrir SVG de componentes</a>.</figcaption>
</figure>

La interfaz Vue/Quasar usa Router y los almacenes Pinia. El estado y los servicios
se comunican mediante acciones y observadores: Auth publica cambios de sesión;
la biblioteca publica obras y metadatos. Los servicios usan los SDK de Auth y
Firestore, inicializados en `src/boot/firebase.js`. El guardia de rutas espera
la inicialización de sesión.

La PWA y el portal VitePress son artefactos estáticos independientes. El portal
no usa el estado privado de la aplicación ni inicia el SDK Firebase. No hay
Functions, SSR ni trabajadores de servidor que ejecuten estas operaciones.

**Fuentes:** [organización del código](/architecture/overview),
[Router](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/router/index.js),
[almacén Auth](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/stores/auth-store.js).

## Datos y aislamiento UID

<figure class="ml-diagram">
  <img src="/diagrams/data.svg" alt="El UID del token debe coincidir con users/uid. El documento de cuenta contiene timestamps y status opcional; mangas es una subcolección del mismo propietario." />
  <figcaption>02 · Modelo y barrera de acceso. <a href="/diagrams/data.svg">Abrir SVG de datos</a>.</figcaption>
</figure>

1. La regla exige sesión y coincidencia exacta entre `request.auth.uid` y el UID
   de la ruta. Otro UID y las rutas no declaradas quedan denegados.
2. `users/{uid}` contiene `createdAt`, `updatedAt` y opcionalmente
   `status: deleting`. No es un perfil de soporte ni contiene `completedAt`.
3. `users/{uid}/mangas/{id}` contiene los 13 campos representados.
   `sources` es una lista de mapas con `id`, `name`, `url`, `isPrimary`;
   `genres` es una lista de textos. No son colecciones compartidas.
4. Las reglas validan campos, tipos, tamaños y timestamps de escritura.
   El marcador impide crear o actualizar mangas mediante `getAfter`,
   incluso en el lote que inicia la eliminación. El cliente no puede modificar
   ni retirar un marcador ya establecido.
5. Un contexto del propietario todavía aceptado puede leer y borrar mangas
   pendientes. El marcador no equivale a revocar tokens. Las herramientas
   administrativas omiten las reglas; no existe un rol de soporte en ellas.

**Fuentes:** [modelo Firestore](/database/firestore),
[reglas versionadas](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/firestore.rules),
[auditoría de eliminación](/reports/accounts/ml-12-interrupted-deletion).

## Autenticación

<figure class="ml-diagram">
  <img src="/diagrams/auth.svg" alt="Inicializar Firebase y restaurar sesión; acceder por correo o Google; observar Auth, suscribir por UID y comprobar rutas privadas." />
  <figcaption>03 · Restauración de sesión y acceso. <a href="/diagrams/auth.svg">Abrir SVG de autenticación</a>.</figcaption>
</figure>

La inicialización valida la configuración y elige persistencia local de Auth con
alternativa en memoria. `onAuthStateChanged` resuelve el primer estado y notifica
los posteriores. Las pantallas ofrecen correo/contraseña, registro, popup Google
y envío del correo de recuperación por el SDK. Su disponibilidad remota y OAuth
real no se verifican aquí.

El almacén serializa el usuario; al recibir un UID distinto suscribe esa biblioteca
y al no recibir usuario la desuscribe. Cambiar o cerrar sesión limpia borradores
del navegador actual. El guardia redirige una ruta privada sin sesión a
`/login`, preservando el destino según la ruta; una ruta `guestOnly` con sesión
redirige a `/library`. Un error de inicialización impide entrar en rutas privadas.
La autorización de datos sigue correspondiendo a las reglas.

**Fuentes:** [auth-service](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/services/auth-service.js),
[Router](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/router/index.js).

## Sincronización entre pestañas y dispositivos

<figure class="ml-diagram">
  <img src="/diagrams/sync.svg" alt="Una pestaña posee el Web Lock y recibe Firestore; otras reciben snapshots por BroadcastChannel. Cada dispositivo mantiene su propia coordinación." />
  <figcaption>04 · Coordinación por origen, proyecto y UID. <a href="/diagrams/sync.svg">Abrir SVG de sincronización</a>.</figcaption>
</figure>

Dentro del mismo origen, la clave combina proyecto y ruta de biblioteca por UID.
Web Locks elige una pestaña propietaria de la **suscripción lógica**, que puede
contener varios listeners de rangos. Las seguidoras piden el último snapshot con
`hello` y reciben `data` y metadatos por BroadcastChannel. Sin esas API, cada
pestaña abre su propia suscripción.

La propietaria envía latidos cada 5 segundos. Una seguidora con datos que lleva más
de 15 segundos sin recibir señales los marca como obsoletos
(`fromCache: true`, `coordinationStale: true`); no roba el lock ni abre otro
listener para recuperarse. Cerrar o detener la propietaria libera el lock para
una sucesora. Las épocas impiden que mensajes antiguos sustituyan datos nuevos.
Un fallo terminal cierra la coordinación; un código de cuota conserva una pausa
de 15 minutos. Recuperarse requiere respetar el estado y el presupuesto del cliente.

Las obras solo cruzan pestañas en memoria. LocalStorage conserva época y datos
mínimos de fallo, no la biblioteca; la persistencia de Auth es independiente.
Cada dispositivo mantiene sus propios listeners y recibe cambios desde Firestore:
BroadcastChannel no enlaza dispositivos. Cambios de UID y cierre de sesión
limpian suscripciones y estado. No se promete sincronización sin conexión.

**Fuentes:** [shared-library](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/services/shared-library.js),
[ensayos y límites ML-07](/reports/firestore/ml-07-sync-2026-10-20).

## Carga y paginación

<figure class="ml-diagram">
  <img src="/diagrams/loading.svg" alt="Listeners por rangos de ID, con 5000 documentos más centinela; reunir rangos, filtrar y ordenar en memoria y mostrar páginas de 24 tarjetas." />
  <figcaption>05 · Transporte y presentación. <a href="/diagrams/loading.svg">Abrir SVG de carga</a>.</figcaption>
</figure>

La consulta ordena por ID y limita cada rango a 5001 documentos. Si aparece el
centinela, espera confirmación de servidor sin escrituras pendientes, cierra el
rango padre y lo divide en rangos disjuntos. Abre subárboles escalonadamente;
no publica un subárbol parcial mientras completa la división. Los metadatos
permiten distinguir datos de caché, escrituras pendientes y confirmación.

El tope del cliente es **10000 obras y 64 rangos**, provisional; un exceso o
fallo cierra los listeners y comunica un error. Las reglas del repositorio limitan
cada consulta a 5001; no fijan una cuota diaria ni el número global de obras.

Pinia filtra y ordena globalmente la biblioteca en memoria. Después
`useLibraryPagination` selecciona 24 tarjetas por página; navegar páginas no
hace una nueva consulta. Cambiar filtros reinicia la página y reducir resultados
ajusta la página al máximo válido.

**Fuentes:** [library-cursors](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/services/library-cursors.js),
[paginación](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/composables/use-library-pagination.js),
[capacidad y reservas provisionales](/reports/firestore/ml-08-capacity-2026-10-21).

## Importación recuperable

<figure class="ml-diagram">
  <img src="/diagrams/import.svg" alt="Archivo a previsualización validada, selección ligada al UID e identidad estable por fila; transacciones crean solo IDs ausentes y permiten reintentos." />
  <figcaption>06 · Importación sin sobrescribir un ID ya importado. <a href="/diagrams/import.svg">Abrir SVG de importación</a>.</figcaption>
</figure>

El cliente analiza JSON, CSV o TXT, normaliza campos, valida y detecta duplicados
por nombre normalizado en la biblioteca y el archivo. La persona selecciona las
filas; los errores siempre se excluyen y los duplicados pueden seleccionarse
explícitamente.

El hash de UID, formato y texto exacto del archivo, junto con el número de fila,
forma un ID estable. Cada transacción comprueba ese ID: si ya existe no escribe;
si falta lo crea con timestamps del servidor. La importación ordinaria ejecuta
grupos de hasta 8 operaciones concurrentes y registra resultados individuales.
Un cambio de UID, cuota o presupuesto detiene el avance. No es un lote atómico
de todo el archivo: puede haber éxito parcial. Releer el mismo archivo con el
mismo UID permite reconocer y omitir filas ya aplicadas sin sobrescribir ediciones.
Cambiar el texto del archivo cambia su identidad.

**Fuentes:** [import-service](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/services/import-service.js),
[flujo de pantalla](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/pages/ImportExportPage.vue),
[recuperación](/reports/features/import-recovery).

## Exportación y copia dividida

<figure class="ml-diagram">
  <img src="/diagrams/export.svg" alt="Comprobar estado, leer páginas del servidor y validar UID, metadatos y revisión local antes de descargar JSON, CSV o partes con manifiesto." />
  <figcaption>07 · Descargar y restaurar son acciones explícitas. <a href="/diagrams/export.svg">Abrir SVG de exportación</a>.</figcaption>
</figure>

La pantalla bloquea exportaciones mientras carga, hay errores o escrituras
pendientes. Guarda la revisión local y pide al servidor páginas ordenadas por ID;
comprobar la sesión antes y después de cada lectura evita mezclar cuentas.
El centinela no se salta: el siguiente cursor parte del último documento
consumido. Si falla una página, supera 10000 o aparecen metadatos no confirmados,
no entrega una copia truncada ni usa caché como alternativa.

Antes de descargar vuelve a comprobar UID, estado y revisión local.
JSON v2 conserva procedencia y fecha observada por el cliente; CSV agrega
procedencia y neutraliza prefijos de fórmula. **No es una instantánea transaccional
global** entre páginas ni un reloj del servidor.

La copia dividida sella un plan en memoria a partir de una lectura, genera partes
y manifiesto con hashes y permite descargarlos sin releer Firestore por parte.
Para restaurar verifica el conjunto, integridad, cuenta actual y estado de
biblioteca; utiliza IDs estables, grupos de hasta 8 y pausa/reanudación según
presupuesto. Los archivos deben seleccionarse de nuevo tras perder el plan.
Los hashes detectan cambios respecto al manifiesto, no autentican a su autor.

**Fuentes:** [cursores y exportación](/reports/features/synchronization-and-export),
[copia dividida](/reports/features/multipart-backup-2026-10-21),
[multipart-backup](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/services/multipart-backup.js).

## Eliminación ordinaria de cuentas

<figure class="ml-diagram">
  <img src="/diagrams/deletion.svg" alt="Reautenticar, marcar deleting, borrar mangas por lotes y solo tras una consulta vacía borrar Auth. Fallos conservan marcador y requieren reintento." />
  <figcaption>08 · El camino de error vuelve a la limpieza; no avanza a Auth. <a href="/diagrams/deletion.svg">Abrir SVG de eliminación</a>.</figcaption>
</figure>

1. Ajustes confirma la operación, el servicio reautentica y comprueba la sesión.
   El store desuscribe la biblioteca al iniciar el intento.
2. Una transacción crea o conserva `users/{uid}` con `status: deleting`.
3. Lee mangas del servidor en lotes de 400 y los borra; permite 5 lotes,
   hasta 2000 obras por intento. Una consulta adicional comprueba si está vacío.
   Si todavía quedan mangas, devuelve error de presupuesto y exige reintento.
4. **Solo tras confirmar vacío** ejecuta `deleteUser`. Un fallo de lectura,
   lote, sesión, cuota o Auth conserva el marcador; el store intenta volver a
   suscribir la biblioteca para mostrar su estado. No hay trabajador de fondo.
5. Tras éxito limpia borradores y ajustes del navegador actual. El marcador se
   conserva: no acredita borrado de descargas u otros dispositivos.

La limpieza ordinaria solo recorre `mangas`; no descubre descendientes
desconocidos, copias externas ni registros del proveedor. El marcador carece de
fecha de finalización, y su `updatedAt` no prueba que todo haya terminado.
Un contexto aún aceptado puede leer y borrar pendientes, pero no recrear mangas.

**Fuentes:** [account-service](https://github.com/ShadowStudioEnterprise/manga-list/blob/aee70706fbd638e164a7df16f75b1bee2a2d24c9/src/services/account-service.js),
[asistencia a interrupciones](/reports/accounts/ml-12-interrupted-deletion).

## Revisión manual propuesta

<figure class="ml-diagram">
  <img src="/diagrams/manual.svg" alt="Propuesta sin activar: acreditar identidad, autoridad, inventario y finalización; revisar a las 720 horas; conservar o escalar dudas y solo recomendar una actuación futura." />
  <figcaption>09 · Trazos discontinuos: procedimiento documental pendiente de activación. <a href="/diagrams/manual.svg">Abrir SVG de revisión propuesta</a>.</figcaption>
</figure>

ML-11 acepta D1–D7 como decisiones de diseño; ML-12 prepara asistencia, pero
la **operación real sigue sin activar**. Faltan condiciones de canal privado,
roles independientes, permisos, custodia y revisión jurídica. No hay motor
operativo, calendario automático ni herramienta de retirada conectada al producto.

El procedimiento propone revisar a las 720 horas desde una finalización acreditada,
con un reloj de derechos separado. Exige identidad y autoridad, inventario actual,
estado Auth, condiciones técnicas y excepciones documentadas. Si faltan pruebas,
se conserva o escala; incluso una revisión favorable **solo recomienda** una
actuación futura con autorización separada por caso. Ni la edad del marcador
ni 24 horas justifican su retirada. Retirarlo puede reabrir escrituras para un
contexto todavía aceptado. No se adopta TTL, cron, Functions ni servicios de pago.

**Fuentes:** [procedimiento ML-11](/reports/accounts/ml-11-operating-procedure),
[preparación y pendientes](/reports/accounts/ml-11-activation-pack),
[asistencia ML-12](/reports/accounts/ml-12-interrupted-deletion).

## Verificación y límites

La [evidencia de ML-03](/reports/development/ml-03-diagrams-2026-10-22) registra
base, comprobaciones de compilación, enlaces, SVG, tamaños móviles, contraste
y controles locales Spark. Las pruebas locales no certifican configuración remota,
cuotas facturables ni capacidad definitiva. Los presupuestos de cliente admiten
operaciones; no son una cuota de seguridad global entre dispositivos.

Consulta también [Spark](/security/spark), el [roadmap](/roadmap/) y los informes
fechados para distinguir una propuesta histórica del código integrado.
