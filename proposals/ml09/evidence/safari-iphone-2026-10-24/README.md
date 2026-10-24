# Safari en iPhone físico — 24/10/2026

Ensayo de ML-09 en iPhone 11, iOS 26.3.1 (23D8133), Safari 26.3. Sesión
SafariDriver nativa con `platformName: iOS`, `safari:useSimulator: false` y
`acceptInsecureCerts: true`. No se instala una aplicación ni un certificado en el
teléfono. `runtime.json` identifica el commit y siete archivos de producto.

## Laboratorio y alcance

500 obras sintéticas en `demo-mangalist`, emuladores Auth/Firestore en loopback.
Acceso desde el iPhone por Wi-Fi a un relay HTTPS temporal del Mac. El relay exige
una cookie segura, HTTP-only y SameSite=Strict obtenida con un enlace aleatorio;
no permite REST administrativo de Firestore. No hay túnel público ni acceso a
Firebase remoto. La excepción de certificado solo afecta a la sesión WebDriver.

Un script previo al arranque reescribe las URL loopback de los emuladores hacia
rutas del mismo origen y añade la cookie de laboratorio. Para evitar el error de
Safari `ReadableStream uploading is not supported` al reconstruir un Request con
otra URL, reenvía el cuerpo como ArrayBuffer. Conserva contenido y método. Esta
adaptación pertenece al transporte del laboratorio, no al código del producto.
El observador se instala después de esa adaptación y antes del arranque de la
aplicación: registra el protocolo Listen original mediante fetch y XHR, sin
cabeceras de autenticación ni reloj simulado. La señal de cuota es sintética.

## Resultados y límites

**Comprobaciones principales aprobadas en este laboratorio.** Se confirma una
biblioteca de 500 IDs únicos, búsqueda conservada tras recarga con cuota,
reintento anticipado sin target y exportaciones bloqueadas. Tras **911132 ms
reales** no hay reapertura automática; un clic recupera las 500 obras y el capítulo
2 con un único target, estable más de 61 segundos, sin error ni pendientes.
Cerrar sesión borra la búsqueda; un login nuevo carga las 500 obras con búsqueda
vacía. La exportación JSON generada tiene 500 IDs únicos y coincide con el emulador
(SHA-256 2da9bf8f82ffa3a3be039b43701b173a8469b696f5cd4c5d6caa7891f9073bf1).

Los registros y `verification-ios.json` documentan los resultados finales. No se
certifica suspensión del sistema, bloqueo físico del iPhone, pérdida física de
red, funcionamiento bajo red móvil, consumos facturables ni reinicio de cuota real.
La captura del Blob de exportación se realiza al generarlo por la interfaz;
no acredita la presencia del archivo en la aplicación Archivos de iOS. El clic
nativo WebDriver no activó la exportación en el primer intento; la repetición
usó `element.click()` sobre el botón renderizado. Solo se da por verificada la
generación del Blob y su contenido, no la descarga nativa. El texto genérico del
verificador original dice «descargada»; en este ensayo se limita a ese Blob.

Dos pestañas mantienen una única suscripción. Al abrir la segunda, la primera
queda en segundo plano y la nueva pestaña espera su primera comprobación. Fue
necesario reactivar la propietaria y volver a la segunda para recibir las 500
obras; esta espera no se presenta como recuperación autónoma. La segunda no abre
otro target. Se cierra antes del ensayo de cuota.

La búsqueda se conserva al recargar durante cuota. La biblioteca pasa a cero obras
porque solo existe en memoria: no hay caché persistente de las obras. La primera
aserción auxiliar esperaba erróneamente 500 tras esa recarga y falló. El código de
producto no cambió; se comprobó el contrato y se mantuvo ese resultado explícito.
Los intentos previos de transporte no se cuentan como pruebas de aplicación.

## Verificación

`node verify-ios.mjs` comprueba el protocolo y los estados conservados. La copia
JSON se contrasta además con las 500 obras del emulador mediante el verificador
original del kit; el head 6712945 de ese comprobante describe el kit, mientras
`runtime.json` identifica el producto realmente ejecutado. `manifest-sha256.json`
permite verificar integridad. Los UID de biblioteca son sintéticos. No se incluyen
credenciales, certificados, claves privadas, cookie, enlace de acceso ni UDID.

ML-09 permanece abierta para las condiciones de aceptación no cubiertas.

## Reproducción del transporte

Arrancar la aplicación demo sin HMR en loopback 9414, Auth 9199 y Firestore 8188;
preparar la cuenta y 500 obras con el kit. Colocar `config.json` y `controles.js`
del kit en `/capacity-results/ml09/mac-lab/` del checkout de aplicación. Cambiar
el origen de guard del helper a la URL HTTPS del relay. Generar un certificado
efímero y clave locales con nombres `ios-cert.pem` e `ios-key.pem` junto al relay;
no incluirlos en Git. Ejecutar `ML09_LAN_ADDRESS=<IP-privada-Mac> node ios-relay.mjs`
y navegar desde WebDriver a la entrada del archivo privado generado por el relay.
El cambio de IP parametrizado en la copia publicada no cambia la instrumentación.
Inyectar cuota solo en la cuenta sintética, conservar la búsqueda y esperar al
menos 15 minutos reales más margen. Al finalizar, cerrar sesión y detener el
relay. Los emuladores permanecen en loopback.
