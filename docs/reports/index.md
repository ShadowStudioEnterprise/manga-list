# Informes técnicos

- [ML-15: cambios de credenciales y vinculación para 1.0 — 28/10/2026](quality/ml-15-credentials-2026-10-28.md).

La [auditoría ML-05](/maintenance/documentation-audit) distingue informes históricos,
contratos actuales, pruebas y registros de publicación.

Los documentos se agrupan por tema. Los informes fechados conservan los
resultados y las limitaciones de su revisión original; no certifican por sí solos
el estado actual de producción. Las propuestas de retención y asistencia siguen
pendientes de validación legal y técnica.

Las mediciones JSON permanecen en `docs/measurements/` y se enlazan desde sus
informes. Las guías de introducción, instalación y despliegue continúan en las
secciones principales del portal.

## Proyecto y arquitectura

- [ML-03: diagramas técnicos y verificación (22/10)](development/ml-03-diagrams-2026-10-22.md).

- [Especificación de MangaList, versión 1](project/specification-v1.md).
- [Roadmap tras la auditoría del 16/10/2026](project/roadmap.md).
- [Decisiones técnicas de la revisión del 16/10/2026](project/technical-review-2026-10-16.md).

## Firestore y rendimiento

- [ML-09: prevención y recuperación ante cuotas — candidata, aceptación operativa pendiente](firestore/ml-09-recovery-2026-10-23.md).

- [ML-08: auditoría de capacidad Spark — 21/10/2026](firestore/ml-08-capacity-2026-10-21.md).
- [ML-08: reserva y tramos aprobados para planificación](firestore/ml-08-policy-2026-10-21.md).
- [ML-08: recuperación y tamaño de copias — continuación](firestore/ml-08-recovery-2026-10-21.md).
- [ML-08: copia dividida y recuperación reanudable — implementación para revisión](features/multipart-backup-2026-10-21.md).

- [ML-07: consultas y sincronización — 20/10/2026](firestore/ml-07-sync-2026-10-20.md).

- [ML-06: consumo de Cloud Firestore — 20/10/2026](firestore/ml-06-consumption-2026-10-20.md).
- [Biblioteca con cursores Firestore — propuesta de implementación 1.0](firestore/firestore-cursors-v1.md).
- [Revisión de consumo Firestore — 19/10/2026](firestore/firestore-cost-review-2026-10-19.md).
- [Lecturas de transacciones y presupuesto local — 19/10/2026](firestore/transaction-read-budget-2026-10-19.md).
- [Verificación de cursores MangaList 1.0 — 18/10/2026](firestore/verification-cursors-2026-10-18.md).
- [Verificación del límite de 10000 obras — 19/10/2026](firestore/verification-10000-2026-10-19.md).
- [Biblioteca: representación acotada y medición local](firestore/library-scale-2026-10-18.md).

## Seguridad y Spark

- [MangaList: Firebase Spark exclusivamente](security/spark-only.md).
- [Entradas verificables del control Spark](security/spark-guard-entrypoints.md).
- [Verificación Spark — 18/10/2026](security/verification-spark-2026-10-18.md).
- [Comprobación de Spark en consola — 18/10/2026](security/verification-spark-console-2026-10-18.md).

## Cuentas y retención

- [Proton Drive: plataforma seleccionada y procedimiento propuesto para ML-11](accounts/proton-drive-implementation-proposal.md).
- [Proton Drive: primer ensayo parcial en cuenta autorizada — 21/10/2026](accounts/proton-drive-service-rehearsal-2026-10-21.md).
- [Proton Drive: MFA, recuperación, auditoría y custodia](accounts/proton-drive-security-custody-procedure.md).
- [ML-11: fichas D3, permisos, auditoría/custodia y encargo jurídico](accounts/ml-11-d3-permissions-legal-review-pack.md).
- [Proton Drive: paquete de ensayo documental y plantillas ML-11](accounts/proton-drive-rehearsal-pack.md).
- [Nextcloud: definición de implementación propuesta para ML-11](accounts/nextcloud-implementation-proposal.md).
- [Nextcloud: alojamiento y coste — 21/10/2026](accounts/nextcloud-hosting-cost-2026-10-21.md).
- [ML-11: alternativas gratuitas y Nextcloud sin cuota — 21/10/2026](accounts/ml-11-free-options-2026-10-21.md).
- [ML-11: ficha de preparación para activación](accounts/ml-11-activation-pack.md).
- [ML-11: aceptación de D1–D7 y condiciones pendientes](accounts/ml-11-acceptance-2026-10-21.md).
- [ML-11: validación jurídico-técnica — 21/10/2026](accounts/ml-11-validation-2026-10-21.md).
- [ML-11: procedimiento propuesto y decisiones pendientes](accounts/ml-11-operating-procedure.md).
- [ML-11: evidencia y límites de las pruebas](accounts/ml-11-test-evidence.md).
- [Procedimiento propuesto de asistencia a borrados abandonados](accounts/abandoned-deletion-assistance.md).
- [ML-12: asistencia a eliminaciones interrumpidas, ficha y ensayos](accounts/ml-12-interrupted-deletion.md).
- [ML-12: preparación del buzón, responsables, permisos, custodia y revisión jurídica](accounts/ml-12-mailbox-and-roles-pack.md).
- [Retención de users/{uid}: revisión manual propuesta](accounts/account-marker-retention-proposal.md).
- [Revisión manual del marcador: propuesta operativa MangaList 1.0](accounts/manual-marker-review.md).

## Funcionalidades

- [Importación recuperable sin servicios adicionales](features/import-recovery.md).
- [Sincronización y exportación comprobada](features/synchronization-and-export.md).
- [Borradores de pestaña y actualización PWA](features/drafts-and-pwa-updates.md).

## Calidad y verificación

- [ML-15: autenticación y recuperación — matriz local y bloqueos de cierre (27/10)](quality/ml-15-auth-2026-10-27.md).
- [ML-01 / PR #26: verificación postdespliegue (27/10)](quality/ml-01-postdeploy-2026-10-27.md).

- [ML-16: validación Android físico — 27/10/2026; dos pruebas pendientes](quality/ml-16-android-2026-10-27.md).
- [Verificación de la rama de desarrollo — 16/10/2026](quality/verification-2026-10-16.md).
- [Revisión local de accesibilidad y pantallas pequeñas](quality/accessibility-2026-10-18.md).
- [Cobertura de navegador con emuladores](quality/browser-coverage-2026-10-18.md).
- [Reproducción del aviso de historial y regresión](quality/navigation-history-2026-10-18.md).
- [Redimensionamiento con la página abierta](quality/live-resize-2026-10-18.md).
- [Recuperación de contraseña con credenciales emuladas](quality/password-recovery-emulator.md).

## Versiones y recuperación

- [ML-10: propuesta de protección de main — 21/10/2026](operations/ml-10-main-ruleset-2026-10-21.md).
- [Identificación de compilaciones y recuperación compatible con Spark](operations/releases-and-recovery.md).
- [Registro de publicación o recuperación](operations/release-record-template.md).

## Entorno y dependencias

- [Validación de Firebase antes de inicializar servicios](development/firebase-startup.md).
- [Dependencias: revisión H8 del 18/10/2026](development/dependencies-2026-10-18.md).

## Mantener el archivo

- Guarda cada nuevo informe en la carpeta de su tema y añádelo a este índice y al menú de informes.
- Conserva la fecha en el nombre de las verificaciones y mediciones.
- Enlaza los documentos con rutas relativas y los JSON de mediciones con `../../measurements/`.
- Al mover un informe publicado, actualiza las referencias y su redirección en `firebase.json`.
- Ejecuta `npm run docs:build` para comprobar los enlaces antes de publicar.
