# ML-11: ficha de preparación para activación

La [definición de implementación Nextcloud](nextcloud-implementation-proposal.md)
concreta arquitectura y fases como propuesta. Sus decisiones N1–N5 siguen pendientes;
no sustituyen las condiciones D1–D7 ni activan el procedimiento.

Estado a 21/10/2026: **no activado**. D1–D7 aceptadas en el
[acta](ml-11-acceptance-2026-10-21.md); condiciones siguientes sin completar.
Este documento prepara la revisión y no concede acceso a producción.

## Designación y canal

El promotor indicó que asumirá la gestión y operación. Confirmó después mantener
D3 y dejar pendiente un revisor independiente. No se adopta una alternativa
unipersonal ni se permite que el operador apruebe su propia propuesta de retirada.
No se publican nombres, contactos, firmas ni permisos reales en este repositorio.

| Función                        | Preparación actual                                    | Evidencia privada necesaria                                                                                        |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Coordinación y operación       | Asumidas por el promotor como intención organizativa  | Designación nominal, aceptación de funciones y alcance de consultas                                                |
| Suplencia                      | Sin persona distinta designada                        | Persona disponible o contingencia aprobada que escale al titular sin fingir doble control                          |
| Revisión técnica independiente | Pendiente, D3 mantenida expresamente                  | Persona distinta del operador, competencia y ausencia de autoaprobación                                            |
| Privacidad                     | El promotor propone asumirla; conclusiones pendientes | Identificar quién decide sobre tratamiento y quién aporta revisión jurídica; no presumir cualificación ni dictamen |
| Custodia del expediente        | Sin sistema ni acceso establecidos                    | Encargado nominal, control de accesos, integridad y retención                                                      |

Ser titular de un repositorio no prueba por sí solo ser responsable del tratamiento.
La identidad del responsable y las facultades operativas deben documentarse fuera
del repositorio. Una persona puede asumir coordinación y operación, pero no cuenta
como dos revisores. Si falta el revisor, preservar/escalar; no retirar el marcador.

Canal privado: **pendiente de selección**. Elegir un sistema ya disponible sin
activar servicios de pago en Firebase. Antes de usarlo demostrar: acceso individual
con MFA, permisos por función, cifrado, trazabilidad de lecturas y cambios,
recuperación controlada, cierre de accesos y eliminación según matriz aprobada.
Si el sistema no registra lecturas o permite alterar actas sin rastro, documentar
la carencia y resolverla antes de activación; no afirmar integridad que no ofrece.

Matriz de acceso propuesta, no permisos IAM concedidos:

| Recurso                                     | Operador                                | Revisor independiente                | Privacidad                          | Custodio                                                 |
| ------------------------------------------- | --------------------------------------- | ------------------------------------ | ----------------------------------- | -------------------------------------------------------- |
| Acta mínima sin contenido de biblioteca     | Preparar y añadir eventos               | Consultar y emitir revisión separada | Resolver finalidad/excepción        | Administrar acceso y versiones                           |
| Vínculo caso/UID y referencias de identidad | Solo caso asignado y alcance autorizado | Solo lo necesario para contraste     | Solo cuando necesario para resolver | Administrar acceso, sin consulta rutinaria del contenido |
| Datos de producción                         | Ningún permiso derivado de ML-11        | Ningún permiso derivado de ML-11     | Ningún permiso derivado de ML-11    | Ningún permiso derivado de ML-11                         |

La asignación de varios roles a una persona acumula accesos: revisar esa acumulación
en la selección del sistema. Los nombres reales y cualquier vínculo de caso se
mantienen en registro privado, nunca en Git, PR o artefactos de CI.

## Matriz de retención para revisión jurídica

No es una tabla de plazos legales aprobados. Completar cada fila con base,
necesidad, inicio, plazo o criterio determinable, reserva si procede, responsable,
fecha de revisión y destrucción final. Un plazo pendiente impide activar ese
tratamiento; no autoriza conservarlo indefinidamente.

| Categoría                                            | Datos mínimos y propósito propuesto                                            | Inicio/revisión aceptados                                            | Plazo final y base                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Marcador operativo                                   | UID en ruta y `createdAt`, `updatedAt`, `status`; impedir recreación de mangas | Revisión humana a las 720 h de finalización acreditada               | Pendientes de evaluación jurídica y técnica; sin retirada automática                                                     |
| Vínculo caso/UID                                     | Correspondencia restringida para tramitar y contrastar el caso                 | Revisar retirada a los 30 días del cierre                            | Pendientes de matriz jurídica; no heredar el plazo del marcador                                                          |
| Evidencia de identidad/representación                | Resultado, método y referencia; pruebas adicionales solo si necesarias         | Reevaluar necesidad al resolver la verificación y al cerrar          | Determinar minimización, acceso y retirada por categoría; no DNI por defecto                                             |
| Acta y decisiones                                    | ID opaco, fechas, fase, motivos, aprobaciones y referencias sin biblioteca     | Revisión en cierre y en cada excepción                               | Finalidad probatoria, base y plazo por determinar; ID opaco no asegura anonimato                                         |
| Registro de accesos/cambios                          | Actor, instante, recurso y acción, sin secretos o contenido                    | Según control de seguridad y cierre                                  | Plazo diferenciado y justificado, pendiente                                                                              |
| Reserva por responsabilidades                        | Solo datos que asesoría determine indispensables                               | Cada excepción con revisión máxima de 30 días o vencimiento anterior | Determinar aplicación del art. 32 LOPDGDD y prescripciones concretas; no usar la barrera operativa como reserva jurídica |
| Copias del sistema privado y registros del proveedor | Inventario por ubicación, titular y capacidad real de supresión                | Al seleccionar canal y al revisar inventario                         | Verificar contratos, ciclos y limitaciones; no prometer eliminación instantánea de copias no controladas                 |

La biblioteca no se copia al expediente ni se conserva como prueba de identidad.
El reloj de respuesta a derechos comienza con recepción y se gestiona por separado.
La falta de respuesta de la persona no acredita finalización ni crea una excepción
de conservación. La agenda interna no sustituye el análisis del plazo de derechos.

## Ficha de conclusión técnica D6

El revisor completará un dictamen acotado indicando versión revisada, pruebas,
supuestos, riesgos residuales y resultado: insuficiente / favorable para proponer
una actuación específica. El dictamen no ejecuta retirada.

| Pregunta                                        | Evidencia disponible                                                                                              | Conclusión pendiente                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ¿Qué bloquean las reglas actuales?              | Ensayos de reglas: escritura denegada con marcador; lectura y borrado permitidos al contexto propietario aceptado | Aceptar y comunicar ese alcance, sin llamarlo revocación inmediata                                  |
| ¿Qué sucede al retirar el marcador?             | Contraejemplo sintético: el mismo contexto aceptado vuelve a crear mangas                                         | Determinar condiciones que excluyan credenciales aceptadas en un caso futuro                        |
| ¿Basta la antigüedad o esperar 24 h?            | La edad no cambia permisos; el modelo sintético exige evaluación separada                                         | No hay garantía demostrada solo por esperar; justificar supuestos y evidencia                       |
| ¿Puede emitirse otra sesión o reutilizarse UID? | Código no impide toda futura importación administrativa ni prueba ausencia Auth                                   | Inventario de vías de emisión/restauración y control de concurrencia, sin consultas reales en ML-11 |
| ¿Se borraron todas las ubicaciones?             | Servicio recorre `mangas`; el ensayo prueba que otro descendiente sobrevive                                       | Inventario completo y evidencia de ausencia futura por caso                                         |
| ¿Qué cubre el dispositivo?                      | Auth usa persistencia local o memoria; borradores usan `sessionStorage`; el flujo limpia el navegador actual      | No afirmar borrado de exportaciones, otros dispositivos ni registros del proveedor                  |
| ¿Qué ocurre en rollback?                        | Las garantías dependen de conservar reglas compatibles con la barrera                                             | Revisar versión candidata y reversión antes de otra intervención                                    |

La [documentación de sesiones de Firebase](https://firebase.google.com/docs/auth/admin/manage-sessions)
describe ID tokens de una hora, refresh tokens y comprobación de revocación.
Esto no demuestra por sí solo cuándo deja de aceptarse toda credencial en un caso
real. Los contextos de reglas del emulador no certifican esa caducidad. No se añade
backend, metadatos, regla nueva, TTL ni servicio de pago para resolverlo en ML-11.

## Ficha de encargo jurídico D7

Preparada para revisión, **sin envío a terceros**. Entregar únicamente documentos
de diseño y ensayos sintéticos; no casos, UID o bibliotecas reales.

Preguntas que debe resolver la revisión:

1. Identidad del responsable, reparto de funciones y encargados; base y finalidad
   separadas de marcador, identidad, expediente, accesos y posibles reservas.
2. Necesidad y proporcionalidad de 720 h frente al riesgo de credenciales, incluyendo
   alternativas menos intrusivas; no asumir que la duración técnica legitima retención.
3. Aplicación del art. 32 LOPDGDD, datos sujetos a reserva, medios que impidan usos
   indebidos y plazos de prescripción pertinentes; validar cada fila de la matriz.
4. Cómputo de respuesta a derechos, verificación proporcional, representación,
   comunicación de incidencias, excepciones y respuesta motivada cuando no se actúe.
5. Texto informativo adecuado, destinatarios, contratos/canal, transferencias y
   necesidad de DPD o evaluación de impacto según circunstancias del producto.

Entregable solicitado: conclusiones razonadas con fuentes y fecha, matriz resuelta,
medidas exigidas y cuestiones abiertas. No marcar favorable sin recibirlo. Marco
de consulta: [LOPDGDD, art. 32](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673#a3-4),
[CEPD: gestión de derechos](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_es)
y fuentes del [informe ML-11](ml-11-validation-2026-10-21.md).
Consultadas el 21/10/2026; esta ficha no sustituye ese dictamen.

## Ensayo documental de mesa

Solo caso ficticio `SYN-ML11-001`, sin UID, contacto o credenciales. Fecha de prueba
`2026-10-31T10:00:00Z`; la evidencia de finalización es
`2026-10-01T10:00:00Z`. Se cumple el umbral temporal exacto.

Acta sintética: recibido/inicio ficticios registrados; Auth e inventario se tratan
como evidencias simuladas; revisión técnica y jurídica sin conclusión favorable;
operador designado en la simulación y segundo revisor sin designar. Resultado:
**preservar/escalar**, motivo: D3/D6/D7 incompletas. Responsable de seguimiento:
operador de la simulación. Próxima revisión ficticia: `2026-11-07T10:00:00Z`.
No se crea evento, recordatorio, expediente real ni operación en Firebase.

Variantes: sin día 0 → no calcular retirada; inventario incierto o lectura fallida
→ no declarar ausencia; representación no acreditada → no divulgar datos; excepción
→ justificar base y siguiente fecha. Incluso con todas las condiciones simuladas
favorables, el resultado máximo es proponer una actuación futura autorizada aparte.
Este recorrido documental no constituye otra prueba automatizada ni prueba operativa.

## Condiciones de paso

| Condición                                                                        | Estado actual                                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| D1–D7 aceptadas y límites preservados                                            | Cumplida como decisión documental                                         |
| Operador, suplencia, revisor y privacidad formalizados                           | Parcial: promotor asume gestión/operación; revisor y suplencia pendientes |
| Canal y controles comprobados                                                    | Pendiente                                                                 |
| Matriz de retención y dictamen jurídico documentados                             | Pendiente                                                                 |
| Evaluación técnica D6 y riesgos de lectura/UID resueltos para actuación concreta | Pendiente                                                                 |
| Autorización específica de consulta/ejecución sobre un caso real                 | No concedida ni solicitada en esta ficha                                  |

Con condiciones pendientes, el procedimiento permanece sin activar. Un CI verde
verifica código y documentos, no esas condiciones. No fusionar ni desplegar como
consecuencia de rellenar esta ficha. Spark exclusivamente y ningún borrado automático.
