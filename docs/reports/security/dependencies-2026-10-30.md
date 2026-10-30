# Dependencias y CI de ML-15 — 30/10/2026

## Problema y corrección

El CI de la PR #34 (ejecución 40996436838) terminó FAIL en la auditoría
de dependencias. Las etapas posteriores quedaron omitidas. Los PASS locales
del enrutamiento PWA se mantienen separados de ese resultado.

Se actualizan exclusivamente las cadenas afectadas en el manifiesto y lockfile
raíz, sin reducir el umbral low ni añadir excepciones:

| Cadena                           | Antes                         | Resolución nueva          |
| -------------------------------- | ----------------------------- | ------------------------- |
| Vue I18n y paquetes de ejecución | 11.4.10, copia anidada 10.0.8 | 11.4.16                   |
| Plugin de compilación I18n       | 11.2.6 / extensions 8.0.0     | 11.2.8 / extensions 9.0.0 |
| re2js, transitiva de Firestore   | 2.8.6                         | 2.9.1                     |
| Vite de VitePress                | override 6.4.4                | override 6.4.5            |

El plugin nuevo elimina la cadena antigua de I18n; actualizar solo el paquete
principal dejaba la copia vulnerable anidada. La versión mayor del plugin
permanece en 11. Firebase SDK sigue en 12.18.0, Vite de aplicación en 8.2.4
y Workbox en 7.4.1. El parche local de deepmerge se conserva sin cambios.

Fuentes de los mantenedores: [Vue I18n](https://github.com/intlify/vue-i18n/security/advisories/GHSA-83rm-6c8r-g728),
[escapeParameter](https://github.com/intlify/vue-i18n/security/advisories/GHSA-8rc2-428q-7ww3),
[re2js](https://github.com/advisories/GHSA-gg6h-894w-4m9c) y
[Vite](https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj).
No se afirma explotación de MangaList: la auditoría identifica versiones
afectadas; la corrección retira esas resoluciones.

## Validación reproducible

Ejecutar npm ci, npm ci --prefix src-pwa y npm run audit:dependencies.
Después, lint:check, npm test, docs:build, docs:check, check:spark y builds
SPA/PWA con las seis variables demo del CI. Ejecutar test:e2e con Auth y
Firestore Emulator, test:pwa y test:auth:built. Nunca usar credenciales reales
para estas regresiones. El CI de esta rama debe dar su propio resultado.

Resultados locales observados hasta este punto: auditorías raíz/PWA con cero
vulnerabilidades, 171/171 unitarias PASS, compilaciones docs/SPA/PWA PASS.
La suite PWA termina 14/14 PASS. lint:check, docs:check y check:spark pasan.
La suite completa de navegador sigue en ejecución; su resultado y el de Auth
compilado se completarán en la descripción del PR.
Los artefactos locales identifican el padre 56e148d con cambios locales.
No equivalen a Hosting ni al candidato SPA limpio cbd1c98 utilizado por el humano.

## Límites y cierre

No se modifica Firebase remoto, Auth, reglas, IAM ni billing; Spark exclusivamente.
No hay despliegue ni merge. El candidato real estático anterior sigue separado
de los nuevos builds demo. ML-15 permanece abierta: conflicto Google con una
cuenta separada, verificaciones reales pendientes y Safari/iOS no se dan por
resueltos por esta actualización. Las pruebas con demos ya efectuadas son
evidencia humana de sus escenarios concretos, no aceptación de este build.
