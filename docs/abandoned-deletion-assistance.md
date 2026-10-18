# Procedimiento propuesto de asistencia a borrados abandonados

Solo documentación. Sin operaciones sobre cuentas reales, sin credenciales de
administración en el cliente y sin activar servicios de pago. Cada actuación real
necesita autorización específica y un responsable designado. Esta propuesta no
autoriza envíos a usuarios, accesos a bibliotecas ni borrados administrativos.

## Recepción y verificación de identidad

1. Abrir un caso privado en un canal aprobado; asignar responsable y sustituto.
   Registrar fecha, alcance solicitado y estado conocido. No pedir contraseña,
   token, código MFA, cookie, copia de biblioteca ni documento de identidad por chat.
2. Si la persona aún controla su cuenta, pedir que recupere acceso mediante el
   proveedor original y se reautentique en la aplicación. La recuperación de
   contraseña no revierte un borrado iniciado. El marcador seguirá impidiendo escribir.
3. Vincular el caso con el UID mediante evidencia autenticada y un canal previamente
   verificado de esa cuenta. Un correo escrito en un formulario, UID enviado por
   chat, captura de pantalla o conocimiento de títulos no prueban propiedad.
   Sin una atestación de sesión ya disponible, el operador autorizado contrasta el
   registro Auth y envía un desafío de un solo uso al canal previamente verificado;
   confirma también el proveedor original. No aceptar un correo cambiado durante
   el caso como único factor. Definir canal, caducidad y registro antes de usarlo.
4. Si no controla el proveedor/canal anterior, derivar primero a recuperación del
   proveedor. Si Auth ya fue eliminado, exigir evidencia de propiedad previamente
   verificada y vinculada al caso antes de la eliminación. Sin evidencia suficiente,
   escalar al responsable de privacidad: no revelar existencia, UID ni datos y no
   ejecutar cambios. No recrear una cuenta con el mismo UID para comprobar identidad.
5. Una vez verificada la propiedad, pedir confirmación del alcance destructivo concreto
   y conservarla en el caso. Autenticación y autorización de borrado son comprobaciones
   distintas. El operador verifica también su permiso administrativo y proyecto objetivo.

## Clasificación de solo lectura

Con acceso autorizado, comprobar proyecto, plan Spark/billing desvinculado, estado
Auth, marcador y presencia de subcolecciones mediante consultas acotadas. No usar
pantallas de caché como evidencia de finalización. Registrar únicamente cantidades,
fechas y estado; no copiar contenido de obras al ticket.

| Estado                                                    | Siguiente actuación propuesta                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Auth activo, sin marcador                                 | No hay prueba de borrado iniciado. Ofrecer flujo normal con reautenticación y confirmación.  |
| Auth activo, marcador deleting y mangas                   | Reanudar desde la aplicación; conservar marcador y progreso.                                 |
| Auth activo, marcador deleting y sin mangas               | Reautenticar y reintentar finalizar Auth. No retirar marcador.                               |
| Auth ausente, marcador deleting y mangas                  | Posible abandono administrativo: escalar, nunca recrear Auth ni quitar marcador para entrar. |
| Auth ausente, marcador deleting y sin datos               | Candidato a revisión de retención; la ausencia no autoriza retirar el marcador.              |
| Identidad incierta, estados ambiguos o datos sin marcador | Detener cambios, documentar discrepancia y escalar sin divulgar datos.                       |

## Reanudación ordinaria y fallos

La persona confirma de nuevo en Ajustes. El cliente mantiene el marcador y elimina
lotes de 400 hasta 2000 documentos por intento. En bibliotecas mayores se necesitan
varios intentos, cada uno con reautenticación; no hay límite total de 2000 por cuenta.
Al finalizar los datos intenta borrar Auth. Si cierra la pestaña, pierde red o agota
presupuesto, el marcador permanece y la siguiente confirmación continúa con lo restante.

Ante `resource-exhausted`, conservar el caso, detener nuevas peticiones y esperar al
reinicio correspondiente de cuota; los 15 minutos de pausa local no garantizan que
la cuota diaria vuelva a estar disponible. Nunca vincular billing como solución.
Si Auth exige login reciente, reautenticar; si falla un lote con resultado ambiguo,
volver a consultar el servidor antes de informar cantidades o repetir operaciones.

## Excepción administrativa, todavía no autorizada

Solo después de identidad, alcance y autorización explícita, un operador de mínimo
privilegio y un revisor preparan un plan por caso. El plan debe mantener el marcador,
revocar refresh tokens, impedir nuevas sesiones, consultar inventario y borrar en
lotes acotados con comprobación de proyecto/UID antes de cada lote. Exigir nueva
autorización si cambia el alcance. Las herramientas Admin omiten reglas: revisar dos
veces la ruta y no usar comandos recursivos generales ni un script de limpieza masiva.

Comprobar resultados en servidor tras cada fallo y al final; confirmar Auth eliminado,
subcolecciones vacías y marcador conservado. Conservar evidencia mínima y cerrar
el caso sin prometer retirada del marcador hasta aprobar su política. No se entrega
un script destructivo ni se programa una limpieza automática.

## Recuperación y comunicación

Recuperar acceso al proveedor permite reanudar el borrado; no recupera obras ya
eliminadas. No se puede cancelar de forma segura un borrado parcial con las reglas
actuales. No borrar el marcador para desbloquear escrituras. Una recuperación desde
exportación voluntaria requiere decisión explícita, cuenta nueva y revisión del caso;
no restaurar el UID anterior ni importar datos silenciosamente.

Informar por el canal privado verificado: fase alcanzada, operaciones pendientes,
cuándo reintentar y limitación de recuperación. No afirmar «todos los datos borrados»
si solo se borró Auth o el documento padre. No prometer finalización sin un cliente
abierto o asistencia autorizada: Spark no ejecuta un trabajador de fondo.

Ensayar únicamente con `demo-mangalist` en emuladores: más de 2000 obras,
interrupción entre lotes, fallo Auth al final, identidad distinta, token antiguo,
cuota y respuesta perdida. Registrar resultados sin copiar credenciales.

Pendiente de aprobación: canal privado y mecanismo de desafío, responsables y
permisos, plazos de primera respuesta/escalado, evidencia de identidad aceptable,
retención del caso y [política de marcador](account-marker-retention-proposal.md).
