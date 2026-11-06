# ML-09 · sesión celular del 06/11/2026

**Resultado actual:** ensayo físico y archivo exportado registrados y verificados; transporte temporal cerrado. Véase [informe final](INFORME-CELULAR-2026-11-06.md). Los apartados siguientes conservan la preparación y las incidencias cronológicas. ML-09 permanece abierta.

Candidato de aplicación: `28d876d394dc3e5bf458303abd181f10ecb33b3b`, fuente limpia. Emuladores exclusivamente demo-mangalist en loopback. Sin Firebase remoto, datos reales, billing, servicios de pago, fusión o despliegue. ML-09 permanece abierta.

La autorización del usuario permite recrear Cloudflare Quick Tunnel para esta prueba. Ventana absoluta de exposición: hasta el 06/11/2026 a las **15:36:07 Europe/Madrid**, sin prolongarla al reiniciar el controlador. Supervisor separado: cierra cloudflared si vence el plazo o desaparece el controlador. Los enlaces y credenciales están en archivos privados y no se incluyen en este informe.

## Comprobaciones realizadas

- Identidad Git exacta y ausencia de cambios de fuente confirmadas.
- Lockfiles del candidato y del árbol instalado de dependencias semánticamente idénticos; dependencias locales reutilizadas. No se afirma instalación limpia.
- Pasarela y supervisor: 17 pruebas aprobadas antes de la adaptación; después, 16 pruebas dirigidas de pasarela aprobadas, incluida la adaptación de la consulta de escucha.
- Nueva cuenta sintética y 500 documentos únicos confirmados en el emulador.
- Safari Mac 18.6, macOS 15.7.9: cadena local de instrumentación confirmada con 500 IDs únicos, fromCache=false y sin pendientes.
- Primer intento HTTPS con flujo continuo: login correcto, respuestas de Firestore iniciadas, pero biblioteca no confirmada antes del minuto. Fallo conservado en `cellular-live-20261106/evidence/https-preflight-streaming-failed.log`, `https-preflight.jsonl`, captura y telemetría acumulada.
- Un diagnóstico de framing HTTP directo comparó Content-Length y chunked: ambos recibieron respuesta inicial en unos 25 ms. No se atribuye el fallo a ese framing.
- La pasarela se adaptó para pedir respuestas finitas en los GET del backchannel Listen (`CI=1`). No modifica Write, los POST ni los archivos del candidato. También evita transformar o retener innecesariamente el flujo en los proxies. Es una adaptación del transporte del laboratorio, y el ensayo no representa una conexión directa a Firestore de producción.
- Segundo intento HTTPS con esa adaptación: **500 IDs únicos, capítulo 1, favorito false, fromCache=false, sin pendientes ni error**. Cuenta y proyecto demo comprobados. Acceso sin cookie rechazado con 403. Evidencia: `cellular-live-20261106/evidence/https-finite-preflight-result.json` y captura correspondiente.
- Acceso del Mac de preflight revocado mediante rotación. Entrada nueva de un solo uso emitida para el iPhone.

## Pendiente del iPhone

1. Abrir la entrada en Safari con Wi-Fi apagado y datos móviles de la SIM activos; confirmar las 500 obras y registrar la observación física del usuario.
2. Mantener la misma página durante el corte real de conectividad.
3. Marcar favorito sin conexión y contrastar pendiente local frente al emulador.
4. Recuperar red y confirmar la escritura original, el cambio concurrente y la búsqueda; usar Reintentar si aparece el error.
5. Descargar la exportación por la interfaz, guardarla en Archivos de iOS y recuperar el archivo para contrastar las 500 obras y todos sus campos con el emulador.

La validación Mac por HTTPS no se cuenta como conexión celular ni como exportación guardada en iOS. La telemetría es pasiva: no desactiva el SDK, no simula el corte y no altera el reloj. La observación de export-generated tampoco acredita guardado nativo; hace falta el archivo recuperado. Se conservan los errores anteriores en el directorio del 26/10 y los nuevos intentos por separado en esta sesión.

## Primera apertura del teléfono y renovación para Safari

La primera entrada del teléfono fue consumida por un navegador cuyo UA identifica CriOS (Chrome del iPhone). Recibió 500 IDs únicos, capítulo 1 y favorito false, con fromCache=false y sin pendientes ni errores. No se ha confirmado todavía que ese acceso usara la SIM con Wi-Fi apagado, y no se cuenta como pase de Safari.

El usuario informó de una descarga al abrir la dirección en Safari. El registro conserva solicitudes posteriores a la entrada ya consumida con 403. La respuesta de denegación carecía de Content-Type explícito. Se corrigió para mostrar texto inline; una visita repetida con la cookie válida del mismo navegador conserva acceso, mientras otro navegador sigue rechazado. Las 17 pruebas dirigidas de pasarela pasan con ese caso.

Se renovó el transporte dentro de la misma ventana, sin extender las 15:36:07. Se comprobaron por HTTPS los tipos de respuesta: entrada y aplicación text/html, denegación text/plain inline. Se revocó el acceso de comprobación y se emitió una nueva entrada para pegar directamente en Safari. El enlace está únicamente en los archivos privados y en el chat del usuario, no en este informe.

## Corrección de consumo prematuro de la entrada

El usuario volvió a observar `Lab request unavailable`. La nueva entrada recibió un GET 200 sin carga autenticada de la aplicación y después fue rechazada como usada. No se atribuye ese GET a un navegador concreto porque no había telemetría autenticada. Se sustituyó la activación automática por un GET de presentación que no consume clave y un botón que la canjea mediante POST. Las previsualizaciones GET ya no conceden cookie ni gastan la entrada.

El primer ensayo del formulario en Safari Mac fue rechazado antes del canje. Se conserva ese fallo en `https-explicit-initial-failed.log` y en los registros acumulados. La pantalla de presentación usa ahora Referrer-Policy same-origin; los demás recursos conservan la política restrictiva, y los Origin null o ajenos siguen bloqueados.

Validación posterior: 19 pruebas de pasarela aprobadas, incluida resistencia a previsualizaciones y rechazo de origen ajeno. Safari Mac real abrió la presentación, pulsó el botón, obtuvo cookie y confirmó los 500 IDs únicos, capítulo 1, favorito false, sin cache ni pendientes ni error. Resultado y captura en `cellular-live-20261106/evidence/https-safari-form-preflight-result.json` y archivos asociados. No es un pase del iPhone. Se revocó esa sesión de comprobación y se emitió otra entrada para Safari del teléfono. Sigue vigente el cierre absoluto a las 15:36:07, sin ampliar la ventana.
