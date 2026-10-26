# ML-09: bloqueo físico de iPhone en Safari normal — 24/10/2026

**Comprobación aprobada en el laboratorio observado.** El usuario bloqueó el
mismo iPhone físico con el botón lateral; `devicectl` confirmó que requería código.
Se confirmó el capítulo 2 en el emulador mientras el teléfono seguía bloqueado.
Se esperaron **131336 ms** desde esa operación antes de pedir el desbloqueo.
SafariDriver permaneció detenido durante todo este ensayo final.

La misma página vuelve sin recarga ni Reintentar, con eventos de visibilidad
nativos (`isTrusted: true`) y un hueco máximo del temporizador de **219061 ms**.
La primera muestra al volver aún recoge capítulo 1; la primera muestra confirmada
con capítulo 2 llega **4599 ms** después. Son tiempos de observación pasiva,
muestreada cada cinco segundos, no una medición exacta de latencia de red.

Se confirman 500 IDs únicos, capítulo 2, sin error ni escrituras pendientes,
un lock de biblioteca y una sola apertura Listen acumulada en la misma página,
sin retiradas ni nuevas aperturas. La comprobación conserva **60079 ms** de
estabilidad después de esa primera confirmación. No había búsqueda aplicada en
este ensayo; su conservación con texto no se vuelve a certificar aquí.

## Entorno y transporte

Producto sin cambios: commit `b9c28e819f3d43c1cf7b0dd3712a1cdac59d801d`, cuyo código
de producto sigue siendo `c150b0c`. `runtime.json` identifica sus siete archivos
por SHA-256. La sesión preparatoria nativa del mismo iPhone 11 informó iOS y Safari
27.0.1 (24A446); ese dato procede de sus capacidades, no del user-agent reducido.
El ensayo previo con versión informada 26.3.1 se conserva en su carpeta original.

La pestaña final se abre en Safari normal escaneando un QR local privado, sin
WebDriver. Se usa el relay HTTPS local protegido, proyecto `demo-mangalist`,
cuenta sintética y 500 obras en emuladores loopback. El usuario acepta la excepción
del certificado temporal en Safari; no se instala un certificado raíz o perfil.
El inicio de sesión de laboratorio se rellena automáticamente con la cuenta
sintética mediante el formulario del producto. El endpoint que la entrega exige
cookie de acceso, modo manual y fixture demo preparado; no usa una cuenta real.

El acceso inicial cambió de redirección HTTP a documento 200 con navegación del
mismo origen para que Safari conserve la cookie después del aviso del certificado.
La instrumentación registra reloj nativo, eventos reales y lecturas del store en
memoria, enviadas al Mac mediante `sendBeacon` cada cinco segundos. No hace lecturas
Firestore para muestrear ni genera freeze/resume, reintentos o recargas. El
observador fetch/XHR registra contadores de protocolo, no lecturas facturadas.

El historial inicial de telemetría incluye una navegación anterior al bloqueo.
El verificador toma como base la última página confirmada que pasó a hidden y
exige ese mismo identificador después de desbloquear. No oculta la navegación
preparatoria ni la confunde con una recarga durante el bloqueo.

## Intentos controlados inconclusos

Dos intentos con SafariDriver terminaron con la página cerrada o sesión inválida;
no permiten certificar recuperación. `controlled-attempts.zip` conserva sus
registros y la evaluación inconclusa. No se atribuye su causa al producto ni se
cuentan como aprobados. El pase final usa la pestaña normal y la captura pasiva
para mantener evidencia sin depender de esa sesión de control.

## Verificación y límites

Ejecutar `node verify-ios-physical-lock.mjs` valida los datos conservados sin
reescribirlos. `--write` genera un comprobante nuevo. `manifest-sha256.json`
permite comprobar integridad. No se incluyen QR, enlace privado, cookie,
credenciales, claves, certificado ni identificadores hardware del teléfono.
Los UID de biblioteca en los intentos controlados pertenecen al fixture sintético.

Este ensayo acredita bloqueo físico, pausa de ejecución JavaScript observada y
recuperación en Safari normal con Wi-Fi local. No certifica sueño de todo iOS,
red móvil, pérdida física de conexión, guardado nativo en Archivos, consumo
facturado ni reinicio real de cuota. No hay cambios de producto ni de Firebase
remoto. ML-09 mantiene pendientes los demás criterios operativos.
