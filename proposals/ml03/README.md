# ML-03 · Diagramas técnicos

Rama `codex/ml03-technical-diagrams`, base `aee70706fbd638e164a7df16f75b1bee2a2d24c9`.
Entrega para revisión en PR borrador; sin fusionar ni desplegar.

## Implementación

Nueve SVG originales en `docs/public/diagrams/` y su página
`docs/architecture/diagrams.md`: componentes, Firestore/UID, Auth,
pestañas/dispositivos, carga/paginación, importación, exportación/copia dividida,
eliminación ordinaria y revisión manual propuesta. Cada uno tiene alternativa
textual, fuentes fijadas al SHA auditado y enlace al SVG completo.

Se conserva el tema ML-02 y las 68 rutas previas. Navegación y enlaces contextuales
desde guía, arquitectura, datos y registro de informes. Sin dependencias nuevas.
La revisión manual se identifica como propuesta sin activar; el código integrado
no se presenta como comprobación nueva del despliegue efectivo.

## Auditoría de base

Git actualizado antes de crear esta rama. PR #15 ML-02 confirmado por API como
fusionado, commit `aee7070`; la rama `163a098` es antecesora y su árbol coincide
con la base. Código revisado: Router, boot, Pinia, servicios, reglas, paginación
y pruebas. Las respuestas del chat de origen no ofrecieron contenido recuperable.

## Evidencia local

- [Resultado estructurado](evidence/results.json).
- [Rutas conservadas](evidence/routes.json).
- [Auditoría de base](evidence/audit.json).
- [Móvil claro, página completa](evidence/diagrams-light-320.png).
- [Escritorio oscuro, página completa](evidence/diagrams-dark-1440.png).
- [Detalle de componentes, móvil claro](evidence/component-detail-light.png).
- [Detalle de revisión propuesta, móvil oscuro](evidence/manual-detail-dark.png).
- [Compilación](evidence/docs-build.log), [lint](evidence/lint.log),
  [Spark local](evidence/spark.log) y [12 pruebas Spark](evidence/spark-tests.log).

El [informe del portal](../../docs/reports/development/ml-03-diagrams-2026-10-22.md)
describe alcance y límites. El comprobador del portal usa localhost y bloquea
tráfico externo. Chromium revisa imágenes, XML, recorte, contraste, ocho tamaños/temas
de diagramas y ocho de portada, accesibilidad, búsqueda, teclado y enlaces;
Firefox comprueba navegación móvil y la página de diagramas.

## Reproducción

Node 24.18.0 y las dependencias del lockfile. Preparar el proyecto y disponer
de Chromium/Firefox de Playwright; no es necesario configurar Firebase.

```sh
npm ci
npm run docs:build
npm run lint:check
npm run check:spark
node --experimental-vm-modules --test tests/spark.test.js
node scripts/check-docs-portal.mjs
git diff --check
```

La CI incluye ahora el comprobador del portal. El aviso de bundle mayor de
500 kB de VitePress permanece visible; no se silenció. Las pruebas no certifican
Safari, dispositivos físicos, accesibilidad humana completa, cuotas reales,
OAuth real, reglas desplegadas o estado remoto Spark. No se ejecutaron comandos
de despliegue ni controles Spark con `--remote`, ni se accedió a Firebase remoto.
