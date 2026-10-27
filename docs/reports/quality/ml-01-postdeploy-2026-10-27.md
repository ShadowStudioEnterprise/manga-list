# ML-01 / PR #26: verificación postdespliegue

27/10/2026, Europe/Madrid. **PASS para los tres defectos corregidos en el PR #26.**
Este registro documenta las observaciones del portal público realizadas el
27/10/2026 entre las 10:46 y las 10:51 CET. La repetición de navegador terminó a
las 10:48:17 CET. Es evidencia fechada, no una promesa sobre futuras versiones.

## Integración y versión comprobada

El [PR #26](https://github.com/ShadowStudioEnterprise/manga-list/pull/26) se fusionó
el 26/10/2026 a las 19:58:53 CET como
`189de461de44febe73f5b0a30289ff21973c6bab`. El main consultado el 27/10,
`2aada7c1c33e2c24b8bb1b19871fbe4289ab69ed`, contiene ese merge como antecesor.
Los componentes que corrigen la 404 y el sidebar permanecían idénticos entre
ambas revisiones.

El servicio https://mangalist-docs.web.app servía la versión
`sites/mangalist-docs/versions/a92bd49679203b5d`, release
`sites/mangalist-docs/channels/live/releases/1793064698106000`, publicado el
27/10/2026 a las 02:31:38 CET. Es una publicación posterior a la auditada el día 26.
Por ello se comprobaron otra vez los defectos en el servicio público.

El registro de esa publicación vincula la versión con main
`2aada7c1c33e2c24b8bb1b19871fbe4289ab69ed`. Se contrastaron **304/304 archivos
públicos por SHA-256** con su build conservado y **752 destinos internos**, sin
diferencias ni errores. Hosting inventaría además dos archivos de inicialización
que genera el servicio. No ofrece un identificador público del SHA Git: la
atribución se apoya en el registro operativo y en la igualdad del build.

## Matriz de verificación pública

| Defecto o comprobación                                        | Estado                   | Evidencia posterior al despliegue                                                                                                                              |
| ------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 404 sin landmark principal y con nombre accesible incoherente | PASS                     | Ruta inexistente devuelve HTTP 404 real; un main y un H1; texto y nombre del enlace «Volver a la portada» coinciden; Enter vuelve a la portada                 |
| Controles anidados en el sidebar de informes                  | PASS                     | Sin botones ni roles button anidados; ocho grupos con botón nativo y aria-expanded; Space cambia el estado y Enter lo restaura en cada grupo                   |
| 28 variantes históricas .html que devolvían 404               | PASS                     | 28/28 devuelven 301 al destino previsto, que responde 200; forman parte de las 57/57 redirecciones comprobadas                                                 |
| Accesibilidad y responsive de las páginas afectadas           | PASS                     | 16 escaneos completos de Axe: 320, 390, 768 y 1440 px, claro/oscuro; cero violaciones y sin overflow del documento; sidebar móvil abierto durante su auditoría |
| Enlace legacy profundo                                        | PASS                     | /specification-v1.html redirige al informe, conserva el ancla y funciona tras recarga                                                                          |
| Consola y red de esos flujos                                  | PASS                     | Cero excepciones JavaScript, mensajes inesperados o fallos de red; los 404 deliberados se registran aparte                                                     |
| Navegador y aceptación humana adicionales                     | BLOCKED / no certificado | Esta repetición usa Chromium real; no certifica Safari, dispositivos físicos ni lector de pantalla                                                             |

La comprobación del 27/10 es **específica de los defectos del PR #26**. No se
presenta como una nueva ejecución de los 226 estados de la auditoría completa del
26/10. Las comprobaciones `incomplete` de Axe y la aceptación humana conservan
sus límites: cero violaciones automáticas no certifica conformidad WCAG integral.
Los enlaces administrativos que requieren permisos tampoco se convierten en PASS.

## Capturas del servicio público

![404 publicada con encabezado y enlace de recuperación en español](/measurements/ml01-postdeploy-2026-10-27/404-1440-light.png)

![Sidebar móvil abierto, en modo oscuro, con controles de grupo separados de sus encabezados](/measurements/ml01-postdeploy-2026-10-27/sidebar-320-dark.png)

[404 móvil en oscuro](/measurements/ml01-postdeploy-2026-10-27/404-320-dark.png) ·
[Foco de teclado en el sidebar](/measurements/ml01-postdeploy-2026-10-27/sidebar-keyboard-focus.png).

## Evidencias descargables

- [Resumen de resultados](/measurements/ml01-postdeploy-2026-10-27/summary.json).
- [Integración del PR en main](/measurements/ml01-postdeploy-2026-10-27/pr-integration.json) y
  [comparación de los componentes corregidos](/measurements/ml01-postdeploy-2026-10-27/source-comparison.json).
- [Versión activa observada](/measurements/ml01-postdeploy-2026-10-27/hosting-current.json) y
  [registro de su publicación](/measurements/ml01-postdeploy-2026-10-27/publication-provenance.json).
- [Resultados de navegador, teclado, redirecciones y Axe](/measurements/ml01-postdeploy-2026-10-27/defect-verification.json).
- [Hashes del build y comprobación de destinos internos](/measurements/ml01-postdeploy-2026-10-27/release-file-parity.json).
- [Manifiesto SHA-256 de estos archivos](/measurements/ml01-postdeploy-2026-10-27/manifest.json).

La traza HAR sin cuerpos y los scripts originales se conservan en el expediente
local `audit-evidence/ml01-postdeploy-20261027/`; esta página publica los resultados
y las capturas necesarios para revisar los tres defectos.

## Conclusión y alcance

**PR #26 integrado y sus tres correcciones verificadas en la versión pública
observada el 27/10/2026.** La prueba ratifica el cierre técnico de ML-01 en ese
alcance. La integración del código, CI y la publicación de Hosting se distinguen:
los PASS de esta página proceden de peticiones y navegación contra el servicio
público, no de inferir su estado a partir de CI.

Durante aquella verificación no se modificaron código, Hosting, reglas, billing,
usuarios ni datos. La incorporación de este informe al repositorio no significa
que esta página ya esté publicada; requiere su propia fusión y despliegue.
