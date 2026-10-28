# Contratos internos de servicios

Revisión ML-04, 23/10/2026. Código base: `a6627d0` de main, con ML-02 y ML-03
integrados. Son módulos del cliente, sin API HTTP pública, SDK externo, endpoints
ni garantía de compatibilidad pública. Las firmas siguientes existen en el código;
el inventario completo y sus huellas están en `docs/maintenance/contracts.json`.
Consulta también [estado y evidencias](/maintenance/documentation-audit).

## Obras y lecturas Firestore

Fuente: `src/services/manga-service.js`. Todas las rutas son relativas a la base
configurada por `src/boot/firebase.js`. UID e ID deben ser texto no vacío sin `/`;
la comprobación del cliente no sustituye las reglas de propietario.

| Símbolo y entrada                                           | Resultado y efectos                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `getMangaCollection(uid)`                                   | Referencia a `users/{uid}/mangas`; requiere Firebase configurado                                                                |
| `serializeMangaForCreate(input = {})`                       | Objeto de esquema 1 sin ID ni timestamps; valida y normaliza los campos                                                         |
| `serializeMangaForUpdate(input = {})`                       | Patch de campos admitidos presentes; rechaza un patch vacío                                                                     |
| `deserializeManga(snapshot)`                                | `{ id, ...data, createdAt, updatedAt }`; convierte timestamps con `toDate()` cuando existe                                      |
| `normalizeMangaName(name)`                                  | Alias de normalización de título, sin consulta                                                                                  |
| `subscribeToMangas(uid, onData, onError)`                   | Abre coordinación/rangos y devuelve cancelador; entrega obras y metadatos, no una promesa                                       |
| `fetchLibraryForExport(uid)`                                | Promesa de `{ mangas, verification }`; lectura completa desde servidor con comprobaciones de sesión                             |
| `getManga(uid, mangaId)`                                    | `getDoc` puntual, obra o `null`; no exige origen servidor como una exportación                                                  |
| `findMangasByNormalizedName(uid, name)`                     | `where('normalizedName', '==', ...)`, `limit(10)`, `getDocs`; array, vacío si no hay nombre normalizable; no garantiza unicidad |
| `createManga(uid, input, { importDocumentId } = {})`        | Devuelve ID. Alta normal con `addDoc`; alta recuperable con transacción create-if-absent                                        |
| `updateManga(uid, mangaId, input, { expectedValues } = {})` | Devuelve ID. Con valores esperados usa transacción y detecta conflicto en campos modificados; sin ellos usa `updateDoc`         |
| `deleteManga(uid, mangaId)`                                 | Promesa sin valor; `deleteDoc`                                                                                                  |
| `calculateNextChapter(chapter, direction)`                  | Texto del próximo capítulo; requiere edición manual si no se puede ajustar                                                      |
| `changeMangaChapter(uid, mangaId, direction)`               | Lee y actualiza capítulo transaccionalmente; devuelve texto                                                                     |

Los serializadores admiten compatibilidad `status`, `url` y `sourceName` de entrada.
Crean `schemaVersion: 1`, nombre y nombre normalizado, capítulo textual, tipo,
géneros, estados de lectura/publicación, fuentes, notas y favorito. Los valores
predeterminados y tamaños proceden de `src/constants/manga-options.js`: nombre 200,
capítulo 64, notas 5000, hasta 20 géneros de 60 y 10 fuentes; ID/nombre de fuente
100 y URL HTTP(S) 2048. Las reglas limitan además `normalizedName` a 250.
No se afirma que el serializador y las reglas acepten exactamente todas las mismas
entradas: las reglas son la validación final. Las altas añaden `createdAt` y
`updatedAt` del servidor; las actualizaciones conservan creación y renuevan modificación.

Cada escritura consume una admisión local. Las transacciones de obra consumen una
admisión de lectura por intento, con hasta tres intentos SDK. El ID recuperable
debe cumplir `import-v1-<64 hex>-<fila positiva de hasta 7 dígitos>`. Si ya existe,
la transacción termina sin sobrescribirlo y devuelve el ID; éxito no significa
necesariamente que se haya creado un documento nuevo.

## Inventario de acceso y reglas

| Consumidor                        | Ruta leída                | Operación/límite                     | Confirmación                                                         |
| --------------------------------- | ------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Biblioteca                        | `users/{uid}/mangas`      | Rangos por ID, `onSnapshot`, 5001    | Metadatos; todas las hojas confirmadas para completar carga inicial  |
| Exportación                       | Misma colección           | `getDocsFromServer`, 5001 por página | Servidor y sin escrituras pendientes en cada página                  |
| Detalle                           | `users/{uid}/mangas/{id}` | `getDoc`                             | Puede usar comportamiento de caché SDK                               |
| Duplicados                        | Colección de obras        | Igualdad de nombre normalizado, 10   | No certifica servidor ni exclusividad                                |
| Edición/capítulo/alta recuperable | Documento de obra         | `transaction.get`                    | Transacción, hasta 3 intentos                                        |
| Inicio de borrado                 | `users/{uid}`             | `transaction.get` y marcador         | Hasta 3 intentos; este callback no llama a `take('read')`            |
| Borrado de biblioteca             | Colección de obras        | `getDocsFromServer`, 400             | Consulta final vacía antes de borrar Auth                            |
| Evaluación de reglas              | `users/{uid}`             | `exists`, `get`, `getAfter`          | Puede añadir lecturas de reglas; no es llamada explícita del cliente |

`firestore.rules` permite get/delete de obras al propietario, list con límite
explícito <=5001, altas/actualizaciones de forma válida y timestamps de servidor.
`status: deleting` bloquea altas y actualizaciones incluso en un batch que intente
crear el marcador y escribir obras. No impone 10000 obras por cuenta ni cuota diaria.
El repositorio no declara un archivo de índices personalizados en `firebase.json`;
no se inventa un `firestore.indexes.json` ni se certifican índices remotos.

## Autenticación y arranque

Fuente: `src/services/auth-service.js`, `src/boot/firebase.js` y
`src/router/index.js`. Se requieren seis variables Firebase; falta de configuración
produce `app/firebase-not-configured`. Auth usa persistencia local del navegador
con fallback a memoria; Firestore mantiene caché en memoria, sin activar IndexedDB.
Los emuladores solo se conectan con modo desarrollo, flag válido y proyecto `demo-`;
Auth usa 127.0.0.1:9199 y Firestore 127.0.0.1:8188, sin fallback a cloud.
La persistencia se elige una sola vez en el boot entre local y memoria según
disponibilidad. El servicio espera el primer estado sin volver a forzar local:
el SDK puede aceptar ese cambio sin usuario y fallar después al guardar el login.

| Símbolo                                                                  | Contrato                                                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `initializeAuth()`                                                       | Promesa compartida hasta el primer evento Auth; reinicia inicialización tras error       |
| `waitForAuthReady()` / `authReady`                                       | Función y alias que esperan esa inicialización; `authReady` no es una promesa exportada  |
| `observeAuthState(listener, onError)`                                    | Registra callbacks; entrega estado listo por microtarea; devuelve baja de esos callbacks |
| `getCurrentAuthUser()`                                                   | Usuario observado, usuario SDK o `null`                                                  |
| `serializeAuthUser(user)`                                                | `null` o UID, email, verificación, nombre, foto y `providerIds`; sin credenciales        |
| `loginWithEmail(email, password)` / `registerWithEmail(email, password)` | Recortan email, esperan Auth, admiten operación y devuelven usuario SDK                  |
| `loginWithGoogle()`                                                      | Popup Google con selección de cuenta; devuelve usuario SDK                               |
| `logout()`                                                               | `signOut`; no borra Auth ni biblioteca                                                   |
| `resetPassword(email)`                                                   | Envía solicitud SDK; requiere configuración, consume admisión Auth                       |
| `disposeAuthObserver()`                                                  | Cancela observador SDK; no limpia todos los estados internos de inicialización           |

Rutas de invitados: `/login`, `/register`, `/forgot-password`. Privadas: `/library`,
`/add`, `/manga/:id`, `/settings`, `/settings/import-export`. `/` redirige a biblioteca;
hay catch-all 404. La guarda espera inicialización, envía al login al visitante y
a biblioteca al usuario en rutas de invitados. Un fallo de inicialización en ruta
privada añade `sessionError=1` y destino de retorno. Son rutas de UI, sin endpoints.

## Cambios de credenciales y vinculación

Ampliación ML-15 del 28/10/2026 para revisión, sin despliegue. Fuente:
`src/services/credential-service.js`. Requiere sesión activa; serializa las
operaciones de este servicio y rechaza sustitución de identidad durante la
confirmación. Los cambios confirman identidad con contraseña o popup Google.

| Símbolo                                                | Contrato                                                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `changeAccountPassword(currentPassword, newPassword)`  | Confirma identidad y actualiza contraseña; devuelve usuario SDK, conserva UID                                         |
| `requestAccountEmailChange(currentPassword, newEmail)` | Recorta email, confirma identidad y envía verificación a la nueva dirección; no cambia email local antes de verificar |
| `addPasswordAccess(currentPassword, newPassword)`      | Vincula email/contraseña al email actual; no crea otro usuario                                                        |
| `addGoogleAccess(currentPassword)`                     | Vincula Google con popup; conflicto de credencial ajena se propaga sin fusionar cuentas                               |
| `refreshAccountIdentity()`                             | Recarga usuario desde Auth y comprueba identidad; puede fallar si la sesión ya no es válida                           |

Cada llamada SDK consume admisión Auth. Los errores se convierten a AppError,
sin guardar contraseñas o credenciales. Véanse [pruebas y límites de aceptación
real](/reports/quality/ml-15-credentials-2026-10-28).

## Eliminación de cuenta

Fuente: `src/services/account-service.js`. `reauthenticateCurrentUser(options = {})`
acepta contraseña (también string de compatibilidad) o popup Google según proveedor;
devuelve usuario. `deleteUserFirestoreData(uid, onProgress)` exige coincidencia de UID,
crea/conserva el marcador `deleting`, elimina hasta cinco lotes de 400 y consulta
una sexta vez para comprobar vacío o emitir `app/deletion-budget`. Devuelve número
borrado; el callback recibe `{ deletedCount }` y sus errores se ignoran.

`deleteCurrentAccount(options = {})` impide concurrencia en el módulo, consume
admisión Auth, reautentica, verifica identidad, borra datos y solo entonces llama
a `deleteUser`. Los errores añaden `deletionStarted`, `deletedCount`,
`partialDataDeletion` o `firestoreDataDeleted` según fase. Se conserva el marcador
para bloquear sesiones con tokens aún válidos. Repetir requiere confirmación;
no hay trabajador que termine al cerrar el cliente ni retirada automática del marcador.

## Errores y alcance de la verificación

`src/utils/firebase-errors.js` define `AppError` con `code`, `message`,
`requiresReauthentication` y causa opcional. `toAppError` conserva la instancia ya
normalizada; para errores ajenos conserva código o usa `app/unknown` y mensaje seguro.
Los servicios registran cuotas mediante `sparkBudget.record` antes de propagarlas.

| Grupo                   | Códigos / respuesta esperada                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Configuración/sesión    | `app/firebase-not-configured`, `app/invalid-account`; revisar configuración o sesión                                           |
| Validación/conflicto    | `app/invalid-manga`, `app/edit-conflict`, `app/manual-chapter-required`; revisar entrada o versión actual                      |
| Presupuesto             | `app/request-budget`, `app/quota-paused`, `app/library-budget`, `app/deletion-budget`; detener y revisar/reanudar expresamente |
| Exportación/importación | `app/export-not-confirmed`, `app/import-identity-unavailable`, `app/invalid-import-identity`; no certificar resultado parcial  |
| Copia dividida          | `app/backup-invalid`, `app/backup-wait`, `app/backup-changed`, `cancelled`; revisar archivos/estado/sesión                     |
| Firebase                | `permission-denied`, `unavailable`, errores Auth y cuotas; no degradar silenciosamente a caché o elevar plan                   |

Pruebas relacionadas: `tests/regressions.test.js`, `tests/account-service.test.js`,
`tests/transaction-budget.test.js`, `tests/firestore/security.test.js` y
`tests/firestore/transaction-budget.test.js`. Su presencia no demuestra ejecución
en esta revisión: véase el registro de [validaciones](/maintenance/documentation-audit#validacion-reproducible).
