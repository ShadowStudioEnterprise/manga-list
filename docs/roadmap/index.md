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

La [propuesta ML-07](/reports/firestore/ml-07-sync-2026-10-20) aumenta el bloque de transporte
a 5000 y escalona las aperturas y coordina pestañas en memoria. Revisión, aceptación de
capacidad Spark y transición de reglas/cliente permanecen pendientes.
