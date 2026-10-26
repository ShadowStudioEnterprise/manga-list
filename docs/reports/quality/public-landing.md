# ML-P06: landing pública

23/10/2026, Europe/Madrid. Base remota comprobada: `120efac60414fe914341f74b74096657a6bc17b4`.
Rama aislada: `feat/ml-p06-public-landing`. Esta entrega prepara un PR; no fusiona ni publica.

## Continuidad y alcance

La conversación referenciada solo devolvió referencias de contenido sin texto recuperable.
Las decisiones se fundamentan en el repositorio real: portal ML-01/02, diagramas ML-03,
contratos ML-04 y auditoría ML-05 ya integrados. La numeración ML-P06 identifica esta
landing y no el análisis histórico ML-06 de consumo Firestore.

La [portada](/) presenta el producto y el [portal técnico](/project/) conserva el
componente original y sus accesos. Guía, contratos, informes, búsqueda y rutas existentes
siguen disponibles. La Beta conserva su destino y su funcionamiento; no se modifican
`src/`, `src-pwa/`, reglas, configuración Firebase, dependencias ni lockfiles.

## Diseño y contenido

- Ink `#222139`, Paper `#faf9f6` y Violet `#4338ca`, usando los tokens existentes
  y sus variantes oscuras. Tipografía de interfaz y serif editorial del sistema;
  sin fuentes externas ni nuevos paquetes.
- Hero, beneficios, capturas reales ampliables, recorrido inicial, cinco preguntas
  con `details` nativo y CTA a la Beta. La landing no importa el cliente de Firebase.
- Capacidades contrastadas con [introducción](/guide/introduction) y
  [contratos](/reference/services): seguimiento, fuentes, filtros, importación y exportación.
  No se prometen capítulos alojados, sincronización sin conexión, capacidad ilimitada,
  precios, testimonios o disponibilidad de producción.
- Contenido pre-renderizado, un H1, secciones con nombres, enlace para saltar al contenido
  del tema, foco visible, interacción por teclado y respeto a movimiento reducido.
- Título y descripción propios, canonical limitado a la portada, Open Graph y tarjeta
  social con captura local. Los metadatos apuntan al dominio público existente;
  solo estarán disponibles allí tras una publicación posterior autorizada.

## Capturas y privacidad

Las tres imágenes se copiaron sin alteraciones desde las evidencias de la revisión del
16/10/2026. Una inspección visual previa confirmó que solo muestran obras sintéticas
«AUDITORÍA», estados, capítulos y controles. No muestran correos, UID, credenciales,
consolas de administración ni bibliotecas personales. Se publican solo las imágenes,
sin logs ni archivos de cuentas. La procedencia y las huellas constan en
`ASSET-PROVENANCE.md`.

Las capturas son históricas: no acreditan el aspecto ni el estado exacto de la versión
actualmente publicada. Ese límite aparece junto a las imágenes de la landing. Cada
captura tiene alternativa textual y enlace de ampliación; la captura móvil completa
se ofrece como recurso adicional.

## Verificación reproducible

Desde una instalación normal con los navegadores de Playwright disponibles:

```sh
npm run docs:build
npm run docs:check
npm run test:landing
node scripts/check-docs-portal.mjs
npm test
npm run lint:check
```

La prueba de landing comprueba Chromium y Firefox a 320, 390, 768 y 1440 px, en
claro y oscuro: desbordamiento, imágenes, escáner WCAG AA, FAQ por teclado,
anclas, foco, destinos CTA y recorrido al portal técnico y la guía. Comprueba
contenido sin JavaScript y metadatos en el HTML generado. Bloquea peticiones externas
y falla ante errores JavaScript, recursos fallidos o accesos de red ajenos al portal.
Los resultados y capturas quedan en `test-results/public-landing/`, conservados por CI.

La auditoría anterior del portal se mantiene sobre `/project/`, incluidas búsqueda,
diagramas, contratos y enlaces. Las pruebas automáticas no sustituyen aceptación
humana con lector de pantalla o dispositivos físicos; Safari no forma parte de esta
matriz. No se consulta ni se certifica Firebase remoto.

Resultados locales de la entrega: build documental correcto, 119/119 pruebas de
regresión correctas, 16 combinaciones de landing correctas y cero incidencias del
escáner WCAG AA en esa matriz. La prueba previa del portal técnico conserva
correctos sus recorridos, diagramas y enlaces. El control de formato/lint y el
control local Spark pasan; el inventario de seguridad del código y del build no
encuentra incidencias. La compilación conserva el aviso previo de bundles mayores
de 500 kB. No se ha ejecutado una publicación ni una prueba contra cuentas reales.

## Revisión de accesibilidad del 26/10/2026

La revisión posterior detectó que el filtro de auditoría omitía `wcag21a` y que
las dos portadas carecían de landmark principal. Las pruebas ahora incluyen los
criterios WCAG 2.1 A y AA y exigen exactamente un `main` con el H1, también en
la landing sin JavaScript. Las portadas usan el elemento semántico `main`.

La auditoría ampliada también señaló el indicador decorativo «K» del botón de
búsqueda de VitePress, que quedaba fuera del nombre accesible «Buscar en la
documentación». Se retira ese indicador visual en todos los tamaños; se conservan
el texto «Buscar», el nombre accesible y el atajo funcional. La prueba de landing
abre la búsqueda con Ctrl/Command+K, busca una referencia y la cierra con Escape.
No se cambian dependencias, la Beta o Firebase. Esta revisión se prepara en un
PR separado, sin fusión ni despliegue.
