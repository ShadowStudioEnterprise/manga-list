# Verificación de cursores MangaList 1.0 — 18/10/2026

Rama `development/firestore-cursors-2026-10-18`, basada en main
`9a43953d1c0866fcf07cd8f33af53a88cf683d55`. Fetch y consulta REST de GitHub
confirmaron que PR #2 está cerrado e integrado, el 18/10/2026 a las 21:54:54
Europe/Madrid. Esta sesión no lo fusionó. No se editaron los archivos de `sources/`.

Implementación validada: `aeda50fde65f883caf60f61642ee57460017140d`.
[CI completo correcto](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39167900668).
La actualización posterior del informe y mediciones solo añade evidencia documental.
[PR #3 en borrador](https://github.com/ShadowStudioEnterprise/manga-list/pull/3).

## Resultados

| Comprobación                                | Resultado                                                                                                                                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regresiones                                 | 78/78 correctas en local y CI: cuotas, sesión, exportación, importación, borrado y contratos                                                                                                                     |
| Cursores con adaptador controlado           | 16 casos dentro de las regresiones: 0, 1, 500, 501, 1000, 1001, 2501, 5000, 10000; inserciones, borrado de límites, rangos vacíos, caché, cancelación, fallo de página, límites, orden estable y errores tardíos |
| Reglas y servicio real en emulador Standard | 15/15 correctas en CI; local: 14 pruebas iniciales y repetición ampliada de los 2 casos grandes. Biblioteca de 5000, cambios de otro cliente, 5001 obras únicas en JSON/CSV y aislamiento                        |
| Importación grande en emulador              | 1001 filas, interrupción tras 504; nueva previsualización y replay completo dejan exactamente 1001 documentos, detectados después como duplicados                                                                |
| Navegador Ubuntu CI                         | 28/28 correctos: Chromium y Firefox, incluidas las bibliotecas de 100/1000/2500                                                                                                                                  |
| Navegador Windows local                     | Suite inicial 26/28; repetición selectiva 4/5. Pasan 1000/2500, filtros, orden, recorrido completo, exportación y borrado en ambos motores. Persiste el fallo de arranque frío del caso de 100                   |
| Formato y lint                              | Correctos en local y CI                                                                                                                                                                                          |
| Build SPA y PWA demo                        | Correctos en CI, con verificación de inventarios y contratos; ciclo de actualización PWA correcto. Sin publicación                                                                                               |
| Dependencias                                | Auditoría de ambos árboles correcta en CI; no se cambiaron dependencias ni lockfiles                                                                                                                             |
| Compatibilidad Spark local                  | Correcta; sin nuevos servicios, reglas, índices ni configuración remota                                                                                                                                          |

Las pruebas de emulador grandes utilizan un adaptador que cuenta admisiones sin
aplicar throttling a los fixtures. La admisión real y errores de cuota se prueban
separadamente: el emulador no certifica cuotas, consumo o facturación Spark.
En la biblioteca de 5001 registros, listeners y exportación utilizaron 32 admisiones
de lectura. Buscar, filtrar, ordenar y cambiar página visual no añade consultas.

Las [mediciones de Windows](measurements/library-cursors-2026-10-18.json) corresponden
a la implementación `aeda50f`: con 2500 obras solo se representan 24 tarjetas,
se recorren las 105 páginas visuales y se exportan las 2500 obras.

## Fallos locales y correcciones

El servidor de desarrollo Vite en Windows mostró carga de módulos muy lenta antes
del formulario y después del registro. La traza registra peticiones pendientes a
MainLayout/LibraryPage y avisos de conexión al emulador. El caso inicial de 100 obras
sigue fallando incluso con espera de 90 segundos para Biblioteca. Los casos posteriores
de 1000/2500 pasan; CI Ubuntu pasa también el de 100. No se da por resuelto el arranque
frío de desarrollo en este Windows ni se atribuye a producción. Los timeouts de la
aplicación no cambiaron.

El segundo fallo inicial fue el reintento de borrado en Firefox: la notificación podía
aparecer antes de que QBtn saliera de loading y el segundo clic no enviaba otra petición.
La prueba espera el contenido visible del botón y confirma blur del campo; la repetición
pasa en Chromium y Firefox. No se modificó el flujo de borrado de cuentas.

Una regresión nueva reprodujo cambios de orden al dividir un rango anterior; los rangos
se ensamblan ahora por posición en su árbol para mantener el orden ID y los empates de
los ordenadores actuales. También se descartan errores tardíos de listeners retirados.
La regresión pasa tras el cambio y está incluida en los 78 tests.

## Seguimiento del arranque local — 19/10/2026

Se confirmó de nuevo `origin/main = 9a43953` y PR #3 abierto, en borrador y sin
fusionar. Las 78 regresiones y `check:spark` vuelven a pasar en Windows.

El diagnóstico de Vite y las trazas de navegador muestran retrasos de preparación
de estilos de 12–36 segundos y peticiones de módulos pendientes. Dos ensayos de
`server.warmup` permitieron llegar a Biblioteca, pero fallaron en la primera visita
a Ajustes; incluso con esa página preparada quedaron dependencias pendientes.
Los ensayos se retiraron: no se incorpora una optimización sin mejora demostrada
ni se atribuye el problema a Firestore, cuotas o producción.

La prueba de escala ya excluía la carga inicial de Biblioteca de sus mediciones.
La preparación de Ajustes y la primera entrada a Importar/Exportar usan ahora
la misma espera de compilación de 90 segundos. Las interacciones medidas conservan
sus comprobaciones y tiempos de espera; no cambian los timeouts de la aplicación.
Esta adaptación de la prueba no demuestra un arranque rápido ni resuelve la
lentitud del servidor de desarrollo en Windows.

Referencia del mecanismo ensayado:
[Vite server.warmup](https://vite.dev/config/server-options#server-warmup).

## Estado remoto al cierre inicial y alcance

La evidencia remota anterior de Standard/Spark está en
`verification-spark-2026-10-18.md`, pero no equivale a una comprobación actual.
El CLI gcloud no tiene cuenta activa y el comando oficial Firebase de listado de
bases rechaza la sesión caducada. La revisión automática rechazó acceder directamente
a una credencial almacenada; esa acción no se ejecutó. No se eludió el rechazo ni
se reautenticó una cuenta durante este trabajo.

No se certifica el estado remoto actual de billing/edición. Los controles de despliegue
permanecen cerrados ante evidencia incompleta. No se ejecutaron despliegues, cambios
remotos, operaciones sobre datos/cuentas reales, vinculación de billing, activación de
APIs ni fusión de ramas. Se subió únicamente la rama de revisión y su PR borrador.

## Comprobación web posterior autorizada

El 18/10/2026 a las 23:44 Europe/Madrid se verificó en las consolas oficiales:
Spark, sin cuenta de facturación vinculada y Firestore Standard nativo en eur3.
Véase [evidencia y límites de la comprobación](verification-spark-console-2026-10-18.md).
La renovación del CLI quedó bloqueada por el consentimiento de permisos amplios;
no se otorgaron permisos nuevos y los controles de despliegue permanecen intactos.

## Decisiones pendientes

- Revisar coste del índice completo en memoria y límites de 10000 obras/64 rangos.
  No es memoria constante ni certificación de 10000 obras con todos los campos máximos
  en un móvil. Véase `firestore-cursors-v1.md`.
- Las páginas exportadas son lecturas sucesivas, no una transacción global. La UI
  cancela si observa cambios durante la copia; evitar ediciones en otros dispositivos.
- Retención y asistencia son propuestas sin aplicar. Aprobar plazos, responsables,
  canal verificado, evidencia de identidad y condiciones de retirada antes de operar.
- Sesión del CLI pendiente de renovación; el plan remoto ya se comprobó por consola.
  Aceptación en dispositivos reales/Safari y diagnóstico del arranque frío local siguen pendientes.
- Fusión, publicación y cualquier operación real requieren autorización independiente.
