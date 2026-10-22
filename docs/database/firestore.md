# Firestore

MangaList utiliza la base Standard nativa `(default)` del proyecto
`mangalist-61bb8`. Authentication identifica al propietario mediante su UID.

## Modelo

El [diagrama de datos y aislamiento UID](/architecture/diagrams#datos-y-aislamiento-uid)
relaciona las rutas con la autorización. El [flujo de carga](/architecture/diagrams#carga-y-paginacion)
distingue los rangos Firestore de las páginas visuales de 24 tarjetas.

| Ruta                      | Contenido                                              |
| ------------------------- | ------------------------------------------------------ |
| `users/{uid}`             | Fechas de cuenta y estado opcional `deleting`          |
| `users/{uid}/mangas/{id}` | Obra del esquema 1, capítulo, estados, fuentes y notas |

Las reglas validan campos, tipos, tamaños y timestamps, y permiten acceso solo al
propietario. La [especificación](/reports/project/specification-v1#modelo-de-datos-de-la-rama)
detalla el esquema. El marcador de borrado bloquea nuevas altas y actualizaciones;
el cliente no puede retirarlo para desbloquear la cuenta.

## Consultas y sincronización

La propuesta ML-07 carga hasta 10000 obras con rangos disjuntos ordenados por ID
acotados a 5001 documentos, incluyendo el centinela de exceso. Coordina pestañas
del mismo origen/proyecto/cuenta mediante Web Locks y BroadcastChannel sin persistir
la biblioteca en disco. La exportación usa cursores de hasta 5001 documentos.
La interfaz filtra y ordena globalmente antes de presentar páginas de 24 tarjetas.

Las reglas propuestas permiten como máximo 5001 por consulta; no imponen una cuota
diaria. El cliente nuevo requiere esas reglas: su transición queda pendiente de
revisión y autorización separada. No se ha aplicado ningún cambio remoto.

El exceso de presupuesto produce un error explícito y cierra la suscripción;
no entrega una biblioteca parcial. Las transacciones tienen hasta tres intentos.
Un intento, consulta o listener no equivale a una única lectura facturable.

## Referencias técnicas

- [ML-07: decisión, compatibilidad y mediciones](/reports/firestore/ml-07-sync-2026-10-20).

- [ML-06: escenarios y presupuesto Spark compartido](/reports/firestore/ml-06-consumption-2026-10-20).
- [Diseño de cursores y condiciones de índices](/reports/firestore/firestore-cursors-v1).
- [Medición de lecturas y listeners](/reports/firestore/firestore-cost-review-2026-10-19).
- [Presupuesto de transacciones](/reports/firestore/transaction-read-budget-2026-10-19).
- [Validación con 10000 obras](/reports/firestore/verification-10000-2026-10-19).
- [Exportación verificada](/reports/features/synchronization-and-export).

Cambiar consultas o presupuestos requiere revisar reglas, índices y coste con
evidencia nueva. Este portal no despliega reglas ni modifica datos.
