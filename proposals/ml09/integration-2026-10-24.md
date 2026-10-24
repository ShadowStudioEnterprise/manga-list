# ML-09: integración y desbloqueo de CI

24/10/2026. Integra main `7f5ff09` en la rama del PR #19; no fusiona el PR en main
ni despliega. Conserva ML-P06 y los registros Safari/iPhone ya publicados.

## Cambios revisados

- Conflictos resueltos conservando ambas entradas del registro de cambios y
  las tres disposiciones del inventario de páginas. Base de revisión documental
  actualizada al main integrado, sin reemplazar huellas del código de producto.
- serialize-javascript 7.1.2 → 7.1.4 en ambos lockfiles; fast-uri 3.1.8 → 3.1.9
  en PWA. Son actualizaciones transitivas compatibles con los rangos existentes.
  Auditoría local: cero vulnerabilidades en ambos árboles. No se desactiva el
  control de seguridad ni se eleva su umbral.
- El formato del material sellado de iPhone incumplía Prettier. Se conserva ese
  material byte por byte: dos carpetas declaradas en `.prettierignore` se excluyen
  únicamente del formateador. El producto, pruebas, scripts y demás documentación
  mantienen sus controles. Un nuevo paso CI ejecuta `scripts/check-ml09-evidence.mjs`
  y exige 37 hashes de evidencia y 21 de runtime, además de los pases registrados.
  La auditoría de credenciales sigue recorriendo todos los archivos versionados.

El código en src/ y las reglas son idénticos al head de evidencias 82fd20b;
el runtime de producto probado en Safari sigue siendo c150b0c. Las compilaciones
deben repetirse por los cambios de dependencias. Ninguna comprobación offline
repite ni amplía el alcance de los ensayos físicos registrados.

## Reproducción y estado

Usar Node 24, Java 21 y Firebase CLI 15.32.1. Instalar ambos lockfiles con npm ci.
Ejecutar auditoría de dependencias, lint:check, check:spark y el verificador de
evidencias; después npm test, docs:build, docs:check, audit:security:built,
scripts/check-docs-portal.mjs y test:landing. Ejecutar los emuladores y E2E mediante
los runners del repositorio y compilar SPA/PWA con configuración demo; verificar
ambos artefactos y test:pwa. El workflow CI conserva los resultados como artefactos.

Los CI de 6712945 siguen siendo históricos. Esta integración necesita su propio
pase completo: no se declara aprobado hasta obtenerlo y vincularlo en el PR.
ML-09 permanece abierta por la aceptación operativa y los criterios pendientes
que figuran en los informes Safari y el cuerpo del PR. No se altera Firebase remoto,
reglas desplegadas, datos reales, billing ni servicios de pago.
