# Roadmap tras la auditoría del 16/10/2026

Los puntos pendientes requieren evidencia nueva; no se consideran cerrados por estar
incluidos en esta lista. La validación local de esta rama no certifica producción.

| Prioridad     | Trabajo y estado                                                                         | Criterio de aceptación                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2 confirmado | Aviso de conflicto persistente: corregido en esta rama                                   | Conflicto preserva borrador, recuperar/descartar y volver a biblioteca sin banner falso; fallo real del listener puede reintentarse.                                          |
| P1 / H2       | Borrado concurrente: mitigación cliente/reglas en esta rama; ejecución durable pendiente | Proceso servidor reanudable, reconciliación Auth/Firestore, pruebas de cierre de navegador, caducidad de tokens y política aprobada para retirar el marcador mínimo.          |
| P1 / H8       | Dependencias: avisos detectados, actualización pendiente                                 | Revisar avisos por cadena y contexto (navegador/Node/build); actualizar los dos lockfiles con pruebas completas. No aceptar downgrades mayores automáticos sugeridos por npm. |
| P1 / H1       | Aceptación operativa pendiente                                                           | Con permiso explícito, identificar SHA publicado; OAuth Google, recuperación completa, configuración/reglas efectivas y aislamiento. Conservar cuentas sintéticas actuales.   |
| P1 / H3       | Accesibilidad, responsive y PWA                                                          | Validar teclado, lector de pantalla, contraste, 320 px, tablet y dispositivos; instalación y actualización reales, con evidencia fechada.                                     |
| P2 / H4       | Protección de main y trazabilidad                                                        | Con autorización para configuración remota, exigir CI y revisión; conservar trazas de fallos, identificar versión y procedimiento de rollback compatible con marcadores.      |
| P2 / H5       | Importación recuperable tras recarga                                                     | Identificador de importación persistente y reintentos sin duplicados después de recargar o cerrar la app; probar fallos parciales.                                            |
| P2 / H6–H7    | Red, sincronización y contrato offline                                                   | Distinguir caché, escrituras pendientes y servidor; exportación informa su estado; recuperación de borradores y aviso de actualización PWA.                                   |
| P2 / H6       | Escala de biblioteca                                                                     | Medir tiempos/memoria con tamaños acordados, decidir paginación/virtualización según resultados, ampliar pruebas de filtros y fuentes.                                        |
| P2 / H8       | Operación pública                                                                        | Inventariar controles, App Check si procede, alertas/cuotas y revisión de dependencias continua; cambios remotos requieren aprobación.                                        |
| P3 / H9       | Mantenimiento                                                                            | Especificación versionada, licencia elegida por el titular, guía de contribución y registro de releases.                                                                      |

## Límites de autorización

La rama y el PR son material de revisión. No autorizan fusión a main, despliegues de Firebase,
modificación de datos/cuentas sintéticas de producción ni cambios de configuración remota.
Estas acciones requieren autorización explícita. Ninguna prueba local usa esas cuentas.
