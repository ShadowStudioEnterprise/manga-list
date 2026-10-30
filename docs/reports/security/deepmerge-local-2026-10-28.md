# Corrección local de deepmerge en la compilación PWA

28/10/2026, Europe/Madrid. Propuesta aislada, sin merge ni despliegue.

La auditoría PWA de ML-15 falla por
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4):
Workbox 7.4.1 → Rollup node-resolve 16.0.3 → deepmerge 4.3.1. No se ha publicado
una versión corregida de deepmerge. La bajada automática a Workbox 5.1.4 cambia
la versión principal del generador; no se aplica.

## Cambio preparado

Se añade `vendor/deepmerge-safe`, un fork privado del bundle CommonJS de deepmerge
4.3.1, con licencia MIT, atribución, integridad del paquete original y hash de la
distribución original en provenance.json. No se presenta como release de upstream.

El parche rechaza las claves `__proto__`, `constructor` y `prototype` tanto en el
origen como en el destino, usa propiedades de datos propias y falla si un proxy
impide inspeccionar el destino. Esas claves dejan de admitirse aunque sean propias;
el resto de la API se conserva, incluidas opciones y símbolos. Los callbacks de
personalización son código de confianza, no un entorno aislado de seguridad.

`src-pwa/package.json` declara la copia local como dependencia de desarrollo y
la referencia mediante `$deepmerge` en overrides. Workbox continúa en 7.4.1;
Rollup node-resolve, en 16.0.3. No hay cambios en la aplicación, Firebase remoto,
reglas, IAM o billing. Spark exclusivamente.

La copia local queda incluida en las huellas de entradas críticas del build:
código, package.json, licencia y procedencia. Cambiarla después de compilar invalida
la verificación del artefacto aunque el lockfile no cambie.

## Validación y mantenimiento

- PASS: instalación limpia `npm ci --prefix src-pwa --ignore-scripts` y carga de
  la dependencia efectiva desde el contexto de Rollup.
- PASS: 13 tests nuevos de seguridad y compatibilidad, incluidos prototipos nulos,
  claves propias, origen/destino, anidamiento, arrays, símbolos, opciones y proxies.
- PASS: test adicional que modifica el código local después de crear evidencia y
  comprueba que se rechaza el build. Suite unitaria completa: 169/169.
- PASS: ambas auditorías npm a nivel low, sin cambiar el comando protegido, añadir
  excepciones ni reducir el umbral. Check Spark local correcto.

Las primeras resoluciones con un override directo a file produjeron un lockfile
incompleto o un enlace incorrecto al ejecutar npm ci. Se descartaron; el test de
carga efectiva detectó el enlace roto. La resolución final usa una dependencia
directa con el mismo nombre y una referencia `$deepmerge`. No se acepta un resultado
de audit cero si el generador no carga realmente el código corregido.

El registro de npm no evalúa este fork privado. Cero avisos no demuestra por sí
solo que el parche sea correcto: CI debe pasar también los tests, los builds y
la suite PWA. Los resultados de artefactos y del CI se consignan en la PR de esta
corrección. Los PASS anteriores de ML-15 no certifican esta dependencia nueva.

Mantener el fork y los tests hasta que upstream o una sustitución compatible
resuelvan el problema. Entonces retirar dependencia/override/fork y repetir
instalación limpia, seguridad, builds y PWA. No publicar el paquete privado ni
actualizar su implementación sin revisión y validación.

ML-15 sigue abierta por sus aceptaciones reales pendientes. Esta corrección del
generador no acredita OAuth, cambio de email alojado, revocación ni Safari/iOS.
