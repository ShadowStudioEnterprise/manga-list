# Identificación de compilaciones y recuperación compatible con Spark

Continuación H4 sobre `e799651`. Este procedimiento es material para revisión. No autoriza
fusión, despliegue, rollback, cambio de reglas/IAM ni modificación de cuentas o datos remotos.
No se ha ejecutado ninguna de esas acciones para probarlo.

## Identificar lo que se está ejecutando

Ajustes muestra una revisión abreviada y permite copiar aplicación, revisión Git completa,
estado de desarrollo y fecha de compilación. Solo escribe el portapapeles tras pulsar el botón;
no envía diagnósticos ni incluye UID, correo, biblioteca, tokens, URLs privadas o entorno completo.
Si el portapapeles falla, muestra un aviso. Sin Git válido aparece «Versión local sin identificar».

El identificador pertenece al JavaScript cargado, que puede ser una versión anterior conservada
por la PWA. No certifica cuál sirve ahora Hosting ni qué reglas están activas. La fecha proviene
del reloj del proceso de compilación, no de Firebase ni de una firma de tiempo. Dos builds de
la misma revisión pueden tener fechas y hashes distintos: no se promete reproducibilidad binaria.

Quasar recibe el sello de Git y emite `build-info.json` con revisión, fecha, estado, modo,
proyecto público resuelto por la configuración del cliente y contratos. El proyecto no se toma
de un nombre de artefacto. No se exporta el resto del entorno. El sello se genera dentro del
build de recursos y puede formar parte del precache PWA; copiar versión no necesita otra consulta.

## Comprobador de consistencia

Los scripts `build` y `build:pwa` generan también `build-evidence.json`, una vez terminado
el build y su worker. Contiene hashes SHA-256 de los archivos del directorio, incluido el sello,
y de reglas, política, configuración Hosting, contratos y ambos lockfiles. No contiene sus textos,
credenciales ni datos de usuario. Su propio archivo queda fuera del inventario para evitar un
hash circular; los enlaces simbólicos no se admiten. Los hashes son de bytes exactos: un checkout con otros saltos de línea puede necesitar reconstruir y verificar en el entorno correspondiente.

Comprobación local, sin llamadas a Firebase ni escrituras:

```sh
node scripts/build-evidence.mjs verify spa --project demo-mangalist
node scripts/build-evidence.mjs verify pwa --project demo-mangalist
npm run check:release
```

Las dos primeras esperan builds demo limpios; la tercera espera PWA para `mangalist-61bb8`.
La herramienta rechaza proyecto/modo incorrectos, Git desconocido o distinto de la revisión
actual, árbol o sello modificados, archivos añadidos/ausentes/alterados, enlaces, inputs críticos
cambiados y contratos distintos. Un build demo no es candidato de producción.

Para comprobar un directorio archivado puede añadirse `--dir <directorio>`. Sigue comparándose
con el checkout actual y sus inputs críticos: no se aprueba un artefacto anterior solo porque
su inventario interno coincida. Hace falta una copia verificada de la revisión correspondiente
y una evaluación explícita frente a las reglas y contratos que seguirán activos.

`--allow-dirty-demo` solo permite probar un árbol modificado para el proyecto demo; se rechaza
si el destino es producción. No es una excepción para publicación. CI no utiliza esa opción.
Un archivo de fuentes sin `.git` puede compilarse para desarrollo, pero no supera la comprobación
de revisión identificada. Los archivos ignorados por Git, incluido el entorno, no determinan
`dirty`; el proyecto público se comprueba por separado. El resto de la configuración de Auth
necesita aceptación operativa, no queda certificado por el sello.

El hook local de Hosting queda: comprobación Spark remota de solo lectura, build PWA y
`check:release`. Si alguna falla, el CLI debe cancelar la publicación según el
[contrato de hooks de Firebase](https://firebase.google.com/docs/cli#deployment_commands).
No se ha invocado un despliegue para probarlo. CI bloquea también la retirada de esos hooks,
la generación de evidencia o la comprobación de release en los scripts.

Un manifiesto con hashes detecta inconsistencias; no demuestra autoría, aprobación, ausencia de
vulnerabilidades ni ejecución de tests. Se puede falsificar si alguien controla fuentes y
artefactos. Deben conservarse juntos el código revisado, los resultados CI y la aprobación humana.
La comprobación tampoco certifica el estado remoto actual ni impide acciones de un administrador
por consola, otro checkout o herramientas que no ejecuten estos hooks.

## Contratos y compatibilidad

`release-contract.json` declara Spark sin facturación, barrera de borrado v1, consultas acotadas
a 5001, importación recuperable v1 y exportación comprobada v2. Cambiar la declaración exige
modificar explícitamente el control Spark y revisar sus pruebas. La declaración no sustituye
las pruebas reales de reglas, reanudación, concurrencia, exportación y aislamiento del CI.

Las versiones anteriores sin sello/contratos no se consideran restaurables automáticamente.
Un cliente sin límite en la consulta puede ser rechazado por las reglas actuales; uno sin
reanudación no puede prometer completar un borrado. No se rebajan las reglas ni se elimina un
marcador para hacer funcionar un cliente antiguo. La recuperación prevista conserva las defensas
y corrige el frontend en una revisión nueva; un candidato anterior necesita evidencia equivalente
y una evaluación documentada antes de cualquier aprobación.

## Procedimiento de incidente, antes de solicitar autorización

1. Registrar el síntoma y la versión copiada por el usuario, sin solicitar bibliotecas, contraseñas
   ni tokens. Distinguir error de cliente, cuota agotada y borrado pendiente; no reintentar en bucle.
2. Seleccionar un candidato y registrar revisión completa, modo/proyecto, hashes de evidencia,
   dependencias, reglas/contratos y resultados CI de esa revisión. Una ejecución de PR puede
   compilar el commit de combinación de GitHub, distinto del HEAD de la rama: se registra el real.
3. Reproducir el fallo y validar la corrección en emuladores. Verificar el artefacto limpio y su
   inventario. Conservar la evidencia del candidato y de la versión afectada para revisión.
4. Documentar qué continuará activo: reglas, bloqueos, datos y Auth. Los borrados confirmados no
   se deshacen; no se restauran cuentas o bibliotecas de UIDs eliminados ni se borran marcadores.
5. Preparar el registro de publicación y presentar el candidato concreto al titular. Revisar
   facturación desactivada/sin cuenta y Firestore Standard de nuevo antes de una acción autorizada.
   Si no puede comprobarse, no se publica. Ninguna emergencia habilita Blaze ni servicios de pago.

## Ejecución, solo tras autorización expresa

El titular debe aprobar candidato exacto, destino y alcance. Identificar la release de Hosting
activa y la elegida, junto con las reglas efectivas; no inferirlas de este repositorio.
La restauración del canal publicado de Hosting crea otra release que sirve contenido de una
versión anterior, según [Firebase Hosting](https://firebase.google.com/docs/hosting/manage-hosting-resources#rollback).
No restaura las bibliotecas o cuentas ni convierte unas reglas antiguas en compatibles.

Una acción por consola o clonación puede eludir los hooks del repositorio: exige la misma
verificación y aprobación, sin presuponer que la herramienta la hace. Se conserva un registro
con quién aprobó y ejecutó, destino, hora, revisión, hashes y resultado. No se cambia la retención
de releases, ramas, IAM o APIs como parte implícita de una restauración.

Después de una publicación aprobada se validaría la aceptación acordada con cuentas sintéticas
expresamente autorizadas. No se prueban operaciones destructivas con cuentas de producción por
iniciativa del agente. La PWA puede conservar código anterior: guardar formularios, terminar
operaciones y cerrar todos los clientes sigue siendo necesario; no se fuerza activación/recarga.
La versión de Ajustes ayuda a distinguir ese caso del contenido que sirve el canal.

Si un borrado queda sin cliente, no continúa ni tiene garantía de finalización. La recuperación
de aplicación no lo transforma en un trabajo de fondo. Se necesita el responsable y plazo de
asistencia que decida el titular, conservando el marcador mientras corresponda.

## Evidencia y decisiones pendientes

CI verifica SPA/PWA demo con fuente limpia y conserva sus sellos e inventarios siete días.
Son evidencia de prueba, no un paquete publicado ni una autorización de despliegue. No se crean
releases, etiquetas o artefactos de producción automáticamente.

Las regresiones de archivos, contrato, proyecto, fuente, enlaces y privacidad de diagnóstico se
completan con un recorrido de navegador para copiar versión, portapapeles denegado y accesibilidad
de Ajustes a 320 píxeles. Esa revisión corrige también el ancho de la rejilla ante correos largos y el contraste de los textos de ayuda. No se atribuye éxito a comprobaciones remotas o aceptación no realizadas.

Queda decidir: responsable y aprobador de incidentes, plazo de asistencia para borrados, retención
de marcadores y de evidencia de releases publicadas, y autorización separada para protección de
main/IAM. Los siete días de artefactos CI no sustituyen un archivo operativo de producción.
