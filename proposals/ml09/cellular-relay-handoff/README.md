# ML-09: pasarela celular para revisar en Mac

Base de la aplicacion: 28d876d394dc3e5bf458303abd181f10ecb33b3b.
Entrega del prototipo preparado en Windows. No hay enlace externo activo.

Con Node 24, extraer en una carpeta nueva y ejecutar:

    node --test relay.test.mjs

El log adjunto registra nueve pruebas aprobadas con servidores simulados en loopback. No acredita integracion con el SDK real, Safari/iOS, 500 obras ni conexion celular. No hay dependencias npm externas para estas pruebas. Los primeros intentos fallaron por restricciones de loopback y una expectativa incorrecta del instrumento sobre el encabezado Host; no se cuentan como pases y sus logs originales permanecen en Windows.

relay.mjs exporta createLabRelay; no arranca al importarse. Por defecto dirige la aplicacion a 127.0.0.1:9335 y Auth/Firestore demo a 127.0.0.1:9199/8188. Su metodo listen usa un puerto libre exclusivamente en loopback. Hay una entrada de un solo uso con secreto aleatorio de 256 bits y cookie HttpOnly/SameSite=Strict, Secure cuando se configura publicOrigin HTTPS. Se reescriben endpoints del navegador al mismo origen, con CSP para impedir conexiones externas y una lista acotada de rutas. No publicar secretos o enlaces de acceso en Git o informes.

LIMITACIONES ANTES DE EXPONERLO:

- No se completo el arranque con la aplicacion y los emuladores reales. No existe local-run.mjs ni un CLI de inicio: los intentos de crearlos toparon dos veces con timeout de revision automatica de permisos.
- El plazo maximo de 45 minutos rechaza solicitudes nuevas, pero NO cierra canales ya abiertos ni detiene el servidor. Aunque un test dice "expiry closes existing sessions", solo verifica una solicitud posterior al plazo. Hay que implementar y probar el cierre absoluto.
- La lista de rutas Vite puede requerir adaptacion acotada; /@fs esta bloqueado. No habilitar filesystem arbitrario para resolverlo.
- Faltan verificar configuracion demo, login, biblioteca completa, busqueda, escritura pendiente, recuperacion, exportacion y sus errores a traves del transporte real.

Para acreditar red celular, el iPhone debe tener Wi-Fi apagado y alcanzar una direccion HTTPS por Internet movil. Una IP privada del Mac, USB, localhost o un hotspot por si solos no lo prueban. Un tunel temporal protegido es una opcion, previa revision y autorizacion especifica de proveedor, acceso y duracion. No hay ningun tunel creado o autorizado mediante esta entrega.

Referencia de la opcion estudiada: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
Registrar sus limites y cualquier efecto del intermediario. No atribuir sus errores a cuota Firebase.

Usar exclusivamente demo-mangalist y datos sinteticos, mantener emuladores en loopback y detener el transporte al terminar. Sin modificar Firebase remoto, reglas desplegadas, datos reales, billing o servicios de pago. Sin fusion, despliegue ni cierre de ML-09. La entrega de archivos no autoriza exponer un endpoint externo.
