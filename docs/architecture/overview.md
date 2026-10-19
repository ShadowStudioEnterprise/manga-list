# Arquitectura

La aplicación utiliza Vue 3 con Composition API, Quasar, Vue Router y Pinia.
Firebase aporta Authentication y Firestore; la PWA se publica como archivos estáticos.
La documentación utiliza VitePress y un segundo sitio de Hosting del mismo proyecto.

## Organización del código

| Directorio                     | Responsabilidad                                                     |
| ------------------------------ | ------------------------------------------------------------------- |
| `src/pages` y `src/components` | Pantallas y controles de biblioteca, edición e importación          |
| `src/layouts` y `src/router`   | Navegación y acceso a rutas privadas                                |
| `src/stores`                   | Estado de autenticación, biblioteca y preferencias con Pinia        |
| `src/services`                 | Auth, obras, cursores, importación, exportación y borrado de cuenta |
| `src/utils`                    | Validación, capítulos, conflictos, borradores y presupuestos Spark  |
| `src/boot/firebase.js`         | Validación de configuración e inicialización Firebase               |
| `src-pwa`                      | Service worker y dependencias PWA                                   |
| `scripts`                      | Comprobaciones Spark e inventario de compilaciones                  |

La sesión proporciona el UID. El almacén abre las suscripciones de su biblioteca y
las limpia al cerrar sesión o cambiar de cuenta. Las reglas de Firestore imponen
el aislamiento; proteger rutas en el navegador no sustituye esas reglas.

## Decisiones y evidencias

- [Arranque Firebase y emuladores](/reports/development/firebase-startup).
- [Modelo Firestore](/database/firestore) y [cursores](/reports/firestore/firestore-cursors-v1).
- [Sincronización y exportación](/reports/features/synchronization-and-export).
- [Importación recuperable](/reports/features/import-recovery).
- [Borradores y actualizaciones PWA](/reports/features/drafts-and-pwa-updates).

No hay Functions, Cloud Run, SSR ni procesos de fondo. La restricción operativa es
[Firebase Spark sin facturación](/security/spark).
