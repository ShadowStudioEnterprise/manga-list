# Verificación de cursores MangaList 1.0 — 18/10/2026

Rama `development/firestore-cursors-2026-10-18`, basada en main
`9a43953d1c0866fcf07cd8f33af53a88cf683d55`. Fetch y consulta REST de GitHub
confirmaron que PR #2 está cerrado e integrado, el 18/10/2026 a las 21:54:54
Europe/Madrid. Esta sesión no lo fusionó. No se editaron los archivos de `sources/`.

## Resultados locales

| Comprobación                                | Resultado                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regresiones                                 | 77/77 correctas, incluido error de cuota y cancelación de exportación por revisión observada                                                                                     |
| Cursores con adaptador controlado           | 15 casos dentro de las regresiones: 0, 1, 500, 501, 1000, 1001, 2501, 5000, 10000; inserciones, borrado de límites, rangos vacíos, caché, cancelación, fallo de página y límites |
| Reglas y servicio real en emulador Standard | 14/14 correctas; biblioteca de 5000, cambios desde otro cliente, 5001 obras únicas en JSON/CSV y reimportación completa; aislamiento y rechazo de consultas sin límite           |
| Importación grande en emulador              | 1001 filas, interrupción tras 504; nueva previsualización y replay completo dejan exactamente 1001 documentos, detectados después como duplicados                                |
| Navegador                                   | En curso; recorrido de 1000 obras correcto. Cierre de evidencia pendiente de completar los recorridos restantes                                                                  |
| Formato y lint                              | Correctos en la primera pasada; volver a comprobar al cerrar la rama                                                                                                             |
| Build SPA y PWA demo                        | Correctos; sin publicación. Repetir al cerrar los cambios finales                                                                                                                |
| Compatibilidad Spark local                  | Correcta; sin nuevos servicios, dependencias, reglas o índices                                                                                                                   |

Las pruebas de emulador grandes utilizan un adaptador que cuenta admisiones sin
aplicar throttling a los fixtures. La admisión real y errores de cuota se prueban
separadamente: el emulador no certifica cuotas, consumo o facturación Spark.
En la biblioteca de 5001 registros, listeners y exportación utilizaron 32 admisiones
de lectura; buscar/filtrar/ordenar no añade lecturas del servidor.

La primera ejecución de navegador se interrumpió por carga local de módulos muy lenta
antes del formulario. Tras reiniciar, el primer recorrido de 100 obras agotó la espera
de 15 segundos al entrar por primera vez en Biblioteca; el recorrido de 1000 completó
carga, búsqueda, actualización, 42 páginas, filtros, orden, exportación y revisión móvil.
Se amplió explícitamente la espera del arranque frío en el test de escala; no se
modificaron timeouts de la aplicación ni se ocultaron errores de ejecución.

## Estado remoto y alcance

La evidencia remota anterior de Standard/Spark sigue en
`verification-spark-2026-10-18.md`, pero no equivale a una comprobación actual.
El CLI gcloud no tiene cuenta activa y el comando oficial Firebase de listado de
bases rechaza la sesión caducada. La revisión automática rechazó una propuesta de
acceder directamente a una credencial almacenada; esa acción no se ejecutó.
No se eludió el rechazo ni se reautenticó una cuenta durante este trabajo.

No se puede certificar el estado remoto actual de billing/edición con esta sesión.
Los controles de despliegue permanecen cerrados ante evidencia incompleta. No se
ejecutaron despliegues, cambios remotos, operaciones sobre datos/cuentas reales,
vinculación de billing, activación de APIs ni fusión de ramas.

## Límites y decisiones pendientes

- La paginación es real en Firestore, pero conserva un índice completo en memoria
  para mantener búsqueda por fragmentos y orden español numérico. Revisar coste
  inicial y límites locales de 10000 obras/64 rangos. Véase `firestore-cursors-v1.md`.
- Las páginas exportadas son lecturas sucesivas, no una transacción global. La UI
  cancela si observa cambios durante la copia; evitar ediciones en otros dispositivos.
- Retención del marcador y asistencia son propuestas sin aplicar. Aprobar plazos,
  responsables, canal verificado, evidencia y condiciones de retirada antes de operar.
- Dispositivos reales/Safari, plan remoto actual y aceptación de producción siguen
  pendientes. Un PR borrador y resultados locales no autorizan fusión ni publicación.
