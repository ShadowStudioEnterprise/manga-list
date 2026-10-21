# ML-12: buzón y responsables, paquete de preparación v1

Estado: **PREPARADO, NO ACTIVADO**. Complementa el
[procedimiento ML-12](ml-12-interrupted-deletion.md) y las decisiones D1–D7 de ML-11.
La petición de preparar este paquete no designa personas, crea cuentas, concede
permisos, envía invitaciones ni acepta plazos o dictámenes. Firebase Spark, sin
billing, suscripciones nuevas ni cambios remotos. Los nombres y direcciones reales
se cumplimentan en copia privada, nunca en Git/PR/CI.

Paquete completo:

1. Este documento: buzón, designaciones y orden de activación.
2. [Identidad y permisos entre personas](ml-12-identity-and-permissions-pack.md).
3. [Ensayos organizativos y custodia](ml-12-rehearsal-and-custody-pack.md).
4. [Encargo jurídico, retención y aceptación de plazos](ml-12-legal-retention-and-deadlines-pack.md).

## Ficha BZ-01: selección y puesta a punto del buzón

Propuesta: una dirección estable de soporte/derechos del responsable, usando un
medio existente sin coste adicional, con atención y recuperación comprobadas.
Proton Drive es candidato para custodia, no un buzón ni una prueba de que exista
Proton Mail apto para acceso delegado. No se presupone plan, capacidad multiusuario,
dominio propio o controles disponibles. Elegir proveedor y dirección tras comprobar
gratuitamente sus capacidades y condiciones. Si no permiten separación requerida,
no compartir contraseña ni contratar: devolver diseño como `REQUIERE_CAMBIOS`.

| Campo de ficha privada                         | Valor que debe aportar titular/custodio                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Dirección exacta y responsable del tratamiento | Pendientes; no publicar marcador de posición                                 |
| Proveedor, cuenta/plan y coste incremental     | Comprobar uso permitido y coste 0; sin compras                               |
| Operador, suplente y titular de recuperación   | Identidades individuales y facultades; sin secretos                          |
| Modo de acceso                                 | Acceso nominal/delegación si existe; describir límites reales                |
| MFA y recuperación                             | Método general y evidencia de ensayo, sin QR, claves o códigos               |
| Consulta diaria y cobertura                    | Calendario laboral, ausencias, alertas de ausencia de atención y suplencia   |
| Envío/recepción                                | Ensayo con dos participantes y contenido ficticio, incluyendo spam y rebotes |
| Almacenamiento y reenvíos                      | Cuota disponible, destinatarios autorizados, copias y restricciones          |
| Seguridad y trazabilidad                       | Eventos disponibles, accesos no cubiertos, revisión de permisos              |
| Retención                                      | Categorías de mensajes, adjuntos, papelera y copias según matriz D5          |
| Publicación e información                      | Texto revisado, lugar/versión y autorización de publicación posterior        |

Si solo el operador puede acceder a la cuenta, no afirmar que el suplente tiene
acceso. Puede proponerse un segundo canal atendido con traspaso mínimo del caso,
siempre con autorización e información aprobadas; probar recepción durante ausencia
antes de aceptarlo. No implementar reenvío automático de expedientes a cuentas
personales. No enviar datos de solicitantes a una lista de destinatarios por defecto.

## Secuencia de recepción preparada

1. Revisar bandeja y spam cada día laborable del calendario aprobado; comprobar
   cuota sin borrar mensajes necesarios para liberar espacio indiscriminadamente.
2. Crear referencia opaca en registro privado, conservando fecha de recepción
   original, canal y alcance. Separar mensaje original y vínculo caso/UID del acta.
3. Asignar operador y suplencia, fecha legal revisada por privacidad y próximos
   hitos. Duplicados se vinculan al caso original, sin reiniciar el reloj.
4. Enviar acuse mínimo únicamente desde el canal autorizado. Un acuse de recepción
   no confirma existencia de cuenta ni identidad. Evitar UID/correo en asunto.
5. Aplicar [verificación de identidad](ml-12-identity-and-permissions-pack.md).
   Adjuntos inesperados con documentos o secretos no se redistribuyen: restringir
   acceso y tratar minimización/incidencia según privacidad, sin copiarlos al acta.
6. Si hay rebote o no hay respuesta, dejar resultado y próxima acción; no usar un
   nuevo contacto no verificado para comunicar estado o existencia de cuenta.

Texto preparado de acuse, sin configurar ni enviar:

> Hemos recibido tu solicitud y le asignaremos una referencia privada. Si hace
> falta comprobar tu identidad, te explicaremos el mínimo necesario por un canal
> adecuado. No envíes contraseñas, tokens, cookies, códigos de acceso/MFA ni tu
> biblioteca. Esta recepción no confirma la existencia de una cuenta. Te
> comunicaremos la siguiente actualización y el plazo aplicable a tu solicitud.

Antes de publicarlo, incorporar responsable/contacto reales e información revisada
de privacidad; no anunciar el objetivo interno de 2/5 días como compromiso aprobado.

## Ficha R-01: designaciones nominales

Antecedente: el promotor propuso asumir gestión/operación en ML-11. Falta formalizar
identidad/facultades y aceptación privada; D3 exige persona distinta del operador.
Ser propietario de GitHub no prueba ser responsable del tratamiento.

| Función                                        | Responsabilidad y condición de independencia                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Responsable del tratamiento/titular autorizado | Decide fines/medios, aprueba política, designaciones y activación; aclarar facultades                                 |
| Operador                                       | Recibe y clasifica, prepara plan/evidencia; no aprueba su propia actuación                                            |
| Suplente                                       | Atiende ausencias y agenda; si opera un caso, necesita otro revisor                                                   |
| Revisor técnico D3                             | Persona distinta con juicio y cuenta propios; puede rechazar el plan y conserva conclusión independiente              |
| Privacidad/asesoría                            | Valida identidad excepcional, cómputos, conservación, textos y excepciones dentro de su competencia                   |
| Custodio                                       | Gestiona accesos, versiones, copias y vencimientos; referencia independiente fuera del control exclusivo del operador |

Se admite estudiar acumulación de funciones compatibles, sin darla por aceptada.
Si revisor es custodio, documentar conflicto, capacidad y aceptación concreta; si
suplente pasa a operador, nombrar revisor distinto. Dos cuentas de una persona no
son dos personas. El agente no es firmante, revisor humano ni asesor jurídico.

Por cada rol, completar privadamente:

| Campo                                             | Contenido                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Referencia / versión / alcance                    | Solo diseño y ensayo ficticio inicialmente                          |
| Persona, contacto profesional y cuenta individual | Pendientes; no recoger DNI para comprobar competencia               |
| Quién designa y con qué facultad                  | Pendiente                                                           |
| Competencia y formación                           | Referencia al ensayo, conocimiento de reglas/borrado y límites      |
| Conflictos y acumulación                          | Declaración concreta y medidas                                      |
| Disponibilidad / suplencia                        | Calendario y circuito ante ausencia                                 |
| Accesos mínimos solicitados                       | Recurso, permiso, finalidad, vencimiento; ningún IAM por esta ficha |
| Confidencialidad y recuperación                   | Aceptación sin credenciales compartidas                             |
| Aceptación del designado y titular                | Fecha, versión y referencia; vacías hasta recibirlas                |
| Cese                                              | Retirada autorizada, conciliación de copias y sustitución           |

Texto de aceptación preparado: «Acepto la función y alcance de la ficha identificada,
sus límites de acceso, confidencialidad y conflictos. No aprobaré actuaciones
propias. Declararé indisponibilidad o conflicto antes de intervenir. Esta aceptación
no autoriza acceso a producción ni una operación de borrado». Sin firmante actual.

## Decisiones y orden de preparación

| ID    | Decisión que falta                                                 | Estado inicial                             |
| ----- | ------------------------------------------------------------------ | ------------------------------------------ |
| BZ-01 | Dirección/proveedor existentes y atención efectiva sin coste nuevo | Pendiente                                  |
| R-01  | Operador, suplente, revisor D3, privacidad y custodio nominales    | Pendiente de formalización                 |
| ID-01 | Mecanismo proporcionado de identidad y alternativa sin Auth        | Diseño preparado; no implementado/validado |
| P-01  | Accesos entre personas y aceptación de límites                     | Ensayos pendientes                         |
| C-01  | Herramienta/destino de copia, separación y restauración            | Pendiente                                  |
| J-01  | Profesional/medio competente y dictamen D7 + matriz D5             | Sin asignar ni dictamen                    |
| T-01  | Objetivos 2/5 días, calendario, capacidad y reloj legal            | Pendiente de aceptación                    |
| A-01  | Revisión conjunta y autorización de activación                     | No solicitada ni concedida                 |

Primero completar fichas privadas y seleccionar medios; después ensayar con dos
personas y material ficticio; obtener conclusión jurídica y resolver cambios;
aceptar decisiones identificadas y solo entonces proponer activación. Si se carece
de persona o medio, registrar carencia, responsable y fecha de revisión, sin fingir
un resultado favorable. Nunca retener expedientes reales para probar el sistema.
