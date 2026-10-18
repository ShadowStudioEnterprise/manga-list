# PROPUESTA pendiente de aprobación: retención de users/{uid}

Documento de diseño, sin aplicación ni cambio de reglas. No autoriza eliminar
marcadores, revocar sesiones, modificar cuentas, añadir campos ni ejecutar trabajos
en producción. Se mantiene exclusivamente Spark y se conserva el comportamiento
actual: el marcador `status: deleting` permanece después del borrado de Auth.

## Motivo y datos mínimos

Las reglas actuales rechazan crear/actualizar mangas si existe el marcador; tampoco
permiten al cliente retirarlo ni volver a activar ese usuario. Sin él, una sesión que
todavía conserve un ID token válido podría volver a crear datos huérfanos. Revocar
refresh tokens no hace que las reglas actuales comprueben por sí solas su revocación.
El marcador no bloquea lecturas ni borrados del propietario con token válido; por eso
no debe confundirse con una revocación de acceso inmediata.

Conservar únicamente el UID en la ruta y los campos ya existentes `createdAt`,
`updatedAt`, `status`. No copiar correo, nombre, proveedor, notas, IP, tokens ni
biblioteca. El UID continúa siendo identificador vinculable y debe tener acceso
restringido, propósito documentado y revisión periódica. Los registros de asistencia
no deben convertirse en una copia adicional de los datos eliminados.

`updatedAt` registra el comienzo del borrado, NO confirma el fin del borrado de
subcolecciones, la eliminación Auth ni la revocación. No sirve por sí solo para
calcular una fecha segura de retirada. No habilitar TTL: sería eliminación sin
comprobar condiciones y exige facturación para sus borrados.

## Plazos propuestos

- Revisión manual a los 30 días desde la confirmación operativa de finalización,
  con retirada solo si se cumplen todas las condiciones siguientes. No es un borrado
  automático al cumplir 30 días ni plazo prometido al usuario hasta su aprobación.
- Margen mínimo adicional de 24 horas desde la última confirmación de eliminación
  o deshabilitación y revocación Auth. Se aplica aunque los ID tokens ordinarios
  duren aproximadamente una hora; cubre errores de reloj y ejecución manual.
- Borrados incompletos se revisan a los 7 días y se escalan a los 30. A los 90 días
  el responsable debe decidir y justificar la continuidad de la retención mínima
  o una actuación específica. El paso del tiempo nunca demuestra finalización.
- Si no puede demostrarse alguna condición, conservar el marcador mínimo, registrar
  motivo y próxima revisión. No declarar una retención indefinida por defecto;
  someter excepciones al responsable de privacidad/seguridad con revisión fechada.

## Condiciones acumulativas para proponer retirada

1. Caso autorizado por separado y verificación de identidad según el procedimiento
   de asistencia. Registrar revisión de dos personas para una retirada administrativa.
2. Auth confirma que el UID no existe; si existe, completar primero el procedimiento
   autorizado, revocar refresh tokens con herramienta administrativa y confirmar
   la eliminación. No recrear/importar el mismo UID durante la ventana de revisión.
3. Confirmación fechada de revocación/eliminación y transcurso de los márgenes de
   tokens. Si hubo un fallo ambiguo, investigar y reiniciar la ventana; no usar la
   fecha del marcador como sustituto.
4. Lecturas del servidor, paginadas y acotadas, confirman que no quedan mangas ni
   otras subcolecciones/datos asociados. El borrado de un documento padre no elimina
   subcolecciones. Revisar el inventario si el esquema cambió.
5. No hay restauración/importación de Auth del mismo UID, reclamación en investigación
   o operación concurrente. Una restauración futura del UID requiere reevaluar el
   riesgo antes de retirarlo; la ausencia puntual no prueba ausencia futura.
6. Pruebas en emulador con token antiguo muestran que la versión de reglas autorizada
   mantiene el bloqueo durante toda la operación. Revisar cualquier rollback que
   retire ese bloqueo. No eliminar el marcador primero para facilitar asistencia.
7. Registrar evidencia mínima de finalización, sin datos de biblioteca ni credenciales,
   y obtener autorización explícita para retirar ese marcador concreto. Revisar
   inmediatamente que no se hayan recreado datos; ante incertidumbre, no retirar.

Para un bloqueo verificable inmediatamente tras revocación haría falta un diseño
de reglas que consulte metadatos de revocación conservados y compare `auth_time`,
con evaluación de coste y pruebas adicionales. No se aplica en esta rama. No usar
un endpoint público de administración ni incluir credenciales Admin en el cliente.

## Privacidad, responsables y decisiones

Propuesta para registros de asistencia: conservar solo identificador de caso, UID
restringido, autorización, hitos/fechas y resultado; retirar el vínculo UID/caso 30 días
después del cierre, salvo excepción aprobada y revisada. No pedir exportaciones de
biblioteca como prueba de identidad. Confirmar este plazo y el canal de asistencia
antes de implantarlo.

El titular debe aprobar responsable, sustituto, plazos, texto de privacidad, criterio
de excepciones, registro de evidencia y riesgo residual de tokens/UID reutilizado.
Este diseño no sustituye la revisión de privacidad que corresponda al producto.

Referencias oficiales:
[duración de tokens, revocación y reglas](https://firebase.google.com/docs/auth/admin/manage-sessions),
[eliminación de datos y subcolecciones](https://firebase.google.com/docs/firestore/manage-data/delete-data),
[funciones sin uso gratuito, incluido TTL](https://firebase.google.com/docs/firestore/quotas).
