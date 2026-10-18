# Reproducción del aviso de historial y regresión

Continuación sobre `0049048`, con Auth y Firestore emulados y Firefox 155.0 de Playwright.
El aviso observado era `VUE_ROUTER_R0121`. No se ha modificado el router ni el estado de
historial de la aplicación para ocultarlo; el cambio corrige el recorrido de prueba.

## Evidencia causal local

El ayudante de alta de obra ya volvía a la biblioteca mediante «Volver a la biblioteca».
La prueba de teclado ejecutaba después `page.goto('/#/library')` sobre esa misma URL.
Se observaron estos valores antes y después de esa operación en Firefox:

| Momento                                   | Estado observado                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| Después del enlace de la aplicación       | `current: '/library'`, `position: 2`, resto de campos de Vue Router presentes |
| Después de repetir la URL con `page.goto` | `history.state === null`                                                      |
| Siguiente enlace del router               | Aviso `VUE_ROUTER_R0121`; el recorrido terminaba correctamente                |

Es una reproducción específica de la navegación de prueba, no evidencia de que el diálogo
borre el historial. La revisión del código local no encontró llamadas a `pushState` o
`replaceState` en `src/`; el plugin de historial de Quasar revisado solo actúa en
Cordova/Capacitor. No se atribuye ese comportamiento a una vulnerabilidad o pérdida de datos.

[Vue Router documenta](https://router.vuejs.org/guide/migration/#usage-of-history-state)
que necesita conservar su estado de historial. Añadir un estado inventado, sustituirlo por
un objeto vacío o silenciar el aviso habría ocultado la condición. Se elimina únicamente
el `goto` redundante y se comprueba que el router está en `/library` antes de seguir.
Las entradas iniciales y enlaces profundos de otras pruebas conservan su cobertura.

## Nuevas comprobaciones

La suite portátil escucha la consola de todas las páginas del contexto y falla si aparece
`VUE_ROUTER_R0121`, además de mantener el rechazo de errores no controlados y peticiones
externas. El control se añade tanto en Chromium como en Firefox; no introduce una lista
que silencie otros avisos ni se instala en la aplicación publicada.

Un nuevo escenario por motor comprueba:

1. La biblioteca tiene ruta y posición válidas en el historial tras guardar una obra.
2. Editar el capítulo del diálogo y cerrarlo con Escape devuelve el foco al botón sin
   cambiar la posición ni guardar el valor cancelado.
3. El enlace «Añadir» crea la entrada siguiente del router.
4. Atrás vuelve a la biblioteca con su capítulo original; Adelante recupera el formulario.
5. Volver de nuevo y recargar conserva el capítulo y un estado del router válido.

No se fuerza `history.state`, no se llama al router desde el test ni se usa una pausa fija
para dar por terminada la navegación. Las comprobaciones esperan las rutas y controles
visibles. El capítulo se verifica también tras recarga para evitar confundir estado visual
con el valor confirmado del emulador.

## Límites

La suite pasa a 23 recorridos: 13 Chromium y 10 Firefox. No certifica todas las entradas
del historial, la barra de direcciones, extensiones, Safari, dispositivos reales ni el
comportamiento de Atrás mientras un diálogo permanece abierto. Escape es la cancelación
comprobada. Las pruebas no añaden escrituras a cuentas reales ni cambian cuotas o servicios.
Spark sigue siendo el único plan permitido; el aviso de ResizeObserver conserva su revisión
pendiente. El borrado sin cliente no gana un mecanismo de finalización automática.

## Resultado local

23/23 recorridos correctos: 13 Chromium y 10 Firefox, con el rechazo del aviso de estado
activo en la suite portátil. La navegación de teclado y el nuevo caso de historial pasan
en ambos motores. Spark, formato y ESLint correctos. La desconexión intencionada conserva
los avisos de transporte de Firestore esperados; no se confunden con el diagnóstico del router.
CI vuelve a comprobar regresiones, reglas, auditorías, compilaciones y ciclo PWA sobre el commit.
