# ML-09 — Aceptación de riesgo residual por abuso autenticado

Fecha: 8 de noviembre de 2026 · Referencia de código: `origin/main` en `9bf5972`

## Decisión

El titular del proyecto acepta, para MangaList 1.0, el riesgo residual descrito en este documento (hallazgos H01 y H02 de la auditoría ML-09/ML-13) y difiere las medidas que lo reducirían parcialmente. La aceptación no se extiende a los puntos pendientes de revisión en consola, listados más abajo.

## Riesgo aceptado

Un usuario autenticado puede, saltándose la aplicación, consumir las cuotas diarias del proyecto: las reglas de Firestore validan identidad, forma de los datos y límite de consulta, pero no limitan el ritmo de peticiones ni el total de documentos o lecturas por usuario.

- Cuotas gratuitas del plan Spark según la documentación de Firestore consultada el 8 de noviembre de 2026: 50.000 lecturas, 20.000 escrituras y 20.000 borrados por día, 1 GiB almacenado y 10 GiB mensuales de transferencia saliente. Son cuotas del proyecto y se reinician hacia la medianoche del huso del Pacífico.
- Impacto esperado: indisponibilidad temporal hasta el reinicio de la cuota. No hay facturación, por lo que no hay coste económico.
- Las lecturas que las reglas realizan con `get`, `exists` o `getAfter` se cobran como lecturas según esa documentación. El consumo real por operación debe medirse en la tarea ML-08.

## Evidencia

- Auditoría estática sobre `origin/main` en `9bf5972` (copia local, no versionada). Sin ejecución de pruebas de explotación ni inspección de la configuración remota.
- Segunda revisión independiente contra el código con citas de línea: 25 afirmaciones evaluadas; 17 confirmadas, 6 matizables, 2 no verificables con el repositorio y ninguna contradicha.
- Hallazgos de severidad alta: H01 (escrituras y borrados propios sin contador ni intervalo en reglas) y H02 (lecturas, páginas y listeners propios sin presupuesto acumulado en servidor).

## Mitigaciones vigentes

- Reglas: aislamiento por UID, forma y límites de los datos, límite explícito de 5001 documentos por consulta y barrera `deleting` para cuentas en eliminación.
- Cliente (no constituye una frontera de seguridad): presupuesto de admisión, backoff y recuperación ante cuota agotada (ML-09).
- Operaciones: procedimientos de incidente y recuperación (ML-20).

## No cubierto por esta aceptación

- Restricciones efectivas de las claves de API, protección contra enumeración de cuentas, ajustes de Authentication e IAM: revisión de consola pendiente (ML-13).
- Ninguna medida contemplada elimina el abuso por parte de un usuario autenticado.

## Condiciones de revisión

Se reabre esta decisión si ocurre alguna de estas circunstancias:

- Agotamiento de cuota atribuible a abuso, o indicios de él.
- Crecimiento notable de usuarios o campaña de difusión de la landing pública.
- Cambio de plan, de la política Spark o activación de nuevos servicios.
- Cambios en las reglas de Firestore que afecten a creación, lectura o borrado de obras.

## Decisiones diferidas

- App Check: requiere modificar `spark-policy.json` y `scripts/check-spark.mjs`, que hoy vetan su uso. Antes de forzar su aplicación debe verificarse el comportamiento al agotar la cuota del proveedor en Spark.
- Cupo de escrituras sobre Firestore (contadores o slots) como diseño separado.
- Endurecimiento de reglas: límite de `offset` e intervalo mínimo entre actualizaciones de un mismo documento.

## Aprobación

Titular del proyecto: aprobado el 8 de noviembre de 2026.
Próxima revisión: 9 de noviembre de 2027.
