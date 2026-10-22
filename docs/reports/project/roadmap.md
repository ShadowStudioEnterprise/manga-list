# Roadmap tras la auditoría del 16/10/2026

ML-08 añade una [copia dividida con recuperación reanudable](../features/multipart-backup-2026-10-21.md)
para revisión en el PR borrador #7. No está desplegada. El usuario aprobó por separado
la [reserva del 20 % y los tramos](../firestore/ml-08-policy-2026-10-21.md)
para planificación provisional; siguen pendientes capacidad garantizada y máximo definitivo.

ML-06 cuenta con [análisis reproducible de consumo por escenarios](../firestore/ml-06-consumption-2026-10-20.md)
desde main del 20/10/2026: tamaños 100/1000/2500/5000/10000, admisiones frente a
documentos observados y cuota modelada, reconexiones, pestañas y presupuesto Spark
compartido. No aprueba capacidad operativa ni modifica producción; las recomendaciones
de ahorro y la mezcla de uso siguen pendientes de decisión.

Los puntos pendientes requieren evidencia nueva; no se consideran cerrados por estar
incluidos en esta lista. La validación local de esta rama no certifica producción.

| Prioridad     | Trabajo y estado                                                                                                   | Criterio de aceptación                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2 confirmado | Aviso de conflicto persistente: corregido en esta rama                                                             | Conflicto preserva borrador, recuperar/descartar y volver a biblioteca sin banner falso; fallo real del listener puede reintentarse.                                                                                                 |
| P1 / H2       | Borrado concurrente: mitigación cliente/reglas en esta rama; reanudación Spark acotada; cierre operativo pendiente | Solo Spark: lotes cliente reanudables y pruebas de interrupción/cuotas. Aprobar responsable de recuperación manual y retención del marcador; no prometer finalización sin cliente.                                                   |
| P1 / H8       | Dependencias: correcciones revisadas en esta rama; auditoría sin avisos conocidos al 18/10                         | Ambos lockfiles actualizados, auditoría continua en CI y pruebas completas. Revisar el override gRPC al actualizar Firebase y las dependencias transitivas sin mantenimiento.                                                        |
| P1 / H1       | Aceptación operativa pendiente                                                                                     | Con permiso explícito, identificar SHA publicado; OAuth Google, recuperación completa, configuración/reglas efectivas y aislamiento. Conservar cuentas sintéticas actuales.                                                          |
| P1 / H3       | Accesibilidad y responsive: primera revisión local; PWA de dispositivos pendiente                                  | Validar teclado, lector de pantalla, contraste, 320 px, tablet y dispositivos; instalación y actualización reales, con evidencia fechada.                                                                                            |
| P2 / H4       | Protección de main y trazabilidad                                                                                  | Con autorización para configuración remota, exigir CI y revisión; conservar trazas de fallos, identificar versión y procedimiento de rollback compatible con marcadores.                                                             |
| P2 / H5       | Importación recuperable tras recarga: implementada para IDs v1                                                     | IDs estables por cuenta/archivo/fila y transacciones: reintentos, respuesta perdida, concurrencia y recarga probados. Requiere reseleccionar el mismo archivo; sin trabajador de fondo.                                              |
| P2 / H6–H7    | Sincronización y exportación: metadatos y lectura del servidor implementados                                       | Metadatos caché/pendientes/servidor y exportación comprobada con pruebas de desconexión. Borradores de pestaña opcionales y aviso PWA pasivo implementados; validación real en dispositivos pendiente.                               |
| P2 / H6       | Escala de biblioteca: presentación de 24 tarjetas y mediciones locales                                             | Medir tiempos/memoria con tamaños acordados, decidir paginación/virtualización según resultados, ampliar pruebas de filtros y fuentes.                                                                                               |
| P2 / H8       | Operación pública                                                                                                  | Inventariar controles, App Check si procede, alertas/cuotas y revisión de dependencias continua; cambios remotos requieren aprobación.                                                                                               |
| P3 / H9       | Especificación v1, contribución, seguridad y changelog preparados; Apache-2.0 elegida para aportaciones originales | Contratos vinculados a pruebas y registro Sin publicar. ML-14 prepara licencia/alcance en PR borrador, sin fusionar; quedan derechos de assets, avisos de distribución, canal privado de seguridad y responsables/plazos operativos. |

## Límites de autorización

El bloque H9 está preparado en la [especificación v1](specification-v1.md), la
[guía de contribución](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/CONTRIBUTING.md), [seguridad](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/SECURITY.md) y el
[registro Sin publicar](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/CHANGELOG.md). No convierte el PR en release ni cierra las
decisiones de soporte y canal privado de seguridad. Apache-2.0 está elegida para
las aportaciones originales en ML-14; su aplicación permanece en PR borrador,
con derechos de assets y avisos de distribución pendientes de revisión.

La rama y el PR son material de revisión. No autorizan fusión a main, despliegues de Firebase,
modificación de datos/cuentas sintéticas de producción ni cambios de configuración remota.
Estas acciones requieren autorización explícita. Ninguna prueba local usa esas cuentas.

## Requisito posterior al despliegue del 18/10/2026

Firebase Spark exclusivamente, sin asociar facturación ni activar Blaze. Cloud Functions,
Cloud Run, App Hosting, Extensions y Cloud Storage quedan fuera del roadmap, incluso si
ofrecen una franja de uso sin coste en Blaze. No se sustituye este requisito por alertas
de presupuesto ni por créditos gratuitos.

Controles implementados para revisión: [política, inventario y operación Spark](../security/spark-only.md).
CI valida compatibilidad sin credenciales; despliegues manuales exigen lectura actual de
facturación y edición. Presupuestos locales, consultas acotadas por reglas, pausa por
cuota y borrado acotado/reanudable tienen pruebas automáticas.

Decisiones explícitas del titular: desarrollar paginación Firestore para más de 1000 obras,
proponer retención antes de aplicarla y definir asistencia manual de borrados abandonados.
Implementación de revisión: [cursores reales y coste](../firestore/firestore-cursors-v1.md),
[propuesta de retención](../accounts/account-marker-retention-proposal.md) y
[procedimiento de asistencia](../accounts/abandoned-deletion-assistance.md).
Pendiente: aprobar límites/coste y políticas, asignar responsables y plazos;
autorizar por separado revisión IAM/protección de rama y depuración de APIs no usadas.
No se han cambiado permisos, servicios remotos, cuentas ni datos de producción.

La revisión H8 y sus límites se detallan en [dependencias del 18/10](../development/dependencies-2026-10-18.md).

La implementación H5 y las condiciones de recuperación se describen en [importación recuperable](../features/import-recovery.md).

El contrato H6 se detalla en [sincronización y exportación comprobada](../features/synchronization-and-export.md); no implica disponibilidad offline después de cerrar la pestaña.

Las condiciones de H6–H7 se detallan en [borradores y actualizaciones PWA](../features/drafts-and-pwa-updates.md).

La revisión local H3 y sus límites se detallan en [accesibilidad del 18/10](../quality/accessibility-2026-10-18.md).

La [matriz H3 de navegadores](../quality/browser-coverage-2026-10-18.md) amplía doce recorridos a Firefox;
la aceptación en dispositivos reales y Safari continúa pendiente.

La [revisión de cambios de ancho](../quality/live-resize-2026-10-18.md) conserva la altura de cabecera
y añade captura explícita de errores ResizeObserver y conservación de formularios.

H1 cuenta con [recuperación de credenciales emuladas](../quality/password-recovery-emulator.md),
incluidos códigos inválidos y reutilizados. La entrega y página de acción reales, OAuth y
configuración efectiva siguen pendientes de aceptación autorizada; H1 no se marca cerrado.

La evidencia histórica de representación H6 está en [escala de biblioteca](../firestore/library-scale-2026-10-18.md).
El trabajo posterior de [cursores Firestore](../firestore/firestore-cursors-v1.md) sustituye el límite
de 1000 en la rama de revisión, preservando búsqueda y orden globales.
La [validación del límite de 10000](../firestore/verification-10000-2026-10-19.md) añade servicio
real en emulador, presupuesto real de admisión, recuperación de ráfagas y recorrido
completo de las 417 páginas en navegador. No cierra la aceptación de coste ni de
dispositivos reales.

La preparación H4 se describe en [versiones y recuperación](../operations/releases-and-recovery.md): versión copiable, inventario de builds y verificación local. Publicación, aceptación real y cambios IAM/protección de rama siguen pendientes de autorización.

Iteración desde `68ad672`, 19/10/2026: [medición de lecturas y listeners](../firestore/firestore-cost-review-2026-10-19.md)
y [revisión manual del marcador](../accounts/manual-marker-review.md). Decisiones recibidas:
optimizar/medir antes de fijar capacidad definitiva; propuesta de revisión humana
a los 30 días sin eliminación automática, pendiente de validación legal y técnica.
Los 10000 documentos y 64 rangos siguen siendo topes técnicos provisionales.
No se fusiona ni despliega esta iteración y no se cambia configuración ni datos reales.

Continuación técnica: [presupuesto de lecturas de transacciones](../firestore/transaction-read-budget-2026-10-19.md).
Se mide contención real en emulador y se admite cada intento de lectura, manteniendo
conflictos, atomicidad e IDs idempotentes. Capacidad definitiva y validación legal/técnica
de la revisión manual del marcador siguen pendientes.
