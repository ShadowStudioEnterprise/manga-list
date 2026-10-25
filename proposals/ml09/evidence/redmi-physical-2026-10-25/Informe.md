# ML-09 · Seguimiento físico en Redmi

25/10/2026. Candidato sin cambios: `b435371af8d75071857667daaab69852543a9c42`.
Redmi 9A M2006C3LG, Android 11, Chrome 155.0.8059.84.
Sólo proyecto `demo-mangalist`, emuladores locales y cuenta/500 obras sintéticas.

## Resultado comprobado

Android deniega inyección remota de teclas mediante INJECT_EVENTS. No se cambiaron permisos ni ajustes de energía; el propietario confirmó que había bloqueado y desbloqueado físicamente el teléfono.

El muestreo de energía observó Asleep durante unos 16,4 segundos entre primera detección y primera detección de Awake, con alimentación USB. No acredita los dos minutos previstos ni suspensión completa del sistema. Durante ese intervalo se confirmó en el emulador un cambio del capítulo de probe-0 de 1 a 2.

El primer intento recuperó 500 IDs únicos y el capítulo 2 conservando la búsqueda, y comparó una exportación del servicio de 500 obras. A los 30 segundos seguía confirmado. La observación final agotó el plazo de CDP; se conserva `screen-lock.json` como incompleto, no aprobado.

Al volver a primer plano, el registro nativo reveló `freeze` y `resume` separados por **187030 ms**. La interfaz mostraba el aviso de suspensión y había retirado la confirmación del servidor. No se inyectó freeze ni se adelantó el reloj. El primer seguimiento esperaba incorrectamente que la confirmación anterior siguiera presente; falló esa expectativa del instrumento, y `followup.json` se conserva. La ausencia de confirmación era el comportamiento correcto del producto.

En un seguimiento separado se comprobó ese aviso y se ejecutó **un único reintento explícito**. Resultado de `recovery.json`:

- Una sola apertura de target durante la recuperación, sin otra apertura en los 60 segundos siguientes.
- 500 obras y 500 IDs únicos; capítulo 2 confirmado por el servidor y ausencia de error tras recuperar.
- Búsqueda `ML09 física 0000` conservada.
- Exportación mediante el servicio: 500 IDs únicos y capítulo 2. No se verificó descarga por interfaz ni guardado de un archivo.
- Comprobaciones a 20, 40 y 60 segundos conservan integridad y confirmación. Entre la muestra inicial tras recuperar y la final transcurrieron 60082 ms.

El intervalo hasta la primera muestra de recuperación fue de unos dos segundos; no es una medida exacta de latencia. Los contadores de targets sólo abarcan la conexión CDP de cada intento, no todos los intentos internos del SDK ni consumo global.

## Límites y trazabilidad

Se acredita congelación nativa de una pestaña en hardware físico y recuperación explícita posterior. No se acredita suspensión de todo Android, red celular, pérdida física de red, agotamiento global de Spark ni su reinicio diario. USB, debugger y sondeos pueden afectar la suspensión. El cambio ya estaba visible antes del freeze registrado; esta secuencia no prueba una nueva escritura concurrente durante los 187 segundos de freeze. No se equipara pantalla apagada con suspensión del sistema.

Se incluyen resultados originales de preparación, intento interrumpido, seguimiento con expectativa incorrecta y recuperación aprobada, junto con instrumentos y huellas de fuentes. Un error de sintaxis del instrumento de recuperación se corrigió antes de ejecutarlo; no cambió el producto. Los instrumentos copiados son documentación reproducible y deben ejecutarse desde su ubicación relativa en el repositorio, con nuevos puertos y entorno demo preparados; el ZIP no es un lanzador autónomo.

El verificador local lee JSON y comprueba consistencia y huellas; no repite el ensayo físico ni ejecuta los instrumentos. Los resultados fallidos permanecen etiquetados como tales. Se cerró únicamente la pestaña demo, se retiraron sus tres enlaces reverse y su forward CDP y se detuvieron los servidores del ensayo; se comprobó que no quedaban puertos de escucha de esos servidores.

Sin cambios de código versionado, Firebase remoto, datos reales, billing o servicios de pago. Los CI verdes de la revisión siguen siendo los ya registrados. ML-09 permanece abierta para los criterios operativos vigentes; no se fusiona ni despliega.
