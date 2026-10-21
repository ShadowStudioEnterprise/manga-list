# Roadmap hacia MangaList 1.0

La [lista de trabajo y criterios de aceptación](/reports/project/roadmap) conserva el detalle de
las auditorías. Las implementaciones y pruebas de la rama no certifican producción.

| Área          | Pendiente                                                                        |
| ------------- | -------------------------------------------------------------------------------- |
| Autenticación | Aceptación real de OAuth y recuperación de credenciales                          |
| Biblioteca    | Revisar costes medidos antes de fijar capacidad definitiva                       |
| Calidad       | Safari, dispositivos reales y revisión humana de accesibilidad                   |
| Operaciones   | Aceptación de la revisión publicada y responsables de incidentes                 |
| Cuentas       | Aprobar asistencia, retención y revisión manual del marcador                     |
| Gobierno      | Decisiones sobre licencia, canal privado de seguridad, IAM y protección de ramas |

Los topes de 10000 obras y 64 rangos siguen siendo presupuestos provisionales.
La revisión manual a los 30 días continúa pendiente de validación legal y técnica.
No existe borrado automático ni garantía de finalización si el cliente abandona.

Consulta la [especificación v1](/reports/project/specification-v1), el
[análisis ML-06 de consumo](/reports/firestore/ml-06-consumption-2026-10-20) y el
[procedimiento propuesto de revisión](/reports/accounts/manual-marker-review).

ML-07 se fusionó en el PR #6 y se publicó el 21/10/2026 como `36fe4f3`, según el
registro de publicación aportado. El bloque de transporte es 5000 más centinela,
con aperturas escalonadas y coordinación de pestañas en memoria; el límite de consulta
5001 fue aceptado. La [auditoría ML-08](/reports/firestore/ml-08-capacity-2026-10-21)
mantiene pendiente certificar capacidad y fijar un máximo definitivo. La
[reserva del 20 % y los tramos](/reports/firestore/ml-08-policy-2026-10-21) están
aprobados para planificación provisional, sin nuevos bloqueos ni cambios de producción.
