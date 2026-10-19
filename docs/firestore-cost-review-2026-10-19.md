# Revisión de consumo Firestore — 19/10/2026

Base: `68ad6727e1c78201d7b45b217ae13a4d7cb66fc1`, coincidente con `origin/main`
al iniciar el trabajo. Rama `development/firestore-cost-review-2026-10-19`.
Solo emulador Standard, datos sintéticos y proyecto `demo-*`. Ninguna consulta a
usuarios reales, despliegue, cambio remoto, fusión, billing o servicio de pago.
La evidencia histórica de edición Standard está en `verification-spark-2026-10-18.md`;
no se ha renovado ni certificado el estado remoto en esta iteración.

## Cambio preparado y contrato

Rangos de transporte de 1000 obras con centinela (`limit(1001)`) en lugar de
500/501, dentro del máximo 1001 de las reglas existentes. No se cambia ninguna regla,
índice, esquema, dependencia ni persistencia. Se mantienen cursores por ID, rangos
disjuntos, detección de inserciones/borrados, cierre total ante fallo, exportación
completa desde servidor y rechazo de caché o datos pendientes para certificar copias.
El índice completo en memoria conserva búsquedas por fragmento, intersección de
géneros, filtros, contadores y orden global; la página visual sigue en 24 tarjetas.

10000 obras y 64 rangos siguen siendo protecciones técnicas provisionales, **no un
límite de producto aprobado**. La decisión de capacidad sigue abierta. Un rango
mayor aumenta el tamaño de cada respuesta y de una división; comprobar memoria y
latencia antes de publicar. No basta con reducir peticiones para demostrar ahorro
proporcional de cuota de documentos.

## Método reproducible y significado de las métricas

Con las dependencias instaladas del lockfile, Java 21+ y Firebase CLI 15.32.1:

```sh
npm test
node scripts/test-firestore-local.mjs
npm run test:e2e
node scripts/check-spark.mjs
npm run lint:check
```

El runner fija `demo-mangalist` y arranca únicamente Firestore local; los tests de
coste exigen `FIRESTORE_EMULATOR_HOST=127.0.0.1:8188` y usan otro namespace demo.
`tests/firestore/read-cost.test.js` compara el mismo algoritmo con parámetros
500 y 1000, fixtures de 0/100/1000/5000/10000 y reglas reales. Cuenta aperturas de
targets y documentos en la primera instantánea de servidor de cada target, evitando
contar callbacks de caché/metadatos como nuevas lecturas. Exportación cuenta
documentos recibidos y llamadas SDK. Se excluye la siembra del contador. Registra
tiempo local descriptivo, no un benchmark de latencia de producción.

Ensaya actualización desde otro contexto autenticado, `disableNetwork/enableNetwork`
y cierre/reapertura con 10000 obras. Avanza solo el reloj de admisión antes de
reabrir; no aumenta el presupuesto real 60/min ni simula reinicio de cuota diaria.
Comprueba identidad, integridad, metadatos y ausencia de listeners tras el cierre.
El JSON bruto se genera en `test-results/firestore-read-cost.json`; la copia
revisable de esta ejecución se conserva en `docs/measurements/firestore-read-cost-2026-10-19.json`.

La primera instantánea no es un contador de lecturas facturadas: puede aprovechar
caché de sesión. El emulador no mide facturación, cuotas Spark, entradas de índice,
bytes de transferencia de producción ni caducidad/revocación real de Auth. Los
targets son aperturas SDK, no sockets TCP. Reconnectar sin crear targets de
aplicación no significa cero lecturas de backend.

## Resultados observados y modelo para bibliotecas estables

Ejecución comparativa del 19/10/2026 a las 18:29:48 Europe/Madrid,
Node 24.18.0 y SDK Firebase 12.18.0. Los valores de la tabla se observaron con el
SDK y las reglas reales en emulador y coinciden con el modelo siguiente. En 10000
obras, actualización y reconexión no abrieron targets nuevos de aplicación;
reabrir desde cero sí repitió 39/19 targets y 19519/19009 documentos iniciales.
No se asigna un ahorro de cuota a la reconexión a partir de esos callbacks.
Los tiempos locales de arranque fueron 7941/5859 ms, con una sola muestra,
orden fijo 500 antes de 1000 y posibles efectos de calentamiento. No prueban una
mejora de latencia de producción ni permiten comparar dispositivos.

Para N > 0, tamaño B y P = ceil(N/B), el algoritmo abre `2P-1` targets y termina
con P activos. La suma de primeras instantáneas esperada es `N+(B+1)*(P-1)`.
Exportación devuelve `N+P-1` documentos en P peticiones. Para N=0 hay una consulta
vacía: cero documentos recibidos no significa cero cuota (mínimo por consulta).

| Obras | Targets 500 → 1000 | Activos 500 → 1000 | Documentos iniciales 500 → 1000 | Exportación 500 → 1000 |
| ----- | ------------------ | ------------------ | ------------------------------- | ---------------------- |
| 0     | 1 → 1              | 1 → 1              | 0 → 0                           | 0 → 0                  |
| 100   | 1 → 1              | 1 → 1              | 100 → 100                       | 100 → 100              |
| 1000  | 3 → 1              | 2 → 1              | 1501 → 1000                     | 1001 → 1000            |
| 5000  | 19 → 9             | 10 → 5             | 9509 → 9004                     | 5009 → 5004            |
| 10000 | 39 → 19            | 20 → 10            | 19519 → 19009                   | 10019 → 10009          |

Para 10000: 51,3 % menos aperturas, 50 % menos rangos activos, pero solo 2,61 %
menos documentos en el arranque y 1,76 % menos en arranque+exportación
(29538 → 29018). El resultado reduce presión sobre las admisiones locales, pero
no resuelve el coste del índice completo. Dos arranques+exportaciones de este tamaño
superarían por sí solos las 50000 lecturas gratuitas diarias; tampoco se garantiza
que uno quepa, por actividad compartida y otros consumos. No se fija número de usuarios.

## Escucha, reconexiones y oportunidades pendientes

- El store ya evita una segunda suscripción para el mismo UID. Búsqueda, filtros,
  orden y páginas son locales: no se añaden consultas ni se recorta su semántica.
- Una edición de un documento no requiere nuevos listeners, pero el cambio del
  documento consume lectura en cada sesión que lo escucha. Menos targets no reduce
  por sí mismo esas lecturas. Varias pestañas/dispositivos multiplican consumo.
- Con la configuración actual de Firestore sin persistencia en disco explícita,
  presupuestar una reconexión como consulta nueva: aproximadamente N documentos
  por conjunto estable, más mínimos/reglas según consulta. Con persistencia activada,
  las desconexiones de más de 30 minutos también vuelven a presupuestarse como
  consulta nueva. No se activa persistencia para datos privados en esta iteración.
- Desactivar listeners al ocultar pestaña podría ahorrar cambios recibidos, pero
  reconectar puede releer toda la biblioteca y retrasar sincronización. No adoptarlo
  sin medir duración de inactividad, frecuencia de cambios y reconexiones reales.
- La división vuelve a leer el hijo cerrado; eliminar esa duplicación requeriría
  otro contrato de rangos/caché y ensayos de inserciones/borrados concurrentes.
  Tampoco fusionar rangos vacíos automáticamente: genera relecturas inesperadas.
- Las actualizaciones con control de conflicto y cambios de capítulo leen dentro
  de transacciones y permiten hasta tres intentos. La continuación de esta rama
  [mide la contención y corrige la admisión por intento](transaction-read-budget-2026-10-19.md),
  incluidas las importaciones idempotentes. Las admisiones siguen sin representar
  cuota facturada, diaria o global ni todos los reintentos internos del transporte.
- Exportar relee deliberadamente el servidor. Reutilizar memoria sin verificación
  cambiaría el contrato de copia. Una exportación sin centinela ahorraría P-1
  documentos, pero necesitaría consulta vacía adicional en múltiplos exactos;
  beneficio pequeño, no implementado.
- No añadir búsqueda externa, contadores mediante Functions, TTL, backups ni otros
  servicios de pago. Conservar pausa de 15 minutos y recuperación manual por cuota;
  esa pausa no certifica disponibilidad de la cuota diaria.

## Decisiones que requieren seguimiento

Medir mezcla de sesiones, pestañas, reconexiones y frecuencia de exportaciones con
un plan aprobado antes de elegir capacidad definitiva, reserva de cuota y objetivo
de disponibilidad. El contador local es por pestaña y no impone un presupuesto
global diario. Un futuro cambio de semántica de búsqueda requiere decisión explícita.
Revisar memoria/latencia con dispositivos objetivo y límites de almacenamiento/salida,
además de documentos. Mantener Spark, sin vincular facturación para ampliar cuotas.

La [revisión manual del marcador](manual-marker-review.md) a los 30 días es propuesta
operativa aceptada para preparar el trabajo, sin retirada automática. Siguen
pendientes validación legal/técnica, nombres de responsables, canal de identidad,
plazos adicionales, retención del expediente y autorización por cada actuación real.

## Regresiones de esta iteración

- 78 pruebas locales pasan: cursores, errores, exportación, store, presupuestos,
  importación recuperable y protecciones Spark.
- 18 pruebas de Firestore pasan en emulador: comparación 500/1000, cambios de otro
  cliente, borrado del cursor ahora situado en la obra 999, importación interrumpida
  de 1001 filas, JSON/CSV íntegros, aislamiento, pausa de cuota y cierre de todos los
  listeners al intentar aceptar la obra 10001.
- Marcadores sintéticos de 29/30/90 días siguen bloqueando nuevas escrituras;
  un token aceptado por las reglas no obtiene permiso de retirada por antigüedad.
  Esto no prueba revocación ni expiración real de Auth.
- Los seis recorridos seleccionados de navegador pasan (4,7 minutos): escalas
  100/1000/2500/10000 en Chromium y borrado de cuenta sintética en Chromium/Firefox.
  Se conservan búsqueda/filtros/orden/páginas sin targets adicionales y exportación
  completa. En 10000 obras se recorren las 417 páginas, se muestran 24 tarjetas y
  se exportan 10000 registros. El escenario de siembra no necesitó recuperación
  del presupuesto en esta ejecución; la recuperación sí se comprueba en servicio.
  La medición de 1000 incluye revisión automatizada a 320 px y navegación de página
  por teclado. No es una auditoría manual completa de accesibilidad o dispositivos.
- En la muestra de 10000 del navegador: carga 11002 ms, búsqueda 243 ms,
  actualización 4852 ms, recorrido 86770 ms y heap JS usado 74016976 bytes
  (aproximadamente 70,6 MiB). Son valores de desarrollo local con siembra en vivo,
  no objetivos de rendimiento ni comparación controlada con producción.
  JSON revisable: [métricas de navegador](measurements/firestore-cost-browser-2026-10-19.json).
- SPA y PWA compilan con configuración demo; pasa la comprobación Spark local.
  La compilación no es autorización de publicación ni certificación del proyecto
  remoto. No se genera evidencia de despliegue de esta iteración.

Fuentes oficiales revisadas el 19/10/2026:
[consumo de consultas/listeners/reglas](https://firebase.google.com/docs/firestore/pricing),
[cuotas Spark/Standard](https://firebase.google.com/docs/firestore/quotas),
[límites del emulador](https://firebase.google.com/docs/emulator-suite/connect_firestore).
