# ML-12: evidencia y límites de validación

Fecha: 21/10/2026, Europe/Madrid. Base auditada:
`c563bba781760a8433680d1e120d486b310b8e75` de `origin/main`, obtenida desde
GitHub con verificación TLS mediante almacén Windows. Rama:
`docs/ml12-interrupted-account-deletion`. El conector GitHub no estuvo disponible;
se utilizó Git. No se inspeccionaron cuentas, datos o configuración Firebase reales.

## Resultados locales

| Comprobación                                   | Resultado                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `npm test`                                     | 113/113 correctas, incluida pérdida de acuse Auth inyectada         |
| Servicio y revisión ML-11 seleccionados        | 14/14 correctas                                                     |
| `node scripts/test-firestore-local.mjs --ml12` | 2/2 correctas con Auth y Firestore locales, proyecto demo-mangalist |
| Reglas Firestore completas                     | 25/25 correctas en Firestore local                                  |
| Compatibilidad Spark local                     | Correcta; no certifica plan/billing remoto                          |
| Formato y lint de archivos cambiados           | Correctos al preparar la entrega                                    |
| Construcción documental                        | Correcta, 21,92 s; aviso no bloqueante de tamaño de bundle          |

ML-12 emulador confirma que un lote de 400 puede aplicarse y el error inyectado
dejar `deletedCount: 0` y `partialDataDeletion: false`; un cliente nuevo inspecciona
el servidor, encuentra 1 de 401 y finaliza sin retirar marcador. El resultado se
obtiene ejecutando el servicio real con SDK y reglas locales, sustituyendo solo
la respuesta del commit. No reproduce una pérdida real de red.

El segundo ensayo crea y elimina exclusivamente una identidad ficticia en Auth
local, consulta su inventario local y comprueba que persisten manga y marcador en
Firestore. No es una ejecución administrativa de limpieza ni una prueba de
revocación/expiración de tokens de producción. Las consultas con reglas desactivadas
se limitan al entorno de prueba; no dan permisos de soporte al cliente.

La primera ejecución del segundo ensayo falló por usar una ruta de inventario no
soportada; se corrigió a `accounts:batchGet` del emulador y se repitió 2/2. La
credencial fija `owner` es exclusiva del emulador, no un secreto de producción.
La batería unitaria completa encontró inicialmente restricciones del sandbox para
enlaces temporales; la repetición local con permisos adecuados pasó 113/113.

## Cobertura y límites

Las pruebas existentes cubren reautenticación, cambio de sesión, más de 2000,
interrupción, cuota, lectura fallida, marcador, concurrencia e inventario desconocido.
No se modifican código de aplicación, reglas, dependencias ni configuración remota.
Se añade a CI un ensayo local Auth/Firestore sin credenciales y sin despliegue.

Pendientes de ejecución: los ocho ejercicios de mesa de la
[ficha](ml-12-case-and-tests.md), desafío de soporte y canal real, permisos entre
personas, custodia y restauración externa, dictamen jurídico y matriz de retención.
No se afirma que las pruebas automáticas satisfagan esos controles ni RGPD.

Logs locales sintéticos en el directorio de evidencia de esta tarea; no se suben
logs SDK completos al repositorio. CI remota del candidato se comprueba aparte;
el verde de ML-11 no se atribuye a ML-12. Entrega en borrador, sin fusión, despliegue,
cuentas/datos reales ni activación del procedimiento. Spark exclusivamente.

## Ampliación documental: preparación de condiciones humanas

El [paquete de preparación v1](ml-12-mailbox-and-roles-pack.md) añade cuatro fichas
para buzón/designaciones, identidad/permisos, ensayos/custodia y encargo jurídico,
retención y aceptación de plazos. Sin cambios de código ni reglas. Las pruebas
P01–P08, O01–O08 y C01–C07 son guiones pendientes de ejecución entre personas;
no se registran como aprobadas ni como controles implementados.

CI anterior verificada para `74e454afd4ac2a4ff34d0eacaea7da9dcddfc5d1`:
[PR](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39668588531) y
[push](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39668553614),
ambas `completed/success`. No se atribuyen automáticamente a esta ampliación.
Formato de los documentos y navegación: correcto; `git diff --check`: correcto.
`npm run docs:build`: correcto en 19,32 s, con aviso no bloqueante de tamaño de
bundle. No se repiten pruebas de código/emuladores por esta ampliación exclusivamente
documental. CI de la nueva revisión se registra en el PR cuando esté disponible.
