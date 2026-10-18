# Entradas verificables del control Spark

Esta continuación endurece el verificador local y su entrada en CI. No ejecuta despliegues
ni cambia facturación, permisos, servicios o datos remotos.

## Regresión y contrato

La prueba nueva reprodujo que `--remtoe` terminaba con código cero: la errata omitía la
comprobación remota y solo ejecutaba la local. El contrato admite ahora únicamente:

- `node scripts/check-spark.mjs`: revisión local; comunica que no certifica el estado remoto.
- `node scripts/check-spark.mjs --remote`: revisión local y comprobaciones remotas de solo lectura.

Cualquier otro argumento, bandera duplicada o combinación falla antes de invocar gcloud.
No hay opciones para saltarse controles ni se acepta un archivo de evidencia remota anterior.
La comprobación remota sigue rechazando facturación activa/asociada, edición distinta de
Standard, salida incompleta, errores o herramientas ausentes.

Se exigen los valores exactos de siete scripts npm: `check:spark`, `check:spark:remote`,
`deploy:hosting`, `build`, `build:pwa`, `check:release` y `audit:dependencies`. Así, cambiar
el alias remoto para que solo revise localmente o quitar su guardia del alias de publicación
hace fallar la revisión. Las modificaciones legítimas de esas cadenas requieren revisar
también el contrato y las regresiones. Otros scripts adicionales no quedan certificados.

La primera comprobación de CI invoca directamente el archivo con Node, antes de instalar
dependencias; no depende de que el alias npm siga apuntando al verificador. El escaneo
conservador de workflows rechaza también alias npm de despliegue, publicación de canales
de Hosting y clonación entre sitios, además de los comandos y acciones ya bloqueados.
CI sigue sin publicar y sin credenciales de producción.

## Evidencia automática

`tests/spark.test.js` ejecuta el CLI real con seis variantes inválidas y una válida local.
Un gcloud simulado deja un marcador si se invoca; ninguna de esas llamadas debe crearlo.
La regresión inicial falló con el código anterior y pasa con el contrato estricto. Otras
pruebas eliminan o sustituyen los siete scripts protegidos y ejercitan los comandos de
workflow prohibidos. Las pruebas remotas existentes usan respuestas simuladas, nunca
consultas a Firebase. No se ha usado un despliegue como prueba de estos controles.

## Límites y medidas pendientes

El escaneo de workflows es textual e incluye comentarios: puede rechazar ejemplos inocuos
y no interpreta comandos indirectos, texto construido dinámicamente u otras herramientas.
No equivale a un analizador completo ni a una frontera de permisos. Código, tests y CI pueden
modificarse conjuntamente; hacen falta revisión humana y protección de ramas/CI. Un
administrador puede cambiar el plan desde fuera del repositorio. Esas medidas de permisos
requieren autorización separada y no se han aplicado aquí.

La evidencia remota describe el instante de lectura: no elimina una carrera con cambios
posteriores. Tampoco demuestra que nadie pueda agotar cuotas. Se mantienen los presupuestos
locales, la pausa por cuota y los límites del [borrado e inventario Spark](spark-only.md).
Si desaparece el cliente, el borrado no continúa ni tiene finalización garantizada.
