# ML-14 — verificación de iconos originales y entrega de licencias

Fecha: 22/10/2026. Implementación en la rama del PR #13, sin fusión ni despliegue.

## Resultado

Los dos pendientes técnicos detectados en la auditoría anterior se han resuelto
en esta rama:

- Los 16 archivos gráficos heredados se sustituyen por un diseño original de
  libro con marcador. Se añade su SVG editable, generación reproducible local y
  [procedencia](../../ASSET-PROVENANCE.md), con [hashes y dimensiones](../../docs/measurements/ml14-original-icons.json).
  Los archivos nuevos están bajo Apache-2.0; no se presume permiso sobre los
  gráficos de versiones anteriores. El diseño no importa imágenes, fuentes o
  logotipos de terceros ni afirma exclusividad de marca.
- `scripts/legal-notices.mjs` incorpora LICENSE, NOTICE, alcance, procedencia y
  las dos recopilaciones de textos de terceros a SPA, PWA y portal, con un índice
  legible `legal/index.html`. La interfaz y el pie del portal enlazan a esos textos.
  Los archivos se emiten durante la compilación, antes de que Workbox calcule el
  precaché. No se cambia la política de activación del worker.

Los textos se conservan completos, sin traducir o abreviar cláusulas. El build
falla si falta una fuente legal requerida. El mecanismo no sustituye la revisión
de licencias cuando se incorporen nuevas dependencias o recursos.

La configuración de desarrollo sirve los mismos archivos definidos de antemano;
no permite seleccionar rutas arbitrarias del sistema de archivos. La página legal
no necesita sesión ni conexión con Firebase. Sus enlaces de la aplicación abren
una pestaña separada para conservar el formulario en curso.

## Comprobaciones ejecutadas

- Formato y lint correctos; diff sin errores de espacios.
- 115 pruebas de regresión correctas, incluidas parada ante NOTICE ausente y
  comprobación de sustitución/hashes de todos los assets heredados.
- Compilaciones SPA, PWA y portal correctas. Aplicación compilada solo con los
  seis valores ficticios de `demo-mangalist`; no se usan valores de producción.
- Tres pruebas PWA correctas: igualdad completa de los textos en las tres salidas;
  consulta de la página y de los seis documentos sin conexión; conservación del
  comportamiento de actualización pasiva del worker y de entrada sin guardar.
- Inspección visual del icono de 512 píxeles; PNG e ICO generados localmente, sin red.
- Control local Spark correcto, sin afirmar certificación remota de plan o permisos.

Una prueba de enlaces simbólicos existente falló inicialmente por la restricción
del entorno aislado. La suite completa se repitió con el acceso local necesario y
pasó 115/115; no se cambió ni se debilitó la prueba.

Los builds locales tienen fuente en edición y son exclusivamente de demostración.
No son candidatos de producción; CI debe validar la revisión comprometida por sus
propios medios. La compilación muestra el aviso habitual no bloqueante de chunks
mayores de 500 kB.

## Límites conservados

Apache-2.0 cubre las aportaciones originales conforme al alcance; las licencias de
terceros, marcas, contenido de usuarios y obras enlazadas permanecen separadas.
No se modifican reglas, permisos remotos, datos de usuarios, facturación ni Spark.
No se añaden dependencias ni workflows y no se autoriza fusión o despliegue.

La revisión de nuevas aportaciones y de materiales ajenos continúa siendo una
obligación de mantenimiento; no se presenta esta verificación como una garantía
jurídica de inexistencia de derechos de terceros.
