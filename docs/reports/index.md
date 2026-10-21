# Informes técnicos

Los documentos se agrupan por tema. Los informes fechados conservan los
resultados y las limitaciones de su revisión original; no certifican por sí solos
el estado actual de producción. Las propuestas de retención y asistencia siguen
pendientes de validación legal y técnica.

Las mediciones JSON permanecen en `docs/measurements/` y se enlazan desde sus
informes. Las guías de introducción, instalación y despliegue continúan en las
secciones principales del portal.

## Proyecto y arquitectura

- [Especificación de MangaList, versión 1](project/specification-v1.md).
- [Roadmap tras la auditoría del 16/10/2026](project/roadmap.md).
- [Decisiones técnicas de la revisión del 16/10/2026](project/technical-review-2026-10-16.md).

## Firestore y rendimiento

- [ML-08: auditoría de capacidad Spark — 21/10/2026](firestore/ml-08-capacity-2026-10-21.md).

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

- [Procedimiento propuesto de asistencia a borrados abandonados](accounts/abandoned-deletion-assistance.md).
- [Retención de users/{uid}: revisión manual propuesta](accounts/account-marker-retention-proposal.md).
- [Revisión manual del marcador: propuesta operativa MangaList 1.0](accounts/manual-marker-review.md).

## Funcionalidades

- [Importación recuperable sin servicios adicionales](features/import-recovery.md).
- [Sincronización y exportación comprobada](features/synchronization-and-export.md).
- [Borradores de pestaña y actualización PWA](features/drafts-and-pwa-updates.md).

## Calidad y verificación

- [Verificación de la rama de desarrollo — 16/10/2026](quality/verification-2026-10-16.md).
- [Revisión local de accesibilidad y pantallas pequeñas](quality/accessibility-2026-10-18.md).
- [Cobertura de navegador con emuladores](quality/browser-coverage-2026-10-18.md).
- [Reproducción del aviso de historial y regresión](quality/navigation-history-2026-10-18.md).
- [Redimensionamiento con la página abierta](quality/live-resize-2026-10-18.md).
- [Recuperación de contraseña con credenciales emuladas](quality/password-recovery-emulator.md).

## Versiones y recuperación

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
