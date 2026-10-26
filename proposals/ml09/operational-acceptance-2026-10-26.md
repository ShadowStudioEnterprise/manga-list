# ML-09: aceptación del candidato y publicación autorizada

26 de octubre de 2026. Responsable: propietario del proyecto, mediante confirmación expresa en el chat de trabajo.

El propietario aceptó el candidato `28d876d394dc3e5bf458303abd181f10ecb33b3b` y el procedimiento de incidencias con los pendientes indicados. Después autorizó fusionar y desplegar conservando esos pendientes. La integración posterior con `main` incorpora únicamente documentación de ML-16 y este registro; las fuentes, contratos y configuración del candidato aceptado se conservan.

## Alcance autorizado

- Fusionar el PR #19 tras cumplir las comprobaciones obligatorias del repositorio.
- Publicar la aplicación estática en el destino `hosting:app` del proyecto `mangalist-61bb8`, con sus controles Spark, compilación PWA y verificación de release intactos.
- Conservar errores y escrituras pendientes; evitar operaciones masivas y reintentos en bucle; distinguir presupuestos locales de cuota global; recuperar de forma explícita y confirmar integridad y sincronización antes de cerrar una incidencia.

La reserva del 20 % y la planificación de 40000 lecturas, 16000 escrituras y 16000 borrados diarios siguen siendo provisionales y administrativas. No garantizan disponibilidad global. La autorización no incluye modificaciones de reglas desplegadas, datos reales, Auth, IAM, facturación o servicios de pago.

## Pendientes conservados

**ML-09 permanece abierta para aceptación operativa completa**, aunque se autorice publicar sus defensas verificadas.

- Red celular representativa, pérdida física de conectividad y recuperación con integridad, búsqueda y sincronización comprobadas.
- Suspensión completa de Android; el bloqueo de pantalla o freeze de la pestaña registrados no bastan.
- Guardado, recuperación y comparación de exportación en Archivos de iOS, si se mantiene este criterio.
- Consumo agregado representativo, almacenamiento y transferencia actuales, métricas de índices disponibles y revisión de causa de los errores agregados de reglas observados.
- Recuperación tras reinicio global de cuota durante una incidencia real, sin provocar agotamiento.

El ensayo celular desde Windows del 26 de octubre no fue superado. Se registraron biblioteca sin confirmación y fallos de transporte de la pasarela externa; el acceso se cerró. Las 500 obras sintéticas se verificaron intactas en el emulador. Este ensayo no demuestra agotamiento de Firebase ni recuperación y no sustituye las comprobaciones pendientes. Los ajustes posteriores de esa pasarela son instrumentos locales ajenos al código que se fusiona.

## Evidencia y resultado de publicación

La evidencia técnica del candidato y sus límites históricos están descritos en [la integración del 25 de octubre](./integration-2026-10-25.md). La aceptación humana no convierte observaciones parciales en pruebas superadas.

Este registro conserva la autorización y el alcance; por sí solo no acredita que la fusión o el despliegue hayan terminado. El resultado debe identificar revisión final, CI, comprobación Spark reciente, release de Hosting, hashes y verificación pública. Si falla un control obligatorio, el despliegue se detiene sin retirar el control.
