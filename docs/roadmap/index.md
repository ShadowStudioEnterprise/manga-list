# Roadmap hacia MangaList 1.0

La [lista de trabajo y criterios de aceptación](/reports/project/roadmap) conserva el detalle de
las auditorías. Las implementaciones y pruebas de la rama no certifican producción.

ML-01 tiene [cierre técnico con verificación pública posterior al PR #26](/reports/quality/ml-01-postdeploy-2026-10-27):
404, sidebar y 28 variantes legacy comprobados de nuevo el 27/10/2026, con capturas
y evidencia de la versión observada. Se conservan los límites de aceptación humana
y dispositivos; este registro no cierra otras tareas de calidad.

[ML-16: validación Android físico del 27/10/2026](/reports/quality/ml-16-android-2026-10-27)
conserva los PASS acreditados y sigue abierta: entrada natural en Doze profundo y
transición WiFi↔datos móviles quedan pendientes por indicación del usuario.

[ML-09: defensas y recuperación Spark](/reports/firestore/ml-09-recovery-2026-10-23)
presenta la implementación candidata y sus pruebas reproducibles. Sigue abierta
hasta aceptar redes/dispositivos, consumo agregado y procedimiento de incidente
en producción; fusión y despliegue requieren autorización separada.

| Área          | Pendiente                                                            |
| ------------- | -------------------------------------------------------------------- |
| Autenticación | Aceptación real de OAuth y recuperación de credenciales              |
| Biblioteca    | Revisar costes medidos antes de fijar capacidad definitiva           |
| Calidad       | Safari, dispositivos reales y revisión humana de accesibilidad       |
| Operaciones   | Aceptación de la revisión publicada y responsables de incidentes     |
| Cuentas       | Aprobar asistencia, retención y revisión manual del marcador         |
| Gobierno      | Canal privado de seguridad, IAM y seguimiento de protección de ramas |

Los topes de 10000 obras y 64 rangos siguen siendo presupuestos provisionales.
La revisión manual a los 30 días continúa pendiente de validación legal y técnica.
No existe borrado automático ni garantía de finalización si el cliente abandona.

Consulta la [especificación v1](/reports/project/specification-v1), el
[análisis ML-06 de consumo](/reports/firestore/ml-06-consumption-2026-10-20) y el
[procedimiento propuesto de revisión](/reports/accounts/manual-marker-review).

ML-14 (licencia Apache-2.0 y avisos) y ML-02/03 están integrados; véase la
[auditoría de vigencia](/maintenance/documentation-audit) para separar fusión,
pruebas y registro histórico de publicación.

ML-07 se fusionó en el PR #6 y se publicó el 21/10/2026 como `36fe4f3`, según el
registro de publicación aportado. El bloque de transporte es 5000 más centinela,
con aperturas escalonadas y coordinación de pestañas en memoria; el límite de consulta
5001 fue aceptado. La [auditoría ML-08](/reports/firestore/ml-08-capacity-2026-10-21)
mantiene pendiente certificar capacidad y fijar un máximo definitivo. La
[reserva del 20 % y los tramos](/reports/firestore/ml-08-policy-2026-10-21) están
aprobados para planificación provisional, sin nuevos bloqueos ni cambios de producción.

ML-13 añade [auditoría IAM y privacidad](/security/iam-audit), inventario público y
controles offline. La aceptación de IAM real, canal privado y responsables sigue
pendiente; no se certifica cierre operativo ni se despliega esta rama.
