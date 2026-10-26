# Medición de listeners en Safari — 24/10/2026

Safari real 18.6 (20621.3.11.11.3), macOS 15.7.9 (24G830), sin simulador. Revisión 6712945f9c0afa26ec6082e3b112b4fbf4c14211. Laboratorio demo local existente, 500 obras. Sesión automatizada mediante SafariDriver. Tiempos locales Europe/Madrid; JSONL en UTC.

## Causa de la medición anterior inconclusa

El auxiliar original intercepta XMLHttpRequest. En esta sesión Safari, el transporte de Firestore utiliza fetch. La captura nueva observa ambos transportes y decodifica los mensajes `reqN___data__` como JSON; cuenta propiedades `addTarget` y `removeTarget`, sin contar simples apariciones de texto. Las llamadas y sus argumentos originales se reenvían sin cambios. No se registran cuerpos de autenticación ni tokens.

El observador se instala antes del login en la primera pestaña y antes del arranque de la aplicación en la segunda y tras recargar. Para estos dos últimos pasos se usa una copia del HTML servido, con el observador delante de los mismos módulos originales de Quasar, en la ruta ignorada `capacity-results/ml09/mac-lab/listener-probe.html`. Se mantiene el mismo origen y no se modifica código versionado del candidato. Esta ruta auxiliar difiere de la raíz habitual de la aplicación.

## Observaciones

| Paso                      | Propietaria                                          | Seguidora                   | Estado                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inicio y dos pestañas     | 1 addTarget, 0 removeTarget                          | 0 addTarget, 0 removeTarget | Ambas confirman 500 obras, capítulo 6; Web Locks muestra una propiedad global.                                                                             |
| Cuota sintética           | 1 addTarget, 1 removeTarget                          | 0 addTarget, 0 removeTarget | Retirada del mismo targetId 1002; ambas pierden confirmación y locks quedan en cero.                                                                       |
| Recarga durante pausa     | 0 addTarget, 0 removeTarget desde el nuevo documento | Cerrada                     | El observador está instalado antes de arrancar la app.                                                                                                     |
| Reintento anticipado      | 0 addTarget                                          | Cerrada                     | Bloqueado, sin apertura de Listen.                                                                                                                         |
| Vencimiento sin reintento | 0 addTarget                                          | Cerrada                     | Pausa vencida sin reapertura automática, comprobada más de 15 minutos reales después de la señal y más de cinco segundos después del vencimiento.          |
| Un reintento válido       | 1 addTarget, 0 removeTarget desde recarga            | Cerrada                     | Clic único a las 01:39:52.478; addTarget a las 01:39:52.512. Recupera 500 IDs únicos, capítulo 6, favorito, servidor y cero pendientes, sin error.         |
| Estabilidad posterior     | Sigue en 1 addTarget tras más de 60 segundos         | Cerrada                     | Sin duplicados; 500 obras confirmadas, sin error ni pendientes. Una nueva petición GET del canal no contiene addTarget y no se cuenta como nuevo listener. |

La consulta observada corresponde a la colección mangas de la cuenta sintética, orden por ID y límite 5001. Las 500 obras caben en un rango. Esta medición no promete un único listener para bibliotecas mayores que requieran varios rangos.

## Artefactos y controles

- `safari-listeners-2026-10-24.jsonl`: estados y mensajes observados, con marcas de tiempo nativas.
- `safari-listen-observer.js`: observador independiente, destinado a execute/sync de WebDriver; no es un módulo de la aplicación.
- `safari-listen-observer.test.mjs` y `tests-safari-listen-observer.log`: cinco controles aprobados (fetch, XHR, exclusión de peticiones ajenas/textos, cuerpos Request sin consumir el original, y aviso de cuerpos no interpretables).
- `verificar-listeners-safari.mjs`: comprueba los criterios directamente sobre el JSONL; ejecución aprobada. Resultado estructurado: `verificacion-listeners-safari.json`. Espera medida desde la señal hasta la comprobación sin reintento: 931779 ms (15 min 31,779 s).

Se conserva el auxiliar original y sus contadores XHR históricos a cero; los contadores válidos para esta prueba están bajo `network.counters` en las filas measure, o `result.counters` en las capturas js del JSONL nuevo.

Alcance: aperturas y retiradas del protocolo Listen observadas en estas ventanas de prueba, con estado de servidor confirmado y coordinación por Web Locks. No equivale a lecturas facturadas, cuota global ni recuperación tras un reinicio real de cuota de Firebase.

Resultado: **APROBADO el punto 2 para el caso observado de 500 obras en Safari Mac**: dos pestañas comparten una sola suscripción, la cuota retira su target, el reintento anticipado no abre ninguno y un único reintento válido abre exactamente uno, estable durante más de un minuto. Cero cuerpos no interpretables en la captura. El capítulo de ensayo se restaura de 6 a 5 al terminar; se cierra la sesión SafariDriver y se retira el HTML auxiliar del servidor. El laboratorio previo permanece activo.

La incidencia separada de pérdida de búsqueda no se modifica en esta tarea y sigue impidiendo aprobar Safari en conjunto. Las 144 pruebas Node previas no se repiten porque no se ha cambiado código del candidato. La integridad del paquete vuelve a comprobarse (12 archivos). El informe consolidado está en `RESULTADOS-ACTUALIZADOS.md`; la plantilla RESULTADOS.md de la raíz se conserva con su hash original para que el lanzador siga funcionando.
