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
        text: 'Asistencia a borrados',
        link: '/reports/accounts/abandoned-deletion-assistance',
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
