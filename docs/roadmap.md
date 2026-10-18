# Roadmap tras la auditoría del 16/10/2026

Los puntos pendientes requieren evidencia nueva; no se consideran cerrados por estar
incluidos en esta lista. La validación local de esta rama no certifica producción.

| Prioridad     | Trabajo y estado                                                                                                   | Criterio de aceptación                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2 confirmado | Aviso de conflicto persistente: corregido en esta rama                                                             | Conflicto preserva borrador, recuperar/descartar y volver a biblioteca sin banner falso; fallo real del listener puede reintentarse.                                                                   |
| P1 / H2       | Borrado concurrente: mitigación cliente/reglas en esta rama; reanudación Spark acotada; cierre operativo pendiente | Solo Spark: lotes cliente reanudables y pruebas de interrupción/cuotas. Aprobar responsable de recuperación manual y retención del marcador; no prometer finalización sin cliente.                     |
| P1 / H8       | Dependencias: correcciones revisadas en esta rama; auditoría sin avisos conocidos al 18/10                         | Ambos lockfiles actualizados, auditoría continua en CI y pruebas completas. Revisar el override gRPC al actualizar Firebase y las dependencias transitivas sin mantenimiento.                          |
| P1 / H1       | Aceptación operativa pendiente                                                                                     | Con permiso explícito, identificar SHA publicado; OAuth Google, recuperación completa, configuración/reglas efectivas y aislamiento. Conservar cuentas sintéticas actuales.                            |
| P1 / H3       | Accesibilidad y responsive: primera revisión local; PWA de dispositivos pendiente                                  | Validar teclado, lector de pantalla, contraste, 320 px, tablet y dispositivos; instalación y actualización reales, con evidencia fechada.                                                              |
| P2 / H4       | Protección de main y trazabilidad                                                                                  | Con autorización para configuración remota, exigir CI y revisión; conservar trazas de fallos, identificar versión y procedimiento de rollback compatible con marcadores.                               |
| P2 / H5       | Importación recuperable tras recarga: implementada para IDs v1                                                     | IDs estables por cuenta/archivo/fila y transacciones: reintentos, respuesta perdida, concurrencia y recarga probados. Requiere reseleccionar el mismo archivo; sin trabajador de fondo.                |
| P2 / H6–H7    | Sincronización y exportación: metadatos y lectura del servidor implementados                                       | Metadatos caché/pendientes/servidor y exportación comprobada con pruebas de desconexión. Borradores de pestaña opcionales y aviso PWA pasivo implementados; validación real en dispositivos pendiente. |
| P2 / H6       | Escala de biblioteca: presentación de 24 tarjetas y mediciones locales                                             | Medir tiempos/memoria con tamaños acordados, decidir paginación/virtualización según resultados, ampliar pruebas de filtros y fuentes.                                                                 |
| P2 / H8       | Operación pública                                                                                                  | Inventariar controles, App Check si procede, alertas/cuotas y revisión de dependencias continua; cambios remotos requieren aprobación.                                                                 |
| P3 / H9       | Mantenimiento                                                                                                      | Especificación versionada, licencia elegida por el titular, guía de contribución y registro de releases.                                                                                               |

## Límites de autorización

La rama y el PR son material de revisión. No autorizan fusión a main, despliegues de Firebase,
modificación de datos/cuentas sintéticas de producción ni cambios de configuración remota.
Estas acciones requieren autorización explícita. Ninguna prueba local usa esas cuentas.

## Requisito posterior al despliegue del 18/10/2026

Firebase Spark exclusivamente, sin asociar facturación ni activar Blaze. Cloud Functions,
Cloud Run, App Hosting, Extensions y Cloud Storage quedan fuera del roadmap, incluso si
ofrecen una franja de uso sin coste en Blaze. No se sustituye este requisito por alertas
de presupuesto ni por créditos gratuitos.

Controles implementados para revisión: [política, inventario y operación Spark](spark-only.md).
CI valida compatibilidad sin credenciales; despliegues manuales exigen lectura actual de
facturación y edición. Presupuestos locales, consultas acotadas por reglas, pausa por
cuota y borrado acotado/reanudable tienen pruebas automáticas.

Pendiente del titular: aceptar el máximo visible de 1000 obras o priorizar paginación completa;
asignar responsable y plazo de asistencia para borrados abandonados; decidir retención del
marcador; autorizar por separado revisión IAM/protección de rama y depuración de APIs no usadas.
No se han cambiado permisos, servicios remotos, cuentas ni datos de producción.

La revisión H8 y sus límites se detallan en [dependencias del 18/10](dependencies-2026-10-18.md).

La implementación H5 y las condiciones de recuperación se describen en [importación recuperable](import-recovery.md).

El contrato H6 se detalla en [sincronización y exportación comprobada](synchronization-and-export.md); no implica disponibilidad offline después de cerrar la pestaña.

Las condiciones de H6–H7 se detallan en [borradores y actualizaciones PWA](drafts-and-pwa-updates.md).

La revisión local H3 y sus límites se detallan en [accesibilidad del 18/10](accessibility-2026-10-18.md).

La representación por páginas y la evidencia H6 están en [escala de biblioteca](library-scale-2026-10-18.md); no amplía el límite de 1000 obras ni reduce las lecturas iniciales.
