# ML-12: verificación de identidad y permisos, ficha v1

Parte del [paquete de preparación](ml-12-mailbox-and-roles-pack.md).
**Diseño para revisar y ensayar**, no implementación ni permiso de producción.
No enviar desafíos, invitaciones ni datos reales desde esta preparación.

## ID-01: ficha de comprobación proporcionada

Separar cuatro resultados: identidad del solicitante; representación si procede;
confirmación del alcance destructivo; autorización del operador. Ninguno sustituye
los demás. No recoger contraseña, token, cookie, códigos MFA, biblioteca ni DNI
por rutina. La [AEPD sobre identificación](https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/3-identificacion-con-dni/FAQ-0108-para-el-ejercicio-de-estos-derechos-es-necesario-facilitar-la-copia-del-dni)
indica que la información adicional debe ser necesaria ante dudas razonables.

| Situación                                      | Vía propuesta                                                                                        | Evidencia mínima / condición de parada                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Controla cuenta y proveedor original           | Reautenticación en app y reanudación por el titular                                                  | No presentar ese login como atestación enviada a soporte: hoy no existe; operador no ve contraseña |
| Necesita intervención manual con Auth presente | Consulta autorizada vincula UID y canal previamente verificado; mecanismo ID-02 solo tras validación | Resultado y referencia al contraste restringido; correo recién aportado no basta                   |
| No controla proveedor                          | Recuperación del proveedor y evaluación por privacidad si no basta                                   | Sin recuperación acreditada, no inventar vínculo ni revelar cuenta                                 |
| Auth ya ausente                                | Evidencia verificada antes de la baja, vinculada al caso, más evaluación proporcional                | Sin evidencia suficiente, escalar con reloj de derechos activo; nunca recrear UID                  |
| Representante                                  | Mandato y alcance contrastados por privacidad                                                        | Controlar email/login no prueba representación; documentación mínima separada                      |
| Indicios contradictorios                       | Revisión de privacidad y seguridad                                                                   | No divulgar existencia ni ejecutar; respuesta neutral y próxima acción                             |

Ficha privada: ID opaco; recepción original; situación; método propuesto;
justificación si se pide dato adicional; resultado `VERIFICADA / INSUFICIENTE /
CONTRADICTORIA`; fuente/referencia restringida; actor/revisor y UTC; mandato;
alcance confirmado; incertidumbres; siguiente paso y fecha. Conservar solo datos
adicionales indispensables durante el periodo aprobado por D5. No anotar el
contacto completo en la bitácora de acceso general.

## ID-02: especificación de desafío de soporte pendiente

Mantiene la propuesta ML-11: un solo uso, caducidad de 15 minutos desde emisión y
máximo 3 intentos. El cuarto intento, repetición o uso a partir de la caducidad
se rechaza. Un fallo conduce a alternativa/revisión humana, no pérdida del derecho.
No es un código de acceso a Firebase, contraseña de aplicación ni MFA.

Requisitos de la implementación que se elija, **todavía inexistente**:

1. Emitir solo tras autorización del caso y contraste del canal previamente
   verificado, sin aceptar el nuevo correo del solicitante como prueba única.
2. Usar generador criptográfico y valor no predecible, ligado a caso, UID,
   propósito y vencimiento; validar fuente/canal sin revelar cuenta a terceros.
3. Evitar texto del desafío en actas, logs, Git o carpetas compartidas. El validador
   almacena solo un verificador protegido y metadatos mínimos, con acceso acotado.
   No se ha elegido software/ubicación; una hoja compartida o Drive sin control
   de consumo único no satisfacen este requisito por sí mismos.
4. Contabilizar intentos y consumir la prueba atómicamente; no aceptar dos respuestas
   concurrentes ni reutilizar un desafío sustituido. Ensayar límites y caducidad.
5. Verificar en canal privado autorizado, registrar solo resultado y referencia,
   retirar verificador al finalizar/caducar conforme a política aprobada. El valor
   no autoriza por sí solo borrar ni demuestra representación.
6. Privacidad revisa amenazas del canal comprometido, cambios recientes de contacto,
   phishing y alternativas. Si no existe una implementación gratuita validada,
   mantener ID-02 sin activar y evaluar otra vía proporcionada sin imponer login
   imposible a quien ya no tiene Auth.

Esto especifica aceptación de un diseño futuro, no instala un backend ni exige
Blaze. No configurar desafíos usando email de recuperación del proveedor, enlaces
de inicio de sesión o códigos MFA. No pedir reenviar esos mensajes a soporte.

## P-01: matriz de recursos de ensayo

Solo archivos sintéticos. Personas distintas controlan sus cuentas; no pedir ni
compartir contraseñas. Cada invitación futura requiere destinatario, recurso,
permiso y autorización concreta. El buzón, Drive y Firebase tienen permisos
distintos; que funcione uno no acredita los demás.

| Recurso                                | Operador                             | Revisor D3                                   | Custodio                                   | Suplente                                               |
| -------------------------------------- | ------------------------------------ | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Buzón                                  | Tramitar con acceso nominal aprobado | Sin acceso ordinario al buzón                | Administrar solo si está autorizado        | Acceso de suplencia comprobado o contingencia validada |
| Operación: acta mínima                 | Propietario/editor de sus versiones  | Lector nominal; conclusión en recurso propio | Custodia según aprobación                  | Solo caso asignado y periodo autorizado                |
| Revisión: conclusión/manifiesto        | Lector; no sobrescribir              | Propietario con control independiente        | Copia mínima aprobada                      | Sin acceso ordinario                                   |
| Vínculo caso/UID y evidencia identidad | Solo lo necesario por caso           | Acceso acotado si precisa contraste          | Gestión de permisos sin consulta rutinaria | Solo necesidad justificada                             |
| Copia cifrada externa                  | Prepara transferencia aprobada       | Contrasta referencia si autorizado           | Control independiente y restauración       | Sin acceso ordinario                                   |
| Auth/Firestore remoto                  | Ninguno por este paquete             | Ninguno                                      | Ninguno                                    | Ninguno                                                |

Un permiso de lectura puede permitir descargar/capturar; no prometer prevención de
copias. Revocar acceso no retira las copias ya obtenidas: inventariarlas y tratarlas
según retención. Si el propietario puede cambiar todo, explicar qué referencia
independiente conserva el otro actor y cómo se detecta la discrepancia.

## Pruebas P01–P08 para ejecutar entre personas

| ID  | Acción ficticia                                                        | Resultado exigido                                                                                   |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| P01 | Cada actor entra en su sesión sin compartir secretos                   | Identidades/personas distintas; MFA observado o declarado, diferenciados                            |
| P02 | Revisor abre acta aprobada y trata de editar su archivo                | Lectura permitida; edición denegada según permiso configurado                                       |
| P03 | Operador abre conclusión del revisor e intenta sobrescribirla          | Lectura permitida, sobrescritura denegada                                                           |
| P04 | Usuario sin invitación intenta abrir recurso                           | Acceso denegado; ningún enlace público activo                                                       |
| P05 | Revisar permisos heredados y buscar acceso al vínculo restringido      | Ninguna herencia o exposición fuera de necesidad autorizada                                         |
| P06 | Revocar invitación del ensayo, volver a probar acceso en sesión nueva  | Acceso remoto denegado; registrar límite sobre copias previas                                       |
| P07 | Simular ausencia de operador con mensaje ficticio                      | Suplente recibe/asigna caso y agenda sin compartir login                                            |
| P08 | Operador trata de aprobar su actuación o cambiar conclusión custodiada | Procedimiento se detiene y discrepancia es detectable; no afirmar bloqueo técnico si solo es humano |

Acta por prueba: ID; versión; UTC; actores; cuenta/rol como referencia privada;
acción; esperado; observado o declarado; referencia mínima; incidencias; veredicto
`APTO / NO_APTO / INCONCLUSO`; confirmación de ambos; corrección y repetición si falla.
Capturas solo de material ficticio y sin correo/códigos/sesiones visibles.
Todas las pruebas están **PENDIENTES**, no ejecutadas por redactar esta ficha.
