# Proton Drive para ML-11: selección y procedimiento propuesto

Fecha: 21/10/2026. El usuario indica «cambia a Proton Drive»: **Proton Drive queda
seleccionado para la preparación de ML-11**, con plan gratuito como objetivo.
Sustituye a Nextcloud como candidata principal. Esta instrucción no acepta todos
los controles nuevos ni activa expedientes reales. No se ha creado o utilizado
una cuenta Proton, invitado a personas, configurado almacenamiento remoto ni
migrado datos. Los documentos anteriores se conservan como antecedentes.

## Alcance, coste y cambio de arquitectura

Archivo privado de actas y evidencias mínimas, separado de Firebase. Sin servidor
Linux propio, Nextcloud, MariaDB, caché ni pasarela desplegada. Sin SDK Admin,
tokens o conexión operativa a Firebase. Solo navegador como cliente inicial
propuesto; no instalar sincronización de carpetas del ordenador habitual.

Objetivo: **0 €/mes de suscripción**, con 2 GB iniciales según la documentación
consultada; hasta 5 GB tras completar las acciones iniciales en 30 días. No hace
falta esa ampliación para el ensayo: menos de 100 MB de material ficticio. Una
acción de ampliación implica crear un enlace público; no hacerlo con expedientes
y no considerarlo necesario para usar el canal. No contratar planes superiores,
dominio o infraestructura. Tiempo, recuperación y copia externa siguen siendo
recursos necesarios, sin presupuesto ni disponibilidad presumidos.

Las decisiones Nextcloud N1–N5 no se marcan aceptadas en bloque: N1 queda sustituida
en selección de plataforma; el diseño de servidor y coste de N4 deja de ser la
base actual. N2 conserva sus objetivos de independencia por resolver; N3 de
mediación/bloqueo no está implementada ni se atribuye a Proton; N5 conserva la
condición de no activar casos reales antes de completar validaciones. La nueva
alternativa de controles P2/P3 requiere aceptación y evidencia propias.

## Personas y espacios con permisos separados

Cuenta individual con MFA para cada participante. Sin cuenta compartida, alias
que aparenten personas distintas o credenciales en Git. El promotor sigue como
operador; el revisor independiente y la suplencia continúan pendientes según D3.
Titularidad, privacidad y custodia se formalizan fuera del repositorio.

| Espacio privado propuesto        | Propiedad y escritura                                | Acceso de otras personas                                      |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `ML11-Operacion/<caso-opaco>/`   | Operador prepara borrador y evidencias mínimas       | Revisor como lector de lo necesario; sin edición del original |
| `ML11-Revision/<caso-opaco>/`    | Revisor distinto del operador conserva su conclusión | Operador como lector; sin sobrescribir la conclusión          |
| `ML11-Restringido/<caso-opaco>/` | Custodio por designar                                | Vínculo caso/UID e identidad solo por necesidad documentada   |

No compartir una carpeta padre que reúna operación, revisión e identidad. La
separación se crea por propiedad/carpeta y cuentas reales, no por nombres de
subcarpetas. Solo invitaciones nominales aprobadas en una fase posterior, sin
enlaces públicos. Esta propuesta no autoriza enviar invitaciones ni correos.

La documentación de Proton permite lectura o edición y revocar acceso. Los
editores pueden administrar accesos por defecto; el ajuste **Access desactivado**
impide esa delegación según el proveedor. Empezar con lectores y propietarios
separados, sin editores adicionales; si se necesita edición, probar ese ajuste
antes de concederla. No suponer controles globales de empresa en cuentas Free.
La revocación no borra archivos ya descargados, capturas ni copias de otra persona.

El propietario conserva control sobre sus archivos. Otra carpeta del mismo
propietario no acredita custodia independiente ni inmutabilidad. El custodio del
vínculo y el destino de copia ajeno al operador siguen sin designar. Tener solo el
ordenador habitual impide presumir un segundo dispositivo o respaldo físico.

## Procedimiento de preparación y operación futura

1. Documentar cuenta, responsable, MFA y recuperación en registro privado; no
   publicar direcciones. Probar recuperación tanto de acceso como de datos antes
   de confiarle expedientes. Custodiar códigos y materiales de recuperación fuera
   de la sesión y del repositorio, sin compartir secretos entre participantes.
2. Ensayar espacios separados con casos `SYN-PD-001` y `SYN-PD-002`, sin UID,
   personas ni contactos reales. Las cuentas necesarias para probar el servicio
   y sus invitaciones requieren una fase autorizada aparte.
3. Para cada futuro expediente autorizado, el operador mantiene acta mínima,
   evidencias por referencia y agenda humana. `receivedAt` y plazo de respuesta
   a derechos permanecen separados de `completedAt` y `reviewAt` a 720 horas.
   Sin finalización acreditada, registrar pendiente; no calcular retirada.
4. Preparar una versión identificada del acta y un manifiesto de archivos con
   huellas SHA-256 calculadas localmente. El revisor contrasta esa versión y
   conserva conclusión y manifiesto en su espacio propio, si se autoriza ese
   control. Corregir con nueva versión enlazada a la anterior. Una huella ayuda a
   detectar cambios respecto a una referencia custodiada; no es firma, sello de
   tiempo, prueba de identidad o protección frente al dueño de ambas copias.
5. Sin revisor o evidencia suficiente, estado `PENDIENTE_REVISION`; conservar y
   escalar conforme a D5, sin retirada ni excepción indefinida. Excepciones con
   responsable y próxima revisión como máximo en 30 días. Incompletos: agenda
   7/30/90 días, sin confundir silencio con consentimiento o finalización.
6. Tras cierre, revisar manualmente vínculo caso/UID a los 30 días según D5.
   Retención final de actas, copias e identidad pendiente de revisión jurídica;
   no eliminar por el mero transcurso de ese periodo. No crear automatizaciones
   en Proton ni en Firebase para borrar cuentas o marcadores.

Campos de acta: ID opaco, fase, recepción y plazo de respuesta separado, evidencia
de finalización y fecha de revisión, inventario/referencias mínimas, propuesta,
versión/manifiesto, autor de revisión, conclusión, excepción y próxima fecha,
carencias y responsable. No guardar bibliotecas, DNI por defecto, contraseñas,
tokens, cookies, códigos MFA ni enlaces de acceso en actas o registros públicos.

## Auditoría: carencias y alternativa pendiente

No se ha acreditado en Proton Free un registro exportable completo de cada lectura
y denegación, custodia independiente ni bloqueo previo por fallo del registro.
La actividad del cliente y el historial de versiones no demuestran esas garantías.
Las pruebas del piloto Nextcloud y su prototipo de control **no validan Proton**.

P3 propone un registro humano por eventos: instante UTC declarado, actor, ID opaco,
acción, versión, motivo, destinatario autorizado cuando proceda, resultado y
referencia de evidencia. Anotar altas/bajas de permisos, envíos autorizados,
revisiones, excepciones y recuperaciones. Custodiar la conclusión por separado y
conciliar periódicamente permisos y manifiestos con el revisor.

Ese registro no observa una lectura silenciosa, descarga no declarada, denegación
no registrada ni manipulación previa a la revisión. No se denomina auditoría
completa o inmutable; no ofrece equivalencia demostrada con N3. La carencia de
trazabilidad de lecturas de la ficha de activación sigue abierta. Se requiere
análisis de riesgo, revisión independiente/jurídica y aceptación expresa de los
controles alternativos antes de casos reales. Si son insuficientes, detener la
activación y revisar el diseño sin contratar automáticamente otro producto.

## Conservación, copias y continuidad

Proton Free conserva automáticamente hasta 10 versiones por archivo durante hasta
7 días; no utilizarlo como evidencia suficiente para revisiones de 30 o 90 días.
Preparar versiones documentales explícitas y copias bajo D5. La exportación
local es una copia de trabajo hasta probar recuperación, cifrado, permisos y
conservación; la sincronización sola no acredita backup.

Propuesta P4: copia manual cifrada tras hitos y revisión semanal de la agenda,
permisos, cuota y estado de respaldo. Destino externo al equipo y custodia de
claves pendientes; no presumir coste cero total. Ensayar restauración de archivos
y permisos, cierre de sesiones y revocación. No afirmar RPO de 24 h ni recuperación
en una jornada: eran objetivos de la candidata Nextcloud, no resultados de Proton.

El proveedor contempla eliminar cuentas gratuitas por más de 12 meses de
inactividad. La revisión semanal propuesta debe incluir uso real del servicio y
comprobar avisos; no confiar en que una tarea programada mantenga la cuenta.
No relacionar esa política con el plazo de los marcadores de Firebase.

Revisión jurídica pendiente: finalidad admitida del plan, encargo cuando proceda,
ubicación, subencargados, accesos de soporte, transferencias, conservación y
recuperación. No inferir validación legal de cifrado, marca o ubicación anunciada.

## Pruebas de aceptación pendientes

El [paquete de ensayo documental](proton-drive-rehearsal-pack.md) aporta plantillas,
casos ficticios y guion concreto; sus contrastes locales de manifiesto no sustituyen
las pruebas del servicio ni resuelven la custodia.

Todas figuran **no ejecutadas en Proton**; no hay cuenta ni sesión probada.

| ID   | Ensayo con datos ficticios                       | Evidencia para aceptar                                                                                                     |
| ---- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| PD01 | MFA, recuperación y cierre de sesiones           | Login positivo/negativo y recuperación de datos, sin exponer secretos                                                      |
| PD02 | Acceso nominal y persona no invitada             | Permitido por rol; denegado sin autorización; ningún enlace público activo                                                 |
| PD03 | Separación entre acta y revisión                 | Operador no modifica conclusión; revisor no modifica acta; comprobar herencia                                              |
| PD04 | Gestión de compartición                          | Lectores no administran accesos; si hay editores, probar Access desactivado y revocación                                   |
| PD05 | Versiones, exportación y restauración            | Reconstruir acta y manifiesto concretos; detectar alteración y comprobar permisos                                          |
| PD06 | Auditoría y carencias                            | Contrastar eventos disponibles, lecturas/denegaciones no observables y alternativa P3; no aceptar solo por tener historial |
| PD07 | Fallo de acceso, cuota llena y pérdida de equipo | Mantener seguimiento por vía de contingencia aprobada sin copiar datos a un canal no autorizado                            |
| PD08 | Mesa 29/30/90 días y ausencia de revisor         | Sin retirada automática; D3 impide autoaprobación; dos relojes independientes                                              |
| PD09 | Conservación y cierre                            | Matriz resuelta para versiones, papelera, descargas y copias; retirada de permisos y límites documentados                  |

## Decisiones y estado

| ID  | Decisión                                                                                    | Estado                                                                                           |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| P1  | Sustituir Nextcloud por Proton Drive como plataforma de preparación, objetivo Free          | Aceptada por «cambia a Proton Drive»; cuenta/configuración no realizadas                         |
| P2  | Cuentas individuales con MFA, tres espacios separados, lectura nominal sin enlaces públicos | Propuesta pendiente de pruebas y aceptación de permisos                                          |
| P3  | Registro humano y conclusión/manifiesto bajo custodia separada con limitaciones explícitas  | Pendiente de aceptación y validación; no sustituye silenciosamente N3 ni la trazabilidad exigida |
| P4  | Copias por hitos, revisión semanal y destino cifrado fuera del equipo                       | Pendiente de destino, custodia, conservación, ensayo y aceptación                                |
| P5  | Ensayo autorizado con datos ficticios; activación real posterior tras D1–D7                 | No hay autorización de alta/invitaciones ni activación real en esta selección documental         |

Sin compras, fusión, despliegues, modificación de cuentas reales o cambios remotos
de Firebase. Spark exclusivamente. La selección de Proton no acredita cumplimiento
jurídico definitivo ni capacidad de ejecutar operaciones administrativas.

## Fuentes oficiales consultadas el 21/10/2026

- [Espacio gratuito y acciones iniciales](https://proton.me/support/more-storage-proton-drive).
- [Compartir por invitación](https://proton.me/support/drive-how-to-share-files-via-email) y [gestión de accesos y editores](https://proton.me/support/drive-manage-access-shared-files).
- [MFA y recuperación](https://proton.me/support/two-factor-authentication-2fa).
- [Historial de versiones](https://proton.me/support/version-history) e [inactividad](https://proton.me/support/inactive-accounts).
