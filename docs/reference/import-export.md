# Importación, exportación e integridad

Contratos internos ML-04 sobre `a6627d0`, 23/10/2026. Ninguna de estas funciones
publica una API de red. Los parsers/serializadores puros no leen Firestore;
la [persistencia](/reference/services) y las guardas de UI son capas distintas.

## Preview y selección

`src/services/import-service.js` exporta `IMPORT_FORMATS` (json/csv/txt),
`detectImportFormat(fileNameOrMimeType = '', content = '')`,
`parseImportContent(content, format)`, `mapImportedRecord(record, recordIndex = 0)`,
`createImportPreview(content, options = {})`,
`createRecoverableImportPreview(content, { uid, ...options } = {})` y
`prepareImportSelection(preview, { selectedIds } = {})`.

La detección prioriza extensión/MIME y después contenido; devuelve formato o texto
vacío. Parsing devuelve `{ rows, parseErrors }`, sin escribir. JSON admite array,
contenedores mangas/items/records/data u objeto de obra; CSV usa coma con comillas
escapadas y saltos de línea; TXT requiere nombre, capítulo y URL opcional separados
por `|`. Se reconocen alias de columnas y estados, se normaliza capítulo y nombre,
y se validan campos. `mapImportedRecord` devuelve `{ manga, errors }` sin timestamps.

Options de preview: `format`, `fileName`, `mimeType`, `existingMangas`. El resultado
contiene `format`, `items`, `valid`, `duplicates`, `errors`, `summary`. Cada item
contiene ID de fila, `sourceIndex`, `raw`, `manga`, `status`, `selected`,
`duplicateOf` y errores con campo/código/mensaje. Nuevas válidas se seleccionan;
duplicadas por nombre normalizado en biblioteca o archivo quedan desmarcadas;
errores no se importan. Es una advertencia de duplicados, sin unicidad transaccional
por nombre: el usuario puede optar por duplicados válidos.

El preview recuperable exige UID válido y Web Crypto. Añade `ownerUid` e
`importDocumentId`: SHA-256 de la tupla JSON `['mangalist-import-v1', uid, format,
content]` más número de fila. Depende del texto decodificado exacto, no del nombre
del archivo ni de los IDs aleatorios de fuentes. Cambiar texto, formato o cuenta
cambia identidades. IDs ya presentes quedan `imported`, duplicados y desmarcados.
`prepareImportSelection` admite array/Set de IDs explícitos, excluye errores y ya
importados y devuelve `{ mangas, selectedItems, skippedItems, summary }`; copia
géneros y fuentes para las obras seleccionadas.

## Ejecución normal y reanudación

`src/pages/ImportExportPage.vue` limita el archivo a **5 MiB** (aunque su texto UI
dice MB), espera carga sin error y protege el preview contra lecturas antiguas y
cambio de UID. No persiste el archivo. Importa grupos de hasta ocho mediante
`Promise.allSettled` y `mangaStore.createManga(uid, item.manga, { importDocumentId })`.
Solo marca éxitos confirmados; cuenta fallos y detiene grupos posteriores ante
cualquier error. Muestra la primera causa mediante el catálogo seguro de errores,
conservando las filas confirmadas. No hay rollback global de las filas ya guardadas.

No realiza espera automática ni checkpoint durable. Para continuar se conserva el
archivo original y se selecciona con la misma cuenta/formato. La transacción
create-if-absent protege frente a respuesta perdida y evita sobrescribir ediciones
posteriores. No deduplica importaciones antiguas creadas con IDs aleatorios. La
importación normal no certifica una biblioteca vacía ni capacidad global disponible.

## Exportación normal

`fetchLibraryForExport` rechaza una segunda exportación simultánea de la misma
cuenta en esta instancia antes de leer páginas. Siempre libera el bloqueo al
resolver o fallar; no comparte bibliotecas ni bloqueos entre cuentas.

`src/services/export-service.js` exporta `EXPORT_FORMATS` (json/csv),
`CSV_EXPORT_COLUMNS`, `exportLibraryToJson(mangas, { pretty = true, verification } = {})`,
`exportLibraryToCsv(mangas, { includeBom = true, verification } = {})`,
`createLibraryExport(mangas, format, options = {})`, `downloadExport(payload)` y
`downloadLibraryExport(mangas, format, options = {})`.

Los serializadores requieren array y devuelven texto; no validan el esquema completo
ni certifican por sí mismos origen servidor. Sin `verification`, JSON es array;
con ella es `{ formatVersion: 2, verification, mangas }`. Se valida source=server,
pending=false y fecha parseable. CSV añade exportSource/exportObservedAtClient,
escapa comillas/saltos y antepone apóstrofo a celdas que empiezan por `=`, `+`, `-`
o `@`. No es formato de restauración fiel de todos los campos administrativos.
JSON conserva ID y fechas serializadas; importar crea nuevas fechas servidor y no
restaura IDs originales como IDs de documento.

Options de payload: `fileName`, `date`, `pretty`, `includeBom`, `verification`.
`createLibraryExport` devuelve `{ format, fileName, mimeType, content }`;
`downloadExport` crea Blob/URL y enlace DOM, solicita descarga y revoca URL;
devuelve nombre. `downloadLibraryExport` devuelve payload. Formatos inválidos o
verificación malformada producen TypeError. Solicitar descarga no prueba que el
usuario haya guardado el archivo.

La UI obtiene `{ mangas, verification }` con `fetchLibraryForExport(uid)` y rechaza
escrituras propias pendientes, error de escucha, cambio de cuenta y cambio de
`libraryRevision` durante la lectura. Los formatos no incluyen cuenta, ajustes ni
marcador de borrado. `observedAtClient` es hora del cliente al finalizar, sin firma
de servidor ni snapshot atómico. Los cambios aún no observados en otros dispositivos
pueden escapar a esta guarda. No se promete copia offline confirmada.

## Copia dividida

`src/services/multipart-backup.js` exporta `BACKUP_FILE_BYTES` (5 MiB),
`BACKUP_PART_BYTES` (4 MiB), `isMultipartBackup(text)`,
`prepareMultipartExport(mangas, verification, assertCurrent = () => {}, options = {})`,
`verifyMultipartBackup(selectedFiles, { uid, assertCurrent = () => {}, existingMangas = [] })`,
`assertRestoreLibrary(plan, mangas)` y `restoreMultipartBackup(plan, callbacks)`.

`isMultipartBackup` solo detecta prefijo de formato; no valida integridad. La
preparación requiere 1–10000 obras, UUID de copia y procedencia válida; options
permite `copyId` y `partBytes` para tamaños menores. Empaqueta por bytes UTF-8,
rechaza obra indivisible mayor que una parte y devuelve plan sellado con
`manifest`, `manifestFileName`, `manifestContent`, `partContent(index)` (índice cero).
No relee servidor al descargar partes: todas pertenecen a la misma preparación.

El manifiesto `mangalist-manifest-v1` contiene copyId, procedencia, total y
descriptores ordenados (index, fileName, records, bytes, sha256). Cada parte
`mangalist-part-v1` incluye copyId, índice desde 1, formatVersion 2, procedencia y
obras. Se conservan nombres originales de manifiesto y partes.

Antes de permitir la primera escritura, `verifyMultipartBackup` verifica:

1. Un manifiesto y el conjunto exacto de partes, sin nombres repetidos ni archivos adicionales.
2. UUID, índices consecutivos, nombres, conteos, límites de tamaño y total coherente.
3. Tamaño real UTF-8 y SHA-256 de cada parte; formato, copyId, procedencia y conteo coincidentes.
4. Preview válido de todas las obras e identidades recuperables sin repetición.
5. Biblioteca vacía o subconjunto de los IDs esperados; no mezcla otra biblioteca.

Devuelve plan `{ uid, manifest, files, expectedIds }` con referencias File en
memoria. SHA-256 detecta corrupción respecto al manifiesto, **no autentica autoría**:
alguien puede alterar contenido y recalcular hashes. No hay firma, cifrado ni
certificación de servidor del archivo recibido.

`restoreMultipartBackup` recibe `assertCurrent`, `assertReady`, `getMangas`, `write`,
`budget`, `shouldPause`, `onProgress`; la UI aporta las guardas de sesión/estado y
el writer idempotente. Relee y verifica cada parte, salta IDs completados y limita
grupos al mínimo entre ocho y admisiones read/write disponibles. Devuelve
`{ complete, completed, retryAfterMs }` y `error` si se pausa. Una pausa deja terminar
el grupo en vuelo. No reduce lecturas/escrituras necesarias por documento.

`src/components/import/MultipartBackupPanel.vue` limpia planes al salir/cambiar UID,
exige biblioteca confirmada y espera hasta 15 s a observar el conjunto completo tras
las escrituras antes de anunciar recuperación terminada. Ese sondeo consulta estado
local cada 100 ms, sin lecturas Firestore añadidas. Una recarga requiere seleccionar
otra vez todos los mismos archivos. No existe proceso de recuperación en segundo plano.

Pruebas: `tests/import-recovery.test.js`, `tests/export-verification.test.js`,
`tests/multipart-backup.test.js`, `tests/multipart-panel.test.js`,
`tests/e2e/multipart-backup.spec.js` y `tests/firestore/security.test.js`.
Los informes fechados describen ejecuciones históricas; la auditoría
[ML-05](/maintenance/documentation-audit) distingue esa evidencia de nuevos ensayos y despliegue.
