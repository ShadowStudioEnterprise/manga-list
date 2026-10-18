# Redimensionamiento con la página abierta

Continuación H3 sobre `e1d3fe1`. Solo datos sintéticos y emuladores de Auth/Firestore;
sin publicación ni cambios remotos. Esta revisión cubre el aviso reproducido al cruzar
los cambios de diseño de biblioteca y formulario, no todas las situaciones de redimensionamiento.

## Reproducción y corrección

El ensayo cambia la misma página entre 1280, 1024, 1023, 768, 600, 599 y 320 píxeles CSS,
y vuelve a cruzar esos umbrales en ambos sentidos. Se repite primero en biblioteca y después
con nombre, capítulo y notas sin guardar. Son 13 tamaños por pantalla y motor.

Con el CSS anterior se reprodujo `ResizeObserver loop completed with undelivered notifications`
en Chromium y Firefox. Una instrumentación temporal de los observadores nativos identificó
la primera notificación a 599 píxeles, con la cabecera y el contenedor de Quasar entre los
elementos observados. La cabecera pasaba de una barra de 68 a 60 píxeles al cruzar ese umbral;
Quasar propaga su altura al contenedor de página. El aviso siguió apareciendo con la prueba
funcional completada; no se confunde su presencia con pérdida de los campos.

Se conserva la altura mínima de barra de 68 píxeles también en móvil y se retira el cálculo
móvil de página basado en 60. Los otros ajustes móviles siguen aplicándose. La barra ocupa
ocho píxeles más en pantallas pequeñas, manteniendo su altura al cambiar de ancho. La prueba
dirigida pasa en ambos motores con ese cambio. Es evidencia a favor de esa causa en este
recorrido, sin atribuir todas las posibles notificaciones a Quasar o a este CSS.

No se modifica `ResizeObserver`, sus callbacks ni las dependencias publicadas. La
instrumentación de diagnóstico se retiró. No se añade `preventDefault`, un filtro de consola,
un parche global con `requestAnimationFrame` ni una excepción que permita el aviso.

La [especificación de Resize Observer](https://www.w3.org/TR/resize-observer-1/)
describe que las notificaciones no entregadas generan un evento de error en la ventana.
El [componente de Quasar](https://quasar.dev/vue-components/resize-observer/) comunica cambios
de tamaño de elementos. Estos contratos explican qué se observa, sin certificar por sí mismos
la causa de un error concreto.

## Captura y regresión

El control previo de `pageerror` no recogía necesariamente este evento sin un objeto de
excepción. La suite portátil añade un escuchador de `error` antes de cargar la app, en todas
las páginas del contexto, y comunica las notificaciones ResizeObserver al mismo registro de
fallos mediante un binding exclusivo de pruebas. El evento sigue propagándose normalmente.
Se mantienen los controles de excepciones, avisos de historial y peticiones externas.

El nuevo escenario por motor comprueba ancho del documento igual al viewport, visibilidad
del menú móvil y de los controles, conservación de campos sin guardar y guardado posterior.
Adjunta las medidas por pantalla/ancho, incluso al fallar. Los informes solo contienen
medidas y datos sintéticos; CI los conserva siete días con las demás evidencias de navegador.

La ausencia de desbordamiento se espera mediante aserciones, no con pausas fijas. Tampoco se
recarga ni se vuelve a montar la página para cada ancho. No se afirma que todos los controles
se hayan accionado en cada tamaño ni que esto sustituya una revisión humana de accesibilidad.

## Límites

La matriz pasa a 25 recorridos (14 Chromium y 11 Firefox). Los controles de escala CDP,
portapapeles y ciclo del worker mantienen su alcance Chromium. Siguen pendientes Safari,
dispositivos reales, zoom del sistema/texto al 200 %, orientación/teclado virtual, todos los
estados de menús y el arrastre continuo de la ventana. Los saltos de ancho automatizados
comprueban transiciones concretas; no son un barrido de todos los tamaños ni una garantía
de ausencia de bucles de observación en otras pantallas.

No cambia el inventario Firebase, los presupuestos ni las reglas. Se mantiene Spark exclusivo,
sin facturación. El borrado depende de un cliente que lo continúe y no gana finalización de fondo.

## Evidencia dirigida

La prueba dirigida pasa 2/2 con la altura común. Como control negativo se reintrodujeron
temporalmente las dos reglas CSS anteriores mediante una hoja dentro de la prueba Chromium:
los campos y el guardado completaron el flujo, pero el nuevo registro recibió siete
notificaciones y falló la aserción de ausencia de errores. La inyección se retiró antes
de ejecutar la batería final. Ese contraste verifica que el control detecta la condición
reproducida; no se acepta el resultado anterior que solo comprobaba la funcionalidad.

La ejecución amplia obtuvo 24/25 casos correctos; ambos ensayos de redimensionamiento pasaron.
Falló la antigua medición instantánea de desbordamiento de una página recién montada. Se
sustituye por una espera del ancho exacto mediante aserciones; repetir los escenarios de
anchos/axe en Chromium y Firefox pasa 2/2, manteniendo los informes completos. Spark, formato
y ESLint pasan. CI vuelve a ejecutar los 25 juntos, compilaciones y ciclo PWA sobre el commit.
