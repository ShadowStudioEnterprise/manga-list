# ML-11: completar MFA, recuperación, auditoría y custodia

Preparación y revisión del 21/10/2026, posterior al
[primer ensayo parcial de Proton](proton-drive-service-rehearsal-2026-10-21.md).
El usuario confirma que aún no tiene participante y pide mantener pendiente la
prueba entre personas. D3 conserva un revisor independiente por designar.

Se revisaron las secciones existentes de seguridad y recuperación de la cuenta
autorizada, sin modificar opciones. Sus resultados concretos se guardan solo en
un apéndice local privado, fuera de Git/PR. No publicar estados de seguridad de
la cuenta, contactos, sesiones, códigos o materiales de recuperación para probar
que se hizo la revisión. La presente guía contiene controles y límites generales.

## MFA: intervención del titular y comprobación posterior

El titular configura MFA y guarda sus códigos fuera de la sesión de trabajo.
No se solicitan contraseñas, QR, claves o códigos por chat ni se incluyen en
capturas, actas o repositorio. Configurar un factor cambia credenciales de
seguridad: la entrada, confirmación y envío los completa el titular en Proton.

Secuencia propuesta de ensayo, sin cambiar contraseñas ni revocar sesiones:

1. El titular completa la configuración de una aplicación de autenticación o
   llave compatible y guarda los códigos de respaldo de forma protegida.
2. El agente comprueba únicamente el indicador de factor habilitado cuando el
   titular confirme que ha terminado; no pulsa para mostrar/regenerar códigos.
3. Conservar la sesión de trabajo. En otra sesión que gestione el titular,
   comprobar que se solicita el segundo factor y que el acceso solo termina tras
   completarlo. No provocar bloqueos por intentos fallidos repetidos.
4. Registrar fecha, método general, resultado y si fue observado o declarado por
   el titular. «Habilitado» no se anota como prueba de desafío completada.

Si falta un resultado, PD01 permanece parcial. Esta guía no prueba por sí sola
la protección del factor ni su recuperación. No crear credenciales persistentes
para el agente ni usar una cuenta compartida.

## Recuperación de acceso y de datos: pruebas distintas

La [documentación de recuperación de Proton](https://proton.me/support/set-account-recovery-methods)
separa volver a entrar de volver a descifrar contenido. Un método de restablecer
contraseña no garantiza recuperación de datos cifrados.

El titular comprueba privadamente que conserva sus materiales y puede acceder a
ellos sin depender exclusivamente del ordenador habitual. Registrar solo un estado
de disponibilidad, no su contenido o ubicación precisa en un informe compartido.
El indicador «Guardado» de un archivo no demuestra esa disponibilidad externa.

No ensayar un restablecimiento de contraseña, revocar sesiones o eliminar claves
de la cuenta existente para completar una prueba. Preparar por separado un ensayo
controlado de recuperación que preserve acceso y datos; su alcance y cualquier
acción sobre credenciales necesitan intervención del titular. Hasta ejecutarlo,
la recuperación de cuenta/descifrado sigue sin demostrar. Una restauración de un
archivo desde historial tampoco completa esa prueba.

## Auditoría disponible y cobertura pendiente

El [monitor individual de cuentas](https://proton.me/support/account-monitor-individual-accounts)
está documentado para accesos y actividad de gestión, también en planes gratuitos.
Permite consultar y exportar eventos de cuenta. No equivale a un registro completo
de cada lectura, descarga y denegación de archivos en Drive.

Los eventos detallados añaden información como IP; no activarlos solo para llenar
una casilla de ML-11. Determinar necesidad, acceso y retención bajo D5 antes de
ampliar datos. No desactivar el monitor ni usar «Wipe»: el proveedor advierte que
desactivar elimina sus eventos. Esta revisión no cambia opciones ni exporta logs.

| Fuente                    | Evidencia posible                                          | Lo que no acredita                                                                |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Monitor de cuenta         | Accesos/actividad de gestión según eventos disponibles     | Cada lectura/denegación de un expediente                                          |
| Historial Drive           | Versiones observables y restauración de una muestra        | Cobertura de 30/90 días o de lecturas silenciosas                                 |
| Manifiesto custodiado     | Contraste de bytes respecto a una referencia               | Identidad, hora confiable o custodia si ambos son alterables por la misma persona |
| Acta y registro humano P3 | Acciones observadas/declaradas y revisión por otra persona | Actividad no registrada o bloqueo automático ante fallo de auditoría              |

P3 sigue pendiente de validación y aceptación de riesgos residuales. La existencia
de monitor de cuenta no resuelve la trazabilidad exigida por la ficha de activación.
No se afirma que el producto carezca de toda auditoría: solo que la requerida para
ML-11 no queda acreditada por estas fuentes.

## Custodia independiente propuesta

El operador prepara una versión y manifiesto. Una persona distinta, formalmente
designada y con cuenta/almacenamiento bajo su control, recibe únicamente el mínimo
necesario mediante un canal autorizado, contrasta el inventario y conserva una
referencia y conclusión que el operador no pueda sobrescribir.

La cuenta del custodio debe tener MFA y recuperación propios; no compartir su
contraseña o códigos con el operador. La eventual coincidencia entre revisor y
custodio se evalúa y acepta expresamente; no se presume aprobada. Otra carpeta
o clave que el operador administra en el mismo equipo no acredita independencia.
No se ha designado custodio, creado una cuenta ni transmitido material a nadie.

Ficha vacía para una futura entrega autorizada, cumplimentada fuera de Git:

| Campo                   | Contenido permitido                                                             |
| ----------------------- | ------------------------------------------------------------------------------- |
| Referencia y alcance    | ID opaco del ensayo/caso y versión exacta; sin UID en nombres                   |
| Entrega                 | Fecha UTC declarada, actor autorizado, inventario, algoritmo y huellas          |
| Recepción independiente | Persona receptora designada, contraste de bytes y resultado                     |
| Control de acceso       | Propietario, permisos del operador y prueba de que no sobrescribe la referencia |
| Custodia de claves      | Confirmación de disponibilidad separada, sin clave ni ubicación precisa         |
| Retención               | Categoría y criterio aprobado en D5, siguiente revisión y responsable           |
| Incidencias             | Diferencia, carencia, acción propuesta y referencia a corrección posterior      |

La ficha no se llama firma electrónica ni sello de tiempo. Sin persona distinta
y prueba de permisos, el estado es `CUSTODIA_INDEPENDIENTE_PENDIENTE`. El usuario
ha pedido mantener pendiente la prueba entre personas; no se envían invitaciones.

## Ensayo local adicional de copia cifrada

Se cifraron los cinco archivos ficticios locales del primer ensayo con
AES-256-GCM y una clave aleatoria exclusivamente de prueba. Se leyeron cifrado y
clave desde disco y se restauraron cinco archivos, con coincidencia de sus huellas.
También se comprobó rechazo de una clave incorrecta y de una alteración del cifrado.

Este resultado valida únicamente la ida/vuelta de ese conjunto local. No es una
exportación completa de Proton ni usa su archivo/frase de recuperación. La clave
de ejercicio y el cifrado permanecen en el mismo ordenador, en directorios
distintos; no se han acreditado ACL de Windows, otro dispositivo, custodio,
conservación, pérdida del equipo o restauración de permisos. La clave de prueba no
se publica en Git, PR o ZIP de entrega. P4 y PD05 siguen parciales.

## Criterios de cierre y decisiones

Continuación del mismo día: se revisó el indicador de MFA sin mostrar secretos y
se obtuvo declaración del titular sobre desafío de acceso y disponibilidad de
materiales de respaldo. El detalle de la cuenta y la distinción observado/declarado
permanecen en el apéndice privado. No se da por probado un restablecimiento ni
descifrado tras pérdida. Además, la exportación por interfaz de los cinco archivos
ficticios se extrajo y contrastó íntegramente; no incluye permisos ni historial.

| Bloque                 | Evidencia necesaria para cerrarlo                                       | Estado de esta continuación                                           |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| MFA/PD01               | Factor configurado, desafío y recuperación documentados                 | Revisión privada y paso al titular; pendiente de resultados completos |
| Recuperación de cuenta | Acceso y descifrado tras contingencia controlada                        | No ejecutada; no se alteraron credenciales                            |
| Permisos/PD02–PD04     | Participante, invitación autorizada, denegaciones cruzadas y revocación | Pendiente por decisión expresa del usuario                            |
| Auditoría/PD06–P3      | Cobertura y carencias evaluadas, aceptación de alternativa y custodia   | Monitor de cuenta diferenciado; cobertura completa no acreditada      |
| Copia/PD05–P4          | Destino separado, claves disponibles, restauración y permisos           | Ensayo local cifrado correcto, respaldo externo no establecido        |
| Custodia/D3            | Designación, recepción y referencia fuera del control del operador      | Pendiente; no se inventa independencia                                |

Aceptar o completar un factor no acepta P3/P4 ni activa expedientes reales. Se
mantienen matriz D5, revisión D7 y autorización de activación pendientes. Firebase
Spark exclusivamente, sin acceso a Firebase, borrado automático, compras, fusión
o despliegue. Fuentes oficiales enlazadas consultadas el 21/10/2026.
