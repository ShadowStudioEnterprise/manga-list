# Contribuir a MangaList

Esta rama es material de revisión del PR, no una publicación. Empieza por la
[especificación v1](docs/reports/project/specification-v1.md), el [roadmap](docs/reports/project/roadmap.md) y la
[política Spark](docs/reports/security/spark-only.md). Las instrucciones del titular sobre autorización
prevalecen: este documento no concede permiso para desplegar o modificar producción.

## Preparación local

Usa Node 24 de `.nvmrc`, npm y Java 21 o superior. La versión de Firebase CLI usada por CI
está fijada en [.github/workflows/ci.yml](.github/workflows/ci.yml); utiliza esa versión
para reproducir sus emuladores. Trabaja en una rama distinta de main.

```sh
npm ci
npm ci --prefix src-pwa
npx playwright install chromium firefox
```

No añadas claves privadas, cuentas de servicio, tokens, archivos `.env` o bibliotecas reales
al repositorio ni a informes. Los valores web públicos de Firebase no sustituyen las reglas
de autorización. Las pruebas usan identidades nuevas y datos sintéticos del proyecto demo.

## Comprobaciones según el cambio

```sh
npm run check:spark
npm run lint:check
npm test
```

`lint:check` verifica sin corregir archivos. `npm run lint` aplica formato y correcciones:
revisa su diff antes de incluirlo. No hace falta añadir tests que repitan una edición de
texto o CSS; para un cambio de comportamiento, reproduce la condición y verifica su resultado.

Si afecta a Firestore, propiedad, esquema o borrado:

```sh
firebase emulators:exec --project demo-mangalist --only firestore "npm run test:rules"
```

Si afecta a flujos de usuario, sincronización, importación/exportación o navegación:

```sh
npm run test:e2e
```

El lanzador inicia Auth, Firestore y un servidor aislado. Los puertos `9199`, `8188` y
`9100` deben estar libres. No reutilices un servidor existente ni cambies el proyecto demo
por uno real para resolver un fallo. Chromium y Firefox tienen una
[matriz explícita](docs/reports/quality/browser-coverage-2026-10-18.md); los tests rechazan peticiones externas,
errores ResizeObserver y el aviso de estado de historial. No añadas filtros para ocultarlos.

`QCLI_FIREBASE_EMULATORS` admite vacío, `true` o `false`. Una petición `true` fuera de
desarrollo o sin proyecto demo completo falla antes de inicializar servicios; no cae al
modo normal. Revisa la [validación de arranque](docs/reports/development/firebase-startup.md) si reutilizas una
app predeterminada o cambias su configuración durante desarrollo.

Para build o PWA, reproduce la configuración ficticia de CI antes de compilar. Estos valores
deben estar en el entorno del proceso, por encima de cualquier `.env` local:

| Variable                            | Valor demo                       |
| ----------------------------------- | -------------------------------- |
| `VITE_FIREBASE_API_KEY`             | `demo-mangalist-key`             |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `demo-mangalist.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID`          | `demo-mangalist`                 |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `demo-mangalist.appspot.com`     |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789`                      |
| `VITE_FIREBASE_APP_ID`              | `1:123456789:web:demo`           |

```sh
npm run build
npm run build:pwa
node scripts/build-evidence.mjs verify spa --project demo-mangalist
node scripts/build-evidence.mjs verify pwa --project demo-mangalist
npm run test:pwa
```

El verificador exige fuente limpia y revisión identificada. Para experimentar con cambios
sin commit solo en demo existe `--allow-dirty-demo`; CI no lo usa y nunca permite esa
excepción para producción. Sigue el [procedimiento de evidencia](docs/reports/operations/releases-and-recovery.md).
La prueba del worker requiere Chromium instalado y usa un servidor local, sin publicación.

Si cambias dependencias o lockfiles, ejecuta `npm run audit:dependencies` y las pruebas que
ejercitan esas dependencias. Conserva `npm ci` reproducible y revisa el
[override gRPC y sus límites](docs/reports/development/dependencies-2026-10-18.md). Un audit sin avisos conocidos
no garantiza ausencia de vulnerabilidades. No añadas SDK o servicios fuera del inventario.

## Propuesta y revisión

Describe el problema, el comportamiento resultante, las pruebas ejecutadas y sus límites.
Referencia los IDs `ML-*` de la especificación cuando cambies su contrato. Actualiza el
registro [Sin publicar](CHANGELOG.md), sin inventar releases, fechas de despliegue ni versiones
de producción. Incluye una prueba negativa o de interrupción cuando el fallo lo justifique.

No reduzcas reglas ni retires el marcador para compatibilizar un cliente antiguo. No cambies
los contratos declarados sin revisar sus consumidores y las pruebas de recuperación. Cambiar
el máximo de consulta no implementa por sí solo paginación de servidor o una cuota global.

Mantén las acciones de CI fijadas y sus permisos mínimos. No añadas credenciales, despliegue
automático ni acciones remotas como efecto de una compilación o un test. Fusión, despliegue,
restauración, cambios IAM/consola o cuentas/datos remotos requieren autorización expresa del
titular para una acción y candidato concretos. Spark, sin Blaze ni facturación, sigue siendo
un requisito incluso ante incidentes.

## Seguridad y licencia

Consulta [SECURITY.md](SECURITY.md) antes de compartir una vulnerabilidad. No adjuntes datos
reales a issues públicas o artefactos CI. La licencia del proyecto sigue pendiente de elección
por el titular; este PR no añade ni propone una licencia. Las licencias de las dependencias
son independientes y no se sustituyen mediante esta guía.
