# ML-09 — candidata para revisión

Base final: main `120efac` (incluye ML-13). Rama independiente `fix/ml09-spark-recovery`.
No se fusiona ni despliega. ML-09 sigue abierta hasta aceptación operativa.

## Estado vigente — corrección de búsqueda del 24/10/2026

La búsqueda aplicada se restaura tras recargar durante cuota mediante
sessionStorage por pestaña/proyecto/cuenta, limitada a 512 unidades UTF-16 y
borrada al salir o cambiar de usuario. Sin persistir biblioteca ni filtros.
Regresiones finales: 138 unitarias aprobadas, dos E2E dirigidos (Chromium y
Firefox) y Safari real con 500 obras y 915330 ms de espera sin cambiar el reloj.
Safari conserva búsqueda al recargar y recuperar capítulo 2, con un solo target;
exportación íntegra y limpieza de selección al salir comprobadas.

[Código probado, informe, verificadores y evidencias](evidence/safari-search-2026-10-24/README.md).
Los fallos y resultados de revisiones anteriores que siguen debajo son históricos;
el fallo de búsqueda observado en el runtime 6712945 queda corregido por este
cambio. ML-09 sigue abierta para aceptación y las demás validaciones operativas.

## Evidencia local del 23/10/2026

| Comprobación                        | Resultado                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Unitarias                           | 128 aprobadas                                                                                                     |
| Firestore demo                      | 27 aprobadas, incluido cierre/recuperación de listener real con señal de cuota sintética y aislamiento por cuenta |
| E2E completo inicial                | 44 aprobadas, 1 omitida por Windows, 2 fallos del selector ambiguo del nuevo caso ML-09                           |
| Caso ML-09 corregido                | 2 aprobadas: Chromium y Firefox, cero targets nuevos durante pausa/recarga, un target tras recuperación           |
| SPA/PWA demo                        | Compiladas y verificadas desde fuente limpia; revisión de build `f37716a`, sin cambios posteriores de runtime     |
| PWA compilada                       | 3 aprobadas                                                                                                       |
| Documentación                       | docs:build y docs:check aprobados: 76 páginas, 25 huellas de contratos                                            |
| Formato, lint y Spark               | Aprobados                                                                                                         |
| Privacidad offline de fuente/portal | Cero hallazgos                                                                                                    |

La ejecución completa inicial **no es un pase limpio** de la suite final. Los
fallos se conservan en `evidence/e2e-verified.log`: el test buscaba cualquier alert,
coincidiendo con notificaciones de registro y guardado. El selector corregido
busca el aviso dentro de main. La repetición se conserva separadamente en
`evidence/e2e-quota-verified.log`. CI debe ejecutar la suite completa sobre el
head final; su resultado se comunica en el PR, sin reescribir la evidencia inicial.

El test omitido usa SIGSTOP/SIGCONT del proceso completo y requiere Linux. La
congelación real de una página Chromium sí pasó, con 500 obras, escritura
concurrente, exportación completa y relevo del propietario. Ambos navegadores
comprobaron coordinación hasta 10000 obras. No certifica Safari ni suspensión OS.

Los logs publicados omiten enlaces de un solo uso del emulador y sustituyen la
ruta absoluta local por `<workspace>`. Las cuentas/UID que aparecen son sintéticos.
No se incluyen credenciales, cuentas ni datos de producción. Los intentos
interrumpidos de entorno y el primer runner aislado sin PATH no se cuentan como
pruebas aprobadas. `evidence/validation.json` contiene alcance, hashes de runtime,
hashes de logs y limitaciones; sus cifras se obtienen de las salidas conservadas.

## Reproducción

Desde un clon completo, instalar ambos lockfiles con Node de `.nvmrc`, Java 21+,
Firebase CLI y Playwright Chromium/Firefox. Ejecutar:

```sh
npm test
node scripts/test-firestore-local.mjs
npm run test:e2e
npm run lint:check
npm run check:spark
npm run docs:build
npm run docs:check
npm run audit:security:built
```

Los runners de Firestore y navegador usan localhost y proyectos demo; nunca
reutilizar un servidor conectado a producción. El caso de cuota inyecta el código
terminal en el presupuesto real y adelanta el reloj del cliente: no mide cuota
facturable ni demuestra su reinicio diario. Para repetir solo ese caso, dentro de
los emuladores demo ejecutar `playwright test tests/e2e/ml09-recovery.spec.js`.

Para SPA/PWA usar las seis variables Firebase demo de `.github/workflows/ci.yml`,
compilar con `npm run build` y `npm run build:pwa`, verificar ambos con
`node scripts/build-evidence.mjs verify spa --project demo-mangalist` (también pwa)
y ejecutar `npm run test:pwa`. No usar deploy ni el guard remoto.

## Condiciones de aceptación pendientes

Revisión humana del PR, redes lentas y móviles físicos/Safari, temporizadores de
pestañas suspendidas, consumo agregado representativo y responsables de incidente.
Validar con autorización separada recuperación tras reinicio real de cuota y
tratamiento de escrituras pendientes. No agotar deliberadamente cuotas reales.
La reserva del 20 %, 40000 lecturas y 16000 escrituras/borrados son planificación
administrativa aprobada, nunca cuota global medida ni disponibilidad garantizada.

Los cambios son compatibles con esquema, copias, reglas y marcador deleting.
No se modifican reglas, Firebase remoto, datos reales, billing, dependencias ni
servicios. No hay Blaze, Functions, Run, merge ni deploy.

## Continuación: recuperación tras congelación nativa

La revisión anterior `1be7dcc` queda conservada con sus CI y resultados históricos.
El nuevo ensayo físico reprodujo con 500 obras una escucha que conservaba un
capítulo anterior durante más de un minuto después de reanudar. Se añadieron
retirada al evento `freeze`, error visible y reintento manual con reinicio local
del transporte del SDK. No se cancelan escrituras ni se certifica red/servidor
por el mero hecho de reactivarlo. El reintento es único en vuelo, tiene admisión
propia de tres por minuto y respeta la pausa de cuota y el backoff de escucha.

Los JSON `evidence/redmi-freeze-before.json` y `evidence/redmi-freeze-recovery.json`
conservan el fallo y la comprobación corregida por separado. El segundo corresponde
al árbol de trabajo indicado por sus cinco SHA-256 de runtime, no al antiguo head
que aparece como base. Permite comparar esos bytes con la nueva revisión Git.
El Redmi 9A, Android 11, Chrome 155, congela el documento 20233 ms con cero ticks;
no abre targets antes de la recuperación manual, confirma el cambio a los 3673 ms,
exporta 500 IDs únicos y mantiene un único lock de biblioteca antes y después.
Es congelación de documento en hardware físico; no certifica sueño del sistema,
Safari/iOS ni consumo/reset global de cuota.

La reproducción exige emuladores demo locales, origen de prueba nuevo y preparación
atómica (400+100 documentos), no una ráfaga de escrituras REST independientes.
Se comprobó antes una actualización con la página activa: 500 obras, recepción del
cambio a los 1096 ms y exportación coincidente. Se descartó una interacción de
coordenadas del controlador que no enviaba el formulario; la preparación usó el
evento de submit nativo. Los fallos y los ensayos de instrumentación se conservan
en la entrega local y no se convierten en aprobados.

Pruebas añadidas: retirada de rangos y descarte de mensajes tardíos, limpieza del
evento, semáforo/admisión de recuperación, identidad y restauración tras errores.
El emulador comprueba que la promesa original de una escritura en cola se confirma
sin perder aislamiento por cuenta. La regresión E2E de congelación usa relevo
explícito, conserva búsqueda y escritura concurrente y comprueba que cerrar al
dueño retirado no abre otra escucha. Unitarias: 134 aprobadas. La suite completa
Firestore/E2E y builds de esta nueva revisión se registran separadamente en CI y en
la entrega final; los CI antiguos no los sustituyen. ML-09 permanece abierta.

## Safari Mac — evidencia del 24/10/2026

La validación automatizada en Safari real 18.6 confirma las 500 obras, recuperación
de escritura pendiente, exportaciones completas y una sola escucha compartida
entre dos pestañas. La captura fetch + XHR acredita cero aperturas durante la
pausa y exactamente una tras Reintentar, con espera real de 15 minutos.

**Safari Mac sigue sin aprobación completa:** al recargar durante la cuota se
pierde la búsqueda. Ese fallo no se corrige con esta entrega de evidencia.
[Informe, registros, verificadores y originales con hashes](evidence/safari-mac-2026-10-24/README.md).
La revisión de runtime probada es 6712945; los nuevos archivos son de evidencia.
Safari/iOS y los demás criterios operativos pendientes no se dan por cumplidos.

## Safari iPhone físico — 24/10/2026

El iPhone 11 con iOS 26.3.1 y Safari 26.3 confirma las comprobaciones principales
observadas en el laboratorio: búsqueda conservada tras recarga con cuota, cero
reaperturas durante 911132 ms reales y recuperación manual de 500 obras únicas,
capítulo actualizado y un target estable más de un minuto. Salir borra la búsqueda.
La copia JSON generada coincide con el emulador; no se certifica su guardado en
Archivos de iOS. La segunda pestaña necesitó reactivar a la propietaria para recibir
su primera copia, sin abrir otra suscripción. No certifica suspensión del sistema
ni red móvil real. El producto probado sigue siendo c150b0c; esta entrega añade
solo evidencia. [Informe, transporte, registros y verificador](evidence/safari-iphone-2026-10-24/README.md).

## Bloqueo físico en Safari normal — 24/10/2026

El ensayo final sin SafariDriver confirma el bloqueo físico del iPhone y una pausa
nativa del temporizador de 219061 ms. Se guarda un cambio concurrente con el móvil
bloqueado, se esperan 131336 ms antes de pedir desbloquearlo y vuelve la misma
página, sin recarga ni Reintentar. La primera muestra confirmada llega 4599 ms
después de la primera telemetría visible: 500 IDs únicos, capítulo 2, sin error
ni pendientes, una sola apertura Listen y estabilidad de 60079 ms. Son tiempos
de muestreo pasivo, no latencia exacta. Los intentos controlados que cerraron la
página quedan inconclusos. [Informe, datos y verificador](evidence/iphone-physical-lock-2026-10-24/README.md).

Este caso resuelve la comprobación observada de bloqueo físico en Safari normal;
no certifica sueño completo de iOS, red móvil o guardado en Archivos. No cambia
el producto ni sustituye los demás criterios operativos de ML-09.
