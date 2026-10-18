# Biblioteca: representación acotada y medición local

Continuación H6 sobre `30ab82b`, con Firebase Spark exclusivamente. No se cambia el límite
soportado de 1000 obras, las reglas, los índices ni los servicios. No hay despliegue.

## Cambio de comportamiento

La biblioteca muestra hasta 24 tarjetas por página. Tiene controles al principio y al final,
con nombres en español, límites desactivados y un resumen del intervalo y total. Al cambiar
página, el foco y el desplazamiento vuelven al resumen, bajo la cabecera. El resumen anuncia
el cambio; se evita anunciar de nuevo todo el contenido de las tarjetas con una región viva.

La búsqueda, los filtros, las estadísticas y la ordenación siguen usando toda la biblioteca
cargada. Se ordena y filtra antes de elegir las tarjetas de la página. Cambiar búsqueda,
estado, tipo, géneros, favoritos, orden o cuenta vuelve a la primera página. Actualizaciones
remotas conservan la página mientras siga existiendo; al reducirse el número de páginas se
ajusta a la última válida. Los empates mantienen el comportamiento del orden existente.

El orden en tiempo real puede mover una obra entre páginas, incluso tras editarla si se usa
«Actualizado recientemente». No se fija una instantánea de navegación ni un cursor estable.
La posición no se conserva al salir de la vista o recargar; no se añade almacenamiento privado.

Es paginación de presentación **en memoria**. El listener sigue consultando hasta 1001 documentos
y rechazando bibliotecas de más de 1000. Se conserva la detección de datos locales/pendientes y
el tratamiento de cuotas. No se reduce la lectura inicial ni se autoriza cargar más de 1000.
Abrir otra pestaña, reabrir la suscripción o exportar puede consumir lecturas adicionales.
Esta mejora no garantiza evitar abuso ni cuotas agotadas.

La exportación sigue obteniendo la biblioteca completa del servidor: no exporta únicamente
la página ni las coincidencias de búsqueda. Las pruebas parten de una búsqueda de una sola
obra y comprueban que JSON incluye todas las 100 o 1000 obras y la edición confirmada.

## Por qué se cambia

Una muestra de la versión anterior montaba las 1000 tarjetas y alcanzaba 128 789 nodos DOM
y 303,7 MiB de heap JavaScript usado. La nueva representación monta 24 tarjetas.

| Obras sintéticas | Tarjetas antes → después | Nodos DOM antes → después | Heap JS usado antes → después | Abrir vista antes → después | Limpiar búsqueda antes → después |
| ---------------- | ------------------------ | ------------------------- | ----------------------------- | --------------------------- | -------------------------------- |
| 100              | 100 → 24                 | 14 178 → 4668             | 48,4 → 27,3 MiB               | 399 → 181 ms                | 509 → 240 ms                     |
| 1000             | 1000 → 24                | 128 789 → 5263            | 303,7 → 31,6 MiB              | 3563 → 179 ms               | 3234 → 274 ms                    |

Son muestras individuales locales bajo Windows y Chromium 153.0.8010.12, sin simulación de CPU
ni red. No son medias, percentiles, INP/LCP ni una garantía de rendimiento. Se usa el servidor
de desarrollo y emuladores: no mide Firebase de producción, CDN, dispositivos lentos o el
bundle optimizado. La muestra anterior y la primera muestra con paginación se conservan en
[JSON de referencia](measurements/library-scale-2026-10-18.json).

`loadMs` mide abrir la vista de biblioteca con el listener ya iniciado durante la preparación,
no una carga fría ni el tiempo de una consulta nueva. `searchMs` incluye rellenar el campo,
su debounce y esperar el resultado con Playwright. `updateMs` incluye la acción de capítulo y
esperar la confirmación del emulador. No se interpreta como latencia de red pura. En las dos
muestras de 1000 obras la actualización quedó aproximadamente en un segundo; el principal
cambio observado es el coste de montar y recuperar la lista completa de tarjetas.

DOM y heap se obtienen con Chrome DevTools Protocol. Se solicita recolección de basura antes
de medir memoria para hacer explícita la condición. El heap no equivale a RAM total del
navegador ni incluye toda la memoria nativa; no se establece un límite de memoria garantizado.
Las pruebas usan notas cortas y sin fuentes: los documentos máximos permitidos pueden consumir
más memoria. Los 1000 documentos, sus datos del SDK y los filtros siguen en memoria.

## Regresiones automáticas

- Recorrido de las 42 páginas de 1000 obras, sin omisiones ni repeticiones; página final parcial.
- Cambio de búsqueda desde la última página, filtros de estado/favoritos/géneros y orden global,
  coincidencia vacía, restablecimiento de filtros y retorno a la primera página.
- Límites de página, biblioteca vacía, títulos duplicados, conservación de página al actualizar,
  ajuste al eliminar registros y cambio de cuenta, con pruebas del composable real de Vue.
- Exportación completa después de filtrar, y conservación de una actualización real de capítulo.
- Paginación a 320 píxeles, navegación con Tab/Enter, foco del resumen y auditoría axe sin excluir
  controles. Informes completos, incluidos resultados incompletos, y captura en `test-results/`.
- Registro de peticiones del navegador: durante cambio de páginas/filtros/orden no aparece otro
  `addTarget` del canal Listen. Primero se exige detectar al menos uno para evitar una prueba
  vacía. Esta comprobación no es un contador de lecturas facturables ni prueba ausencia de
  reconexiones, llamadas directas o actividad futura del SDK.

CI recoge muestras de 100 y 1000 obras en cada ejecución y conserva los informes siete días.
No se bloquea por tiempos o heap absolutos que dependen de la máquina; se exige un máximo de
24 tarjetas y menos de 12 000 nodos en esos fixtures. El presupuesto DOM es una defensa de
regresión de representación, independiente de los presupuestos de consultas de Firebase.

Las cuentas y escrituras de los fixtures solo existen en emuladores con ID `demo-mangalist`
y endpoints locales verificados. La preparación usa el contexto de pruebas con reglas omitidas;
las interacciones de la aplicación y la exportación usan la autenticación y reglas normales del
emulador. No se consultan ni modifican cuentas o bibliotecas de producción.

## Decisiones que siguen pendientes

Aceptar el máximo de 1000 obras o diseñar paginación de consultas para otra capacidad. Eso
requiere definir orden/cursor, filtros globales, estadísticas, exportación y recuperación antes
de cambiar las reglas; la presentación por páginas no resuelve esa decisión.

Quedan pendientes dispositivos reales, documentos de tamaño máximo y rendimiento de un build
optimizado. Las pruebas de instalación PWA, lectores de pantalla y redimensionamiento continuo
mantienen los límites descritos en la revisión de accesibilidad. No se promete finalización de
borrados si desaparece el cliente ni se permite pasar a Blaze para resolver escalabilidad.
