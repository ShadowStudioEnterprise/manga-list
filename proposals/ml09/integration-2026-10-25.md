# ML-09 · Evidencia Redmi e integración de ML-16

La rama incorpora main `e15b9fd`, con la corrección de aviso PWA de ML-16 y sus
pruebas. Se conservan ambas entradas del changelog. Las actualizaciones transitivas
de los lockfiles coinciden con las ya incluidas en ML-09; no hay otra actualización
de dependencias en esta integración. Los cambios de producto incorporados proceden
de main: `src/utils/pwa-update.js` y `src-pwa/register-sw.js`. El código de cuotas,
rangos, recuperación, importación/exportación y reglas no cambia.

## Observación física preservada

El directorio `evidence/redmi-physical-2026-10-25/` publica el suplemento que se
entregó inicialmente en el chat. Conserva bytes, manifiesto y resultados originales,
incluidos el intento interrumpido y el seguimiento con una expectativa incorrecta
de confirmación. Git no transforma sus finales de línea; el formateador no lo
reescribe. El verificador offline valida sus doce hashes y cinco huellas de runtime,
además de las evidencias anteriores: **49 archivos y 26 huellas de runtime**.
La auditoría de credenciales sigue incluyendo el material versionado. El verificador
lee los JSON sin ejecutar los instrumentos de laboratorio archivados.

El dispositivo físico fue Redmi 9A, Android 11, Chrome 155.0.8059.84. La revisión
probada fue `b435371`. La congelación nativa de la pestaña duró 187030 ms; después,
el aviso de suspensión retiró la confirmación anterior. Un único reintento recuperó
500 IDs únicos, búsqueda y capítulo 2 confirmado, con un solo target y estabilidad
de 60082 ms. La exportación del servicio coincidió. No se atribuye esa prueba a la
revisión posterior que integra ML-16 ni al guardado de un archivo por interfaz.

El muestreo de energía registró unos 16,4 segundos entre primera detección Asleep
y primera detección Awake, sin acreditar los dos minutos previstos. La escritura
concurrente ya estaba visible antes de la congelación posterior. No se demuestra
suspensión de todo Android, red celular, pérdida física de red, agotamiento global
ni reinicio de cuota. USB, debugger y sondeos pueden afectar a la suspensión.

## Reproducción y aceptación

Ejecutar `node scripts/check-ml09-evidence.mjs`, lint y auditoría offline. El workflow
CI de la rama y del PR verifica la integración con main, incluidas las pruebas de
ML-16, emuladores, Chromium/Firefox, documentación y compilaciones demo SPA/PWA.
Los CI anteriores sólo certifican sus revisiones; consultar los runs vinculados al
head actual del PR. Ninguna comprobación offline repite el ensayo físico ni mide
cuotas globales. El informe del suplemento detalla los intentos y sus limitaciones.

ML-09 permanece abierta para revisión humana del candidato y del procedimiento,
perfiles reales de red móvil, suspensión completa de Android y alcances no observados,
guardado nativo iOS si se mantiene el criterio, consumo agregado representativo y
recuperación tras reinicio real de cuota cuando ocurra. No provocar agotamiento.
Se mantiene la política provisional del 20 % y 40000/16000/16000; ningún presupuesto
local garantiza la cuota global. Sin fusión, despliegue ni cambios de Firebase remoto,
reglas desplegadas, datos reales, billing o servicios de pago.
