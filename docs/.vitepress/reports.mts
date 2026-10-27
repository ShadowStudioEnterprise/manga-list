export const reportsSidebar = [
  {
    text: 'Informes',
    items: [
      {
        text: 'Índice de informes',
        link: '/reports/',
      },
    ],
  },
  {
    text: 'Proyecto y arquitectura',
    collapsed: true,
    items: [
      {
        text: 'ML-03: diagramas y verificación',
        link: '/reports/development/ml-03-diagrams-2026-10-22',
      },
      {
        text: 'Especificación v1',
        link: '/reports/project/specification-v1',
      },
      {
        text: 'Roadmap de auditoría',
        link: '/reports/project/roadmap',
      },
      {
        text: 'Revisión técnica (16/10)',
        link: '/reports/project/technical-review-2026-10-16',
      },
    ],
  },
  {
    text: 'Firestore y rendimiento',
    collapsed: true,
    items: [
      {
        text: 'ML-08: capacidad Spark (21/10)',
        link: '/reports/firestore/ml-08-capacity-2026-10-21',
      },
      {
        text: 'ML-08: política provisional aprobada',
        link: '/reports/firestore/ml-08-policy-2026-10-21',
      },
      {
        text: 'ML-08: recuperación y tamaño de copias',
        link: '/reports/firestore/ml-08-recovery-2026-10-21',
      },
      {
        text: 'ML-08: copia dividida y reanudación',
        link: '/reports/features/multipart-backup-2026-10-21',
      },
      {
        text: 'ML-07: consultas y sincronización (20/10)',
        link: '/reports/firestore/ml-07-sync-2026-10-20',
      },
      {
        text: 'ML-06: consumo y escenarios (20/10)',
        link: '/reports/firestore/ml-06-consumption-2026-10-20',
      },
      {
        text: 'Cursores Firestore v1',
        link: '/reports/firestore/firestore-cursors-v1',
      },
      {
        text: 'Consumo Firestore (19/10)',
        link: '/reports/firestore/firestore-cost-review-2026-10-19',
      },
      {
        text: 'Transacciones y presupuesto (19/10)',
        link: '/reports/firestore/transaction-read-budget-2026-10-19',
      },
      {
        text: 'Verificación de cursores (18/10)',
        link: '/reports/firestore/verification-cursors-2026-10-18',
      },
      {
        text: 'Límite de 10000 obras (19/10)',
        link: '/reports/firestore/verification-10000-2026-10-19',
      },
      {
        text: 'Escala de biblioteca (18/10)',
        link: '/reports/firestore/library-scale-2026-10-18',
      },
    ],
  },
  {
    text: 'Seguridad y Spark',
    collapsed: true,
    items: [
      {
        text: 'Política Spark',
        link: '/reports/security/spark-only',
      },
      {
        text: 'Control Spark',
        link: '/reports/security/spark-guard-entrypoints',
      },
      {
        text: 'Verificación Spark (18/10)',
        link: '/reports/security/verification-spark-2026-10-18',
      },
      {
        text: 'Consola Spark (18/10)',
        link: '/reports/security/verification-spark-console-2026-10-18',
      },
    ],
  },
  {
    text: 'Cuentas y retención',
    collapsed: true,
    items: [
      {
        text: 'Proton Drive: plataforma seleccionada',
        link: '/reports/accounts/proton-drive-implementation-proposal',
      },
      {
        text: 'Proton Drive: ensayo parcial (21/10)',
        link: '/reports/accounts/proton-drive-service-rehearsal-2026-10-21',
      },
      {
        text: 'Proton Drive: seguridad y custodia',
        link: '/reports/accounts/proton-drive-security-custody-procedure',
      },
      {
        text: 'ML-11: fichas D3, permisos y revisión jurídica',
        link: '/reports/accounts/ml-11-d3-permissions-legal-review-pack',
      },
      {
        text: 'Proton Drive: ensayo documental',
        link: '/reports/accounts/proton-drive-rehearsal-pack',
      },
      {
        text: 'Nextcloud: implementación propuesta',
        link: '/reports/accounts/nextcloud-implementation-proposal',
      },
      {
        text: 'Nextcloud: alojamiento y coste (21/10)',
        link: '/reports/accounts/nextcloud-hosting-cost-2026-10-21',
      },
      {
        text: 'ML-11: alternativas gratuitas (21/10)',
        link: '/reports/accounts/ml-11-free-options-2026-10-21',
      },
      {
        text: 'ML-11: preparación para activación',
        link: '/reports/accounts/ml-11-activation-pack',
      },
      {
        text: 'ML-11: validación y decisiones (21/10)',
        link: '/reports/accounts/ml-11-validation-2026-10-21',
      },
      {
        text: 'Asistencia a borrados',
        link: '/reports/accounts/abandoned-deletion-assistance',
      },
      {
        text: 'ML-12: eliminaciones interrumpidas',
        link: '/reports/accounts/ml-12-interrupted-deletion',
      },
      {
        text: 'ML-12: paquete de preparación',
        link: '/reports/accounts/ml-12-mailbox-and-roles-pack',
      },
      {
        text: 'Retención del marcador',
        link: '/reports/accounts/account-marker-retention-proposal',
      },
      {
        text: 'Revisión manual del marcador',
        link: '/reports/accounts/manual-marker-review',
      },
    ],
  },
  {
    text: 'Funcionalidades',
    collapsed: true,
    items: [
      {
        text: 'Importación recuperable',
        link: '/reports/features/import-recovery',
      },
      {
        text: 'Sincronización y exportación comprobada',
        link: '/reports/features/synchronization-and-export',
      },
      {
        text: 'Borradores de pestaña y actualización PWA',
        link: '/reports/features/drafts-and-pwa-updates',
      },
    ],
  },
  {
    text: 'Calidad y verificación',
    collapsed: true,
    items: [
      {
        text: 'ML-15: autenticación y recuperación (27/10)',
        link: '/reports/quality/ml-15-auth-2026-10-27',
      },
      {
        text: 'ML-01: verificación postdespliegue (27/10)',
        link: '/reports/quality/ml-01-postdeploy-2026-10-27',
      },
      {
        text: 'ML-16: Android físico (27/10)',
        link: '/reports/quality/ml-16-android-2026-10-27',
      },
      {
        text: 'Verificación general (16/10)',
        link: '/reports/quality/verification-2026-10-16',
      },
      {
        text: 'Accesibilidad (18/10)',
        link: '/reports/quality/accessibility-2026-10-18',
      },
      {
        text: 'Cobertura de navegadores (18/10)',
        link: '/reports/quality/browser-coverage-2026-10-18',
      },
      {
        text: 'Historial de navegación (18/10)',
        link: '/reports/quality/navigation-history-2026-10-18',
      },
      {
        text: 'Redimensionamiento (18/10)',
        link: '/reports/quality/live-resize-2026-10-18',
      },
      {
        text: 'Recuperación de contraseña',
        link: '/reports/quality/password-recovery-emulator',
      },
    ],
  },
  {
    text: 'Versiones y recuperación',
    collapsed: true,
    items: [
      {
        text: 'ML-10: protección de main (21/10)',
        link: '/reports/operations/ml-10-main-ruleset-2026-10-21',
      },
      {
        text: 'Versiones y recuperación',
        link: '/reports/operations/releases-and-recovery',
      },
      {
        text: 'Registro de publicación o recuperación',
        link: '/reports/operations/release-record-template',
      },
    ],
  },
  {
    text: 'Entorno y dependencias',
    collapsed: true,
    items: [
      {
        text: 'Arranque de Firebase',
        link: '/reports/development/firebase-startup',
      },
      {
        text: 'Dependencias (18/10)',
        link: '/reports/development/dependencies-2026-10-18',
      },
    ],
  },
]
