# Seguridad y Firebase Spark

El proyecto exige Spark sin Blaze, cuentas de facturación asociadas ni servicios
de pago. Los servicios aprobados son Authentication, Firestore Standard y Hosting
estático. No se incorporan servicios de servidor ni proveedores de teléfono/SMS.

## Controles antes de publicar

`npm run check:spark` valida servicios, rutas de publicación, destinos, hooks,
scripts protegidos, dependencias y ausencia de despliegues en CI.

`npm run check:spark:remote` añade lecturas actuales con Google Cloud CLI de la
facturación y la base de datos. Requiere `gcloud` autenticado con permisos de
lectura. Rechaza facturación activa o vinculada, bases distintas de Standard,
errores de red, permisos insuficientes y evidencias incompletas. No existe una
opción para omitir esta comprobación en los hooks de publicación.

Ambos sitios tienen su propio hook remoto. Los destinos `app` y `docs` se validan
contra `.firebaserc` para impedir publicar la documentación sobre la aplicación.
Las cuotas de Hosting son compartidas por el proyecto; se deben revisar uso,
almacenamiento y transferencia en consola antes de publicar.
Consulta las [cuotas oficiales de Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing).

## Privacidad y cuentas

Las bibliotecas son privadas por UID y las reglas validan su esquema. El portal
es público: no publiques credenciales, bibliotecas, identificadores de usuarios ni
evidencias privadas. Los presupuestos locales de la aplicación no son una barrera
global contra abuso o agotamiento de cuotas.

La candidata [ML-09](/reports/firestore/ml-09-recovery-2026-10-23) persiste una pausa
local de cuota, detiene listeners y limita reconexiones sin confirmación; documenta
la recuperación manual y lo pendiente de aceptar en producción.

El borrado de cuenta se ejecuta en el cliente. Si se abandona, no hay un trabajador
que lo termine automáticamente. La revisión humana a los 30 días es una propuesta
pendiente de validación legal y técnica, sin eliminación programada.

- [Política Spark completa y límites](/reports/security/spark-only).
- [Contrato del verificador](/reports/security/spark-guard-entrypoints).
- [Asistencia para borrados abandonados](/reports/accounts/abandoned-deletion-assistance).
- [Revisión manual del marcador](/reports/accounts/manual-marker-review).
- [Propuesta de retención](/reports/accounts/account-marker-retention-proposal).
