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
| `npm test`                                | 30/30: regresiones, presupuestos, cuota, listener excesivo, borrado parcial/concurrente, importación detenida |
| `npm run test:rules` en emulador Standard | 10/10: aislamiento, esquema, marcador, concurrencia y límites de listado                                      |
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
