# Especificación de MangaList, versión 1

Fecha: 20/10/2026. Base verificada: `d937549` de main, PR #5 de ML-06 fusionado.
Propuesta ML-07 sin publicar; requiere transición de reglas y cliente autorizada por separado.
Describe el comportamiento de esta rama; no certifica el contenido ni las reglas de producción.

Los identificadores `ML-*` permiten revisar cambios y localizar su evidencia. Cambiar un
requisito exige actualizar implementación, pruebas y documentación aplicables. Una ampliación
compatible se registra en esta versión y en el changelog; un contrato incompatible requiere
otra versión de especificación y una estrategia de transición explícita. El número de este
documento es independiente del esquema de obras, de la exportación y del sello de release.

## Requisitos y evidencia

| ID     | Comportamiento requerido                                                                                                                                                                                                            | Implementación y evidencia principal                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ML-001 | Solo Firebase Spark, sin facturación ni servicios que requieran pago. CI no despliega; las comprobaciones fallan ante evidencia incompleta.                                                                                         | [Política](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/spark-policy.json), [control](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/scripts/check-spark.mjs), [pruebas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/spark.test.js), [operación](../security/spark-only.md)                                                |
| ML-002 | Cada cuenta accede solo a su biblioteca; rutas protegidas y reglas de propietario, con rechazo de campos no admitidos.                                                                                                              | [Reglas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/firestore.rules), [pruebas reales de reglas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/firestore/security.test.js), [flujos](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/e2e/library.spec.js)                                                             |
| ML-003 | Las obras conservan el capítulo como texto; los cambios numéricos son transaccionales. Las ediciones de campos distintos se combinan; un conflicto del mismo campo requiere resolución explícita.                                   | [Servicio](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/src/services/manga-service.js), [regresiones](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/regressions.test.js), [reglas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/firestore/security.test.js)                                                          |
| ML-004 | La biblioteca usa rangos disjuntos por cuenta, coordinados entre pestañas compatibles, con consulta limitada a 5001 y protección local de 10000 obras. La presentación pagina 24 tarjetas después de filtrar y ordenar globalmente. | [ML-07](../firestore/ml-07-sync-2026-10-20.md), [pruebas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/library-cursors.test.js), [emulador](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/firestore/library-cursors.test.js), [escala](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/e2e/library-scale.spec.js) |
| ML-005 | La admisión local limita ráfagas y pausa operaciones tras errores de cuota. Las transacciones tienen intentos acotados; no hay reintentos infinitos controlados por la app.                                                         | [Control local](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/src/utils/spark-budget.js), [pruebas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/spark.test.js), [límites](../security/spark-only.md)                                                                                                                                        |
| ML-006 | El borrado exige reautenticación, bloquea nuevas escrituras mediante marcador y borra Auth solo después de comprobar desde servidor que la biblioteca está vacía.                                                                   | [Servicio](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/src/services/account-service.js), [regresiones](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/account-service.test.js), [reanudación real](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/firestore/security.test.js)                                          |
| ML-007 | La importación tiene previsualización y validación. Volver a seleccionar el mismo archivo/formato con la misma cuenta reutiliza IDs estables y no sobrescribe filas ya creadas.                                                     | [Identidad y recuperación](../features/import-recovery.md), [regresiones](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/import-recovery.test.js), [concurrencia real](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/firestore/security.test.js)                                                                                         |
| ML-008 | La exportación consulta el servidor, rechaza caché, cambios pendientes y exceso de tamaño, y comprueba que la cuenta no ha cambiado antes de descargar.                                                                             | [Contrato](../features/synchronization-and-export.md), [pruebas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/export-verification.test.js), [desconexión](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/e2e/library.spec.js)                                                                                                           |
| ML-009 | Los borradores de pestaña son opcionales, por cuenta, acotados y requieren recuperación explícita; conservan la base de edición para detectar conflictos.                                                                           | [Borradores](../features/drafts-and-pwa-updates.md), [pruebas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/form-drafts.test.js)                                                                                                                                                                                                                              |
| ML-010 | La PWA avisa de una actualización disponible y espera al cierre de todos los clientes; no fuerza recarga ni activación que pueda perder un formulario.                                                                              | [Configuración](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/quasar.config.js), [prueba del worker compilado](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/pwa/updates.test.js)                                                                                                                                                             |
| ML-011 | Los flujos cubiertos conservan controles y foco por teclado, diálogos cancelables y campos durante cambios de ancho; las auditorías automáticas no sustituyen dispositivos o revisión humana.                                       | [Matriz](../quality/browser-coverage-2026-10-18.md), [historial](../quality/navigation-history-2026-10-18.md), [resize](../quality/live-resize-2026-10-18.md), [E2E](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/e2e/library.spec.js)                                                                                                                        |
| ML-012 | La compilación identifica revisión, proyecto y contratos; se verifica el inventario de archivos y fuente limpia antes de una futura publicación autorizada.                                                                         | [Contratos](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/release-contract.json), [pruebas](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/tests/build-evidence.test.js), [procedimiento](../operations/releases-and-recovery.md)                                                                                                                    |

Los enlaces señalan pruebas relacionadas, no una demostración formal de cada requisito.
Los casos de CI con emuladores no constituyen aceptación operativa en producción.

ML-001 incluye la [validación temprana del arranque](../development/firebase-startup.md): una petición de
emuladores incompatible se rechaza antes de inicializar servicios. Una app existente debe
coincidir con la configuración declarada; esa coherencia local no certifica su plan remoto.

## Modelo de datos de la rama

Authentication proporciona el UID. Firestore usa `users/{uid}` y
`users/{uid}/mangas/{id}`; no existen bibliotecas compartidas ni perfiles públicos.

La [recuperación de contraseña emulada](../quality/password-recovery-emulator.md) verifica el texto
genérico de la solicitud, códigos inválidos/reutilizados y cambio de credenciales sin perder
la biblioteca. Confirma por REST local; no sustituye aceptación de correo, página de acción
alojada ni revocación de otras sesiones en producción.

Las obras tienen exactamente los campos del esquema 1 definidos en las reglas:

| Campo                    | Contrato de escritura                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schemaVersion`          | `1`                                                                                            |
| `name`, `normalizedName` | Texto no vacío, máximo 200 y 250 caracteres respectivamente                                    |
| `chapter`                | Texto no vacío, máximo 64; admite capítulos especiales sin incremento automático               |
| `type`                   | `manga`, `manhwa`, `manhua` u `other`                                                          |
| `genres`                 | Hasta 20 textos, cada uno de 1 a 60 caracteres                                                 |
| `readingStatus`          | `following`, `pending`, `completed` o `dropped`                                                |
| `publicationStatus`      | `publishing`, `completed`, `hiatus`, `cancelled`, `author_abandoned` o `unknown`               |
| `sources`                | Hasta 10 objetos con `id`, `name`, URL HTTP(S) e `isPrimary`; como máximo una fuente principal |
| `notes`                  | Texto, máximo 5000 caracteres                                                                  |
| `favorite`               | Booleano                                                                                       |
| `createdAt`, `updatedAt` | Timestamps; creación inmutable y actualización con tiempo de servidor                          |

El documento de cuenta admite `createdAt`, `updatedAt` y el estado opcional `deleting`.
El marcador de borrado no puede desbloquearse ni eliminarse desde el cliente bajo estas
reglas. Las reglas de escritura y sus pruebas son la referencia ejecutable; una tabla
no sustituye su validación de tipos, valores, límites o autenticación.

## Presupuestos propios de la aplicación

| Control                            | Valor de esta versión                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| Consulta de biblioteca/exportación | Biblioteca: 5001 por consulta, límite local 10000; exportación: cursores de 5001        |
| Presentación                       | 24 tarjetas por página, con biblioteca cargada previamente                              |
| Admisiones por pestaña/minuto      | Lectura 60; escritura 120; apertura de listener 3; Auth 10                              |
| Transacción                        | Hasta 3 intentos del SDK                                                                |
| Pausa tras cuota                   | 15 minutos en memoria de esa pestaña; no implica que la cuota remota se haya recuperado |
| Borrado por confirmación           | Hasta 5 lotes de 400; hasta 6 consultas de obras, más marcador y Auth                   |
| Borradores opcionales              | Hasta 10 entradas; 80 000 unidades UTF-16 por entrada; 24 horas en sessionStorage       |

Estos valores son presupuestos locales, no cuotas de Firebase ni equivalencias de consumo
facturable. Recargar, abrir otras pestañas o usar otro cliente puede eludirlos. Un listener
puede recibir muchas actualizaciones sin volver a pasar por la admisión. Las reglas acotan
la consulta pero no el total global de obras ni la frecuencia de acceso. No se garantiza
evitar abuso o agotamiento de cuotas. Los límites del proveedor se revisan en
[operación Spark](../security/spark-only.md), donde tienen fecha y referencias propias.

## Compatibilidad, pérdida y recuperación

El JSON exportado usa un contenedor v2 con obras y procedencia; CSV conserva su procedencia
en columnas. La hora de observación es del cliente y no está firmada. Una exportación no
certifica cambios posteriores ni operaciones pendientes de otros dispositivos.

Los IDs recuperables de importación son v1. Cambiar el texto, formato o cuenta cambia la
identidad; los IDs aleatorios antiguos no quedan cubiertos. El usuario debe volver a elegir
el archivo. Una fila eliminada posteriormente puede recrearse al reimportar.

Si el cliente abandona el borrado, el proceso se detiene sin garantía de finalización.
Auth permanece hasta la comprobación final; el marcador residual conserva un identificador.
No hay Functions, Run ni trabajador de fondo que lo termine. Responsable de asistencia,
plazos y retención requieren decisión del titular.

Los contratos declarados y los hashes de build no son firmas, garantía semántica ni prueba
de autoría. Una recuperación debe conservar barrera y reglas, con candidato probado y
autorización expresa; Hosting no restaura Auth ni los datos eliminados.

## Aceptación pendiente del titular

No se cierran mediante este documento: aceptación real de OAuth/recuperación y del SHA
publicado, Safari/dispositivos/lectores de pantalla, coste operativo de bibliotecas grandes,
asistencia y retención de borrados, responsables de incidentes, protección de main/IAM,
canal privado de seguridad y derechos/avisos de materiales de terceros. Apache-2.0
está elegida para las aportaciones originales en la rama ML-14, sin fusión ni
despliegue. El [roadmap](roadmap.md) conserva esos puntos.
No se autorizan fusión, despliegue, facturación ni cambios remotos.
