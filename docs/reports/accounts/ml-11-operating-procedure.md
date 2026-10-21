# ML-11: procedimiento propuesto y decisiones de aceptación

Borrador de 21/10/2026. No activado. Véase el
[informe jurídico-técnico](ml-11-validation-2026-10-21.md).
Solo documentación y ensayos locales con datos sintéticos. No es un runbook
ejecutable de borrado ni autoriza consultas de producción.

## Relojes y estados

Registrar `receivedAt` al recibir una solicitud de derechos; privacidad fija por
separado su fecha límite de respuesta conforme al cómputo legal aplicable. No
suspender ese seguimiento por falta de login, cuota o silencio. Si no se actúa,
preparar respuesta motivada y vías de reclamación, previa revisión de privacidad.

Registrar `startedAt` como evidencia de inicio; `updatedAt` del marcador solo
ayuda a ese hito. El día 0 (`completedAt` en el expediente, nunca añadido al
marcador en esta propuesta) exige evidencia fechada de Auth ausente y del inventario
asociado vacío. Usar el instante posterior de ambas verificaciones. Si se desconoce
la fecha histórica, verificar de nuevo con autorización en una tarea futura y usar
esa confirmación, sin reconstruirla desde la edad del marcador.

Propuesta de fecha de revisión: `completedAt + 30 × 24 horas` en UTC, inclusiva
en el instante exacto. Mostrar en Europe/Madrid con desplazamiento horario; no
sumar días locales durante cambios de hora. Ejemplo sintético: finalización
`2026-10-01T10:00:00Z`; revisión `2026-10-31T10:00:00Z` (11:00 Madrid).
La agenda es humana, en el canal privado aprobado, sin proceso programado en
Firebase. El operador revisa su agenda cada día laborable; el vencimiento permanece
visible si cae en festivo y se atiende el siguiente día laborable, sin alterar el
plazo de derechos. Esto requiere aceptación D1 y D2.

Estados del expediente: recibido → identidad/autoridad pendiente → borrado
incompleto o finalización acreditada → revisión fechada → preservar/escalar o
proponer retirada → decisión específica futura. No existe transición automática
a retirada ni por antigüedad ni por falta de respuesta.

## Identidad, autoridad y responsabilidades

El titular del proyecto designa personas por nombre, no solo cargos:

| Rol                                 | Responsabilidad propuesta                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Responsable del tratamiento/titular | Aceptar política tras asesoramiento; designar personal y canal; autorizar separadamente cada futura operación administrativa              |
| Soporte/operador y suplente         | Registrar recepción y fechas, verificar identidad proporcionalmente, reunir evidencias mínimas y mantener agenda; no autoaprobar retirada |
| Revisor técnico independiente       | Contrastar proyecto/UID, inventario, reglas, credenciales, concurrencia y rollback; doble control del alcance                             |
| Privacidad, con asesoría jurídica   | Determinar base y plazos, representación, excepciones y respuesta de derechos; no delegar una conclusión jurídica al ensayo               |
| Custodio del registro               | Gestionar permisos, trazabilidad de accesos, integridad y vencimientos del expediente                                                     |

Separar identidad de la persona, representación y permiso operativo. Mientras
exista Auth, preferir reautenticación del proveedor original y vinculación
autenticada al UID. No basta conocer un correo, UID, captura o títulos. Si actúa un
representante, privacidad verifica mandato y alcance con evidencia proporcionada;
controlar la cuenta no prueba por sí solo representación válida. Si Auth ya no
existe, revisar evidencia previa verificada y canal previamente vinculado; no exigir
una reautenticación imposible, recrear UID ni pedir DNI sistemáticamente.

El mecanismo de desafío de soporte todavía no está implementado. Propuesta D3:
desafío de un solo uso, 15 minutos y máximo 3 intentos, por canal previamente
verificado; registrar solo resultado y referencia, nunca el secreto. Un correo
recién aportado no sirve como único factor. Sin evidencia adecuada, no divulgar
existencia o contenido; escalar para solución proporcional sin denegar derechos
de forma automática. Nunca pedir contraseñas, tokens, MFA, cookies o biblioteca.
Antes de cualquier lectura futura, comprobar también permiso del operador,
proyecto exacto y alcance por caso; privilegio Admin no equivale a autorización.

## Revisión humana y resultado

1. Confirmar expediente y autorización de consulta específica, identidad o evidencia
   previa suficiente, representación si procede y segundo revisor independiente.
2. Comprobar día 0, instante de revisión y reglas/esquema aplicables. No usar edad
   de `updatedAt` como finalización. Falta de evidencia = preservar provisionalmente
   con carencia, responsable y próxima fecha, no retención ilimitada.
3. En una tarea futura autorizada, revisar Auth e inventario completo con lecturas
   servidor paginadas, presupuesto acotado y recuentos por ruta de esquema. Incluir
   descendientes desconocidos, ubicaciones externas, copias y registros del proveedor
   en el inventario; no afirmar cobertura de lo no comprobado. Documento padre o
   `mangas` vacíos no prueban ausencia global. Una lectura fallida no equivale a cero.
4. Confirmar última eliminación/revocación, margen propuesto de 24 horas y revisión
   técnica del modelo de tokens. No aceptar el margen como prueba autónoma de
   seguridad; considerar UID reutilizado, importación, concurrencia y rollback.
5. Privacidad revisa necesidad actual, reclamaciones, deber de reserva y vencimientos.
   Una excepción necesita finalidad, fundamento, datos mínimos, aprobador y siguiente
   revisión. No conservar biblioteca por comodidad ni por una excepción genérica.
6. Registrar decisión conjunta. `Preservar/escalar` si falta cualquier condición;
   `proponer retirada` solo con todas favorables. Privacidad y titular reciben la
   propuesta por canal restringido. Retirada y comprobación posterior necesitan otra
   autorización expresa para proyecto/UID concreto y otra tarea. ML-11 no las ejecuta.

La revisión de un caso ya verificado no requiere volver a contactar a la persona
por rutina; tampoco puede basarse en una identidad inferida. Una petición nueva con
identidad dudosa mantiene su seguimiento de derechos separado del análisis interno.

## Abandonos y excepciones

Propuesta D2: si el borrado está incompleto, seguimiento humano a los 7 días desde
inicio/recepción del caso, escalado a privacidad a los 30 y decisión formal a los 90. Si la situación ya supera un hito al descubrirse, escalar al abrir el caso;
no reiniciar esos plazos por cada reintento. Ningún hito retrasa la respuesta legal.
No restaurar Auth ni quitar el marcador para permitir soporte. Cuota agotada:
detener operaciones y replanificar según cuota real, sin vincular billing.

Toda preservación excepcional se reevalúa como máximo en 30 días según propuesta
D4; si existe vencimiento jurídico o riesgo más próximo, usar la fecha anterior.
La falta de operador activa al suplente y después al titular. La falta de evidencia
no se convierte en excepción perpetua: privacidad documenta la proporcionalidad y
resuelve el bloqueo. La prórroga de respuesta del RGPD depende de sus condiciones
y comunicación; no nace de estos plazos internos ni del plan Spark.

## Expediente mínimo y privacidad

Mantener fuera de Git/PR/CI un registro privado con acceso por función y revisión
de permisos. No se ha seleccionado ni creado ese sistema. Separar ID opaco de caso
y vínculo restringido proyecto/UID. Cifrado, MFA, acceso mínimo, registro de lecturas
y cambios, versiones de actas y aprobación de dos personas son requisitos de
selección; confirmar disponibilidad sin introducir servicios de pago en Firebase.

Acta mínima: ID de caso; recepción; identidad y autoridad verificadas (método y
referencia restringida); operador/revisor; inicio, finalización y revisión UTC;
versión de inventario/reglas; resultado y recuentos sin contenido; evidencia de
estado Auth; incertidumbres; motivo/base de conservación; decisión y aprobaciones;
próxima revisión; cierre y fecha de revisión de retención del expediente. Registrar
quién accedió/cambió qué y cuándo; corregir mediante entrada nueva con referencia
a la anterior. No prometer inmutabilidad si el canal no la proporciona.

No registrar correo, IP, títulos, notas, documentos de identidad, secretos ni tokens
en actas compartidas. Las pruebas de identidad indispensables permanecen separadas
y se eliminan cuando deje de existir necesidad validada. Un ID de caso o un hash
del UID sigue siendo vinculable si existe la correspondencia: no llamarlo anónimo.

Propuesta D5: revisar la retirada del vínculo caso/UID a los 30 días del cierre;
no eliminarlo automáticamente ni conservar el resto indefinidamente. Asesoría debe
fijar una matriz por categoría (identidad, vínculo, acta, accesos, posibles reservas)
con finalidad, base, plazo y destrucción final; hasta entonces no activar el sistema
con datos reales. La retención de evidencias no hereda la del marcador.

## Decisiones que requieren aceptación expresa

| ID  | Decisión concreta propuesta                                                                                                                                                           | Estado    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| D1  | Revisión humana a las 720 horas desde finalización acreditada; ningún borrado automático; día 0 no se infiere de `updatedAt`                                                          | Pendiente |
| D2  | Agenda por operador/suplente, repaso diario laborable y seguimiento de incompletos 7/30/90 días; reloj de derechos separado                                                           | Pendiente |
| D3  | Designar por nombre roles independientes, canal privado, permisos y mecanismo de identidad/desafío 15 min/3 intentos y representación                                                 | Pendiente |
| D4  | Excepciones solo motivadas por privacidad, revisión máxima cada 30 días; validar jurídicamente causas y prescripciones                                                                | Pendiente |
| D5  | Revisar vínculo caso/UID a los 30 días del cierre y aprobar matriz jurídica de retención del expediente y controles de integridad/acceso                                              | Pendiente |
| D6  | Mantener 24 h solo como cautela pendiente; exigir evaluación técnica de tokens, reutilización UID y rollback antes de cualquier propuesta de retirada                                 | Pendiente |
| D7  | Encargar revisión jurídica de base, proporcionalidad, art. 32, información al usuario, responsables/encargados y límites de la supresión; autorizar producción por caso en otra tarea | Pendiente |

Aceptar D1–D7 no certifica cumplimiento ni autoriza fusionar, desplegar, consultar
cuentas o retirar un marcador. Esas actuaciones permanecen fuera de ML-11.
