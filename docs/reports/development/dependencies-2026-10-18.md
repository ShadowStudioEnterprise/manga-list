# Dependencias: revisión H8 del 18/10/2026

Base de esta revisión: `48a476e`, en el PR #2. Solo se modifican manifiestos,
lockfiles y verificación; no se publica ni se altera Firebase o sus datos.
Continúa vigente Spark exclusivamente, sin facturación ni servicios de pago.

## Diagnóstico por contexto

La auditoría inicial reportaba 14 entradas afectadas en el árbol raíz (11 altas,
1 moderada, 2 bajas) y 3 en PWA (2 altas, 1 baja). Son paquetes afectados y
propagaciones de dependencias, no 17 vulnerabilidades distintas ni explotaciones
demostradas en la web publicada.

| Cadena                                           | Contexto y corrección                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Firebase → Firestore → gRPC                      | Transporte de Node usado por tests, no el transporte web. `grpc-js` 1.9.16 → 1.13.6 mediante override limitado al hijo de Firestore |
| Plugin i18n → fast-glob → micromatch → braces    | Herramientas de build. Plugin 11.2.5 → 11.2.6 cambia a tinyglobby y elimina esa cadena vulnerable                                   |
| Quasar                                           | Runtime web. 2.28.0 → 2.35.1, rango mínimo elevado a la versión corregida 2.32.2                                                    |
| ESLint → minimatch → brace-expansion             | Desarrollo/build. 5.0.9 → 5.0.12                                                                                                    |
| eslint-plugin-vue → postcss-selector-parser      | Lint. 7.1.5 → 7.1.6                                                                                                                 |
| Vue/PostCSS/i18n → source-map-js                 | Compilación y mapas. 1.2.1 → 1.2.2                                                                                                  |
| Quasar app-vite / Workbox → serialize-javascript | Generación de código durante build. 7.1.1 → 7.1.2 en ambos lockfiles                                                                |
| Workbox → Ajv → fast-uri                         | Build del service worker. 3.1.6 → 3.1.8                                                                                             |
| Workbox → glob y filelist → brace-expansion      | Build. 5.0.9 → 5.0.12 y 2.1.4 → 2.1.7                                                                                               |

Quasar describe el problema de `openURL` como denegación de servicio en la integración
SafariViewController cuando se puede inyectar HTML. No se identificó uso directo de
`openURL`/SafariViewController en `src`; esto no demuestra ausencia de toda ruta indirecta.
La versión corregida se comprueba en el
[aviso del mantenedor](https://github.com/quasarframework/quasar/security/advisories/GHSA-89vp-x45c-52cq).
No se introducen pruebas que copien el código interno de Quasar; se repiten los flujos reales.

El [aviso gRPC](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j)
afecta a ciertas configuraciones de autenticación de servidor. MangaList no implementa
un servidor gRPC ni usa `getAuthContext`. El árbol de Node seguía afectado y se corrige
sin presentarlo como un fallo demostrado de autenticación del cliente web.

## Override explícito y compatibilidad

Firebase permanece en 12.18.0 y rules-unit-testing en 5.0.2. No se aplica `audit fix --force`
ni la propuesta automática de bajar Firebase a la versión mayor 9.
El manifiesto de Firestore solicita gRPC `~1.9.0`, por lo que una actualización ordinaria
no alcanza la corrección. El override selecciona exactamente 1.13.6 para ese hijo:

```json
{
  "overrides": {
    "@firebase/firestore": {
      "@grpc/grpc-js": "1.13.6"
    }
  }
}
```

Es un cambio menor dentro de gRPC 1.x, pero está fuera del rango solicitado por Firestore:
no se atribuye soporte oficial a esta combinación. Debe revisarse al actualizar Firebase.
Retirarlo cuando el SDK resuelva por sí mismo una versión corregida y repetir instalación,
auditoría, reglas, concurrencia y borrado con el transporte de Node real del emulador.
La [release 1.13.6](https://github.com/grpc/grpc-node/releases/tag/%40grpc%2Fgrpc-js%401.13.6)
documenta además la corrección de divulgación de errores. Un resultado de tests favorable
no garantiza compatibilidad con todas las configuraciones posibles.

Ambos lockfiles conservan integridad y descargas de `registry.npmjs.org`. No se añadieron
servicios, SDK Admin/Functions, scripts de instalación ni dependencias Git. La nueva
ubicación de esbuild y sus variantes de plataforma es una reorganización del árbol de i18n.
No se hizo una actualización general de dependencias ajenas a los avisos.

## Control continuo

`npm run audit:dependencies` audita los dos árboles completos, incluidas dependencias de
desarrollo, y devuelve error ante cualquier aviso de severidad baja o superior. Se ejecuta
en CI después de la instalación. Un fallo de red/registro también impide pasar el control;
no se interpreta como una auditoría limpia ni se omite silenciosamente. No ejecuta correcciones.

Esta auditoría depende del registro y de los avisos conocidos en ese momento. Cero avisos
no significa ausencia de vulnerabilidades, revisión completa de código ni garantía de seguridad.
El CLI global de Firebase y el emulador son herramientas separadas, fijadas por el workflow;
los conteos de estos lockfiles no incluyen sus árboles ni el sistema operativo.

Reproducción, sin despliegue:

```sh
npm ci
npm ci --prefix src-pwa
npm run audit:dependencies
npm run check:spark
npm run lint:check
npm test
firebase emulators:exec --project demo-mangalist --only firestore "npm run test:rules"
npm run test:e2e
```

Compilar SPA/PWA con las variables de demostración documentadas en CI. No usar comandos
de despliegue para validar dependencias. La evidencia final se registra en el PR.

## Resultado y seguimiento

Tras la actualización, `npm audit` reporta cero avisos en ambos árboles (raíz: 509
entradas de dependencia; PWA: 349, incluyendo variantes opcionales). La instalación
reproducible de ambos lockfiles con scripts de terceros desactivados fue correcta;
se ejecutó después la preparación propia de Quasar. Se verificó gRPC 1.13.6 instalado
y Firebase 12.18.0 sin cambios de versión.

Las 32 pruebas locales y las 11 de reglas Standard pasaron con el árbol recién
instalado, incluida concurrencia y reanudación de borrado con el SDK Node real.
Las compilaciones SPA y PWA de demostración también pasaron. Continúa el aviso
existente de bundle de más de 500 kB.

La instalación mantiene avisos de deprecación para `vue-i18n@10.0.8`, introducido por
`@intlify/vue-i18n-extensions@8.0.0`, y `glob@11.1.0`, introducido por Workbox. No se
ocultan ni se equiparan a una explotación de MangaList. La migración de esas cadenas
queda pendiente de una actualización compatible del padre o una revisión específica;
no se fuerza un override de versión mayor para silenciar la advertencia. La auditoría
actual no reporta avisos de seguridad para las versiones que quedan instaladas.

Los 5 flujos E2E Chromium también pasaron: sesión, conflicto entre pestañas, importación/
exportación, móvil y eliminación de Auth en emulador. Formato, ESLint y validación Spark
correctos. No se utilizaron cuentas de producción.
