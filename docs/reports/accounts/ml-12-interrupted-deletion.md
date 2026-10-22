# ML-12: asistencia a eliminaciones interrumpidas

21/10/2026, Europe/Madrid. Procedimiento preparado y verificable mediante ensayos;
**operación real sin activar**. Complementa ML-11; no sustituye sus decisiones
D1–D7 ni convierte sus ensayos Proton en un canal operativo. No autoriza accesos,
mensajes a personas, bajas ni cambios Firebase. Spark exclusivamente, sin billing,
Functions, TTL, extensiones, cron ni servicios de pago.

## Base y auditoría

Base actualizada desde GitHub: `c563bba781760a8433680d1e120d486b310b8e75`,
`origin/main`. ML-11 consta integrado por PR #9 y su estado posterior por PR #10.
El chat de origen devuelve referencias sin contenido útil de sus respuestas;
los antecedentes verificables proceden del repositorio, no de supuestas decisiones
recuperadas del chat. No se han consultado Auth, Firestore, IAM ni billing remotos.

| Componente auditado                       | Garantía observada                                                                                                                                                     | Límite operativo                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/services/account-service.js`         | Reautentica, comprueba sesión, crea marcador transaccional antes de borrar, consulta servidor y elimina lotes de 400, máximo 2000 por intento                          | Repetir para más de 2000; sin trabajador de fondo. Progreso cuenta respuestas confirmadas, no necesariamente todo lo aplicado |
| `users/{uid}`                             | Solo timestamps y `status: deleting`; se conserva tras borrar Auth                                                                                                     | No tiene fecha de finalización ni expediente; no añadir identidad o auditoría al marcador                                     |
| `firestore.rules`                         | Propietario por UID, forma y timestamps en create/update, marcador no modificable ni eliminable por cliente; `getAfter` impide escritura en el lote que inicia borrado | No hay rol de soporte; Admin omite reglas. Contextos todavía aceptados conservan lectura y borrado de mangas pendientes       |
| Inventario                                | El cliente limpia `users/{uid}/mangas`                                                                                                                                 | No descubre subcolecciones desconocidas, datos externos, copias o logs; borrar padre no borra descendientes                   |
| `auth-store`, Ajustes y presupuesto Spark | Confirmación y errores recuperables; pausa local ante cuota                                                                                                            | No son un sistema de solicitudes de derechos, prueba de identidad de soporte ni control global de cuotas                      |
| Documentación ML-11                       | D1–D7 aceptadas para diseño; Proton elegido, P2–P4 solo para ensayo                                                                                                    | Revisor independiente, suplencia/custodia, canal, permisos, matriz D5 y dictamen D7 siguen pendientes; no activado            |

Resultado de reglas limitado a este flujo: véase [auditoría JSON versionada](https://github.com/ShadowStudioEnterprise/manga-list/blob/65e6a463f941d6c015f2caa1656cb86470dff467/docs/reports/accounts/ml-12-rules-audit.json).
No se ha encontrado bypass de la barrera de escritura en los casos ensayados;
no se acredita revocación inmediata ni bloqueo jurídico. La
[gestión de sesiones Firebase](https://firebase.google.com/docs/auth/admin/manage-sessions)
distingue tokens de identidad y renovación. Retirar el marcador puede reabrir
escrituras a un contexto aún aceptado; ni 24 horas ni antigüedad autorizan retirarlo.
La [documentación de borrado](https://firebase.google.com/docs/firestore/manage-data/delete-data)
confirma la necesidad de tratar descendientes separadamente.

## Canal, identidad y acceso del operador

Antes de activar: publicar en la información de privacidad una dirección de correo
de soporte/derechos controlada por el responsable y atendida también por suplente.
**Dirección pendiente de designación**, sin inventar buzón ni anunciarlo operativo.
Usar correo para recepción y respuesta mínima; material privado y vínculo caso/UID
en registro restringido. Proton Drive queda como candidato a custodia según ML-11,
no como bandeja de soporte ni garantía de auditoría completa. No usar issues, PR,
chat público ni enlaces públicos. Si llega una solicitud por otro canal, registrar
su recepción original y derivarla de forma segura, sin obligar a reiniciar el reloj.

1. Asignar ID opaco y registrar recepción, alcance solicitado y fecha de respuesta
   legal revisada por privacidad, aunque aún no pueda verificarse la identidad.
2. Si Auth existe: preferir recuperación del proveedor original y reautenticación
   dentro de la aplicación. Soporte nunca recibe contraseña, token, cookie ni MFA.
   Hoy no existe una atestación de soporte en la app: no presentar una captura de
   Ajustes como tal. El operador autorizado vincula UID y canal verificado con
   evidencia independiente del correo/UID aportado por quien solicita.
3. Desafío propuesto ML-11: un solo uso, 15 minutos, máximo 3 intentos al canal
   previamente verificado. Solo un desafío específico de soporte puede responderse
   por el canal privado aprobado; nunca reutilizar códigos de acceso/proveedor.
   No está implementado ni aprobado para uso real: documentar emisión, caducidad,
   antirrepetición y contraste antes de activarlo. Conservar resultado y referencia,
   nunca el valor secreto. El fallo permite revisión humana, no denegación automática.
4. Sin acceso al proveedor: derivar a su recuperación; sin Auth: valorar evidencia
   previa vinculada al caso. No recrear UID. Un correo recién indicado, títulos,
   captura, UID o contraseña antigua no prueban titularidad. Dudas razonables:
   privacidad decide qué evidencia adicional mínima basta; no pedir DNI por rutina.
   Representantes requieren comprobar mandato y alcance. Sin evidencia suficiente,
   no revelar existencia ni datos, mantener respuesta de derechos y escalar.
5. Obtener confirmación expresa del alcance de borrado. Es distinta de verificar
   identidad y de autorizar al operador. Dejar referencia privada de las tres.

Acceso futuro: titular autoriza por caso proyecto, UID, rutas, operaciones, ventana,
presupuesto y dos personas distintas (operador/revisor D3). Primero lectura;
actuación destructiva mediante aprobación separada sobre inventario reciente.
Cuenta individual, MFA, privilegio mínimo y revisión/revocación al terminar.
No compartir claves, crear roles en documentos cliente ni poner Admin en la app.
IAM puede no limitarse a un único UID: documentar exceso de alcance y doble control;
no afirmar aislamiento técnico inexistente. Falta de revisor activa suplencia o
escalado al titular; una sola persona con dos cuentas no satisface D3.

## Evaluación y decisión verificables

La lectura autorizada debe dejar fecha UTC, versión de esquema/reglas, proyecto/UID
contrastados por dos personas, Auth presente/ausente/error, marcador presente/ausente/
inesperado, recuentos y cobertura. Error, timeout, permiso denegado y lectura de caché
son **desconocido**, nunca cero. Consultas paginadas con presupuesto de lecturas y
cancelación; evitar exportar contenido. Enumerar rutas conocidas, descendientes
no previstos, almacenamiento externo, copias, logs y dispositivos del usuario.
Si no puede enumerarse una categoría, declarar cobertura parcial y escalar.

| Estado servidor                                                                       | Decisión y siguiente acción                                                                                             |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Auth presente, sin marcador                                                           | Ofrecer flujo normal, reautenticación y confirmación. Si dice haber borrado, investigar discrepancia sin inferir fraude |
| Auth presente, `deleting`, mangas pendientes                                          | Preferir reanudación por titular; misma barrera, varios intentos acotados si hace falta                                 |
| Auth presente, `deleting`, mangas vacíos                                              | Reautenticar y finalizar Auth en app; no retirar marcador. Vacío no acredita otros almacenes                            |
| Auth ausente, `deleting`, datos pendientes                                            | Excepción administrativa: inventario, identidad previa, alcance y aprobación específica; no recrear Auth                |
| Auth ausente, `deleting`, inventario vacío                                            | Finalización del ámbito comprobado; registrar día 0 y revisión ML-11 a 720 h; marcador pendiente por separado           |
| Auth ausente sin marcador, datos residuales; marcador inválido; identidad/UID dudosos | Discrepancia, detener cambios y escalar técnica/privacidad; no crear o retirar barreras por intuición                   |
| Cualquier lectura fallida, inventario incompleto o concurrencia Admin                 | Estado desconocido; nueva inspección autorizada, sin cerrar por éxito                                                   |

## Actuación manual futura, por caso

Este orden define puntos de control para una tarea posterior autorizada. No se
entrega ejecutor administrativo ni se ejecuta aquí sobre cuentas.

1. Revisor aprueba plan exacto con inventario reciente, ventana, límites y criterio
   de interrupción. Verificar proyecto Spark sin billing mediante evidencia autorizada
   vigente antes de operar; este informe no certifica configuración remota.
2. Si la vía ordinaria es viable, pedir al titular reanudar; nunca iniciar sesión
   como él. Si necesita excepción, obtener autorización expresa del titular del
   proyecto y alcance destructivo confirmado por solicitante verificado.
3. Mantener marcador. Si falta o es inválido, parar y someter la contención a un
   plan específico; no iniciar borrado sin barrera evaluada. Si Auth existe y la
   excepción aprobada lo requiere, impedir nuevas sesiones/revocar renovación con
   herramientas autorizadas; verificar resultado sin asumir extinción de ID tokens.
   Estas acciones también son cambios separados con aprobación registrada.
4. Reconsultar estado; delimitar rutas exactas y eliminar exclusivamente documentos
   inventariados del caso en lotes de hasta 400, máximo 2000 por intento. Revalidar
   proyecto/UID y autorización antes de cada lote; no usar comodines, eliminación
   recursiva global ni limpieza masiva. Mantener registro de intento y resultado.
   Hallazgo de ruta nueva exige ampliar inventario y renovar aprobación.
5. Tras timeout/acuse perdido, detener y volver a leer servidor: un lote puede
   haberse aplicado aunque `deletedCount` siga a cero. Registrar confirmado y
   desconocido por separado. Reanudar desde inventario restante, nunca desde un
   contador local ni borrando el marcador. Cuota: parar, replanificar con cuota
   real; 15 minutos locales no garantizan reinicio diario. Nunca activar billing.
6. Solo tras verificar vacíos los datos del alcance autorizado, finalizar Auth si
   sigue presente y está aprobado. Si falla, caso incompleto; repetir inspección
   antes del siguiente intento. Comprobar Auth ausente y rutas vacías en servidor
   al final, y que el marcador continúa. No retirar la barrera para
   obtener una pantalla aparentemente vacía.
7. Revisor contrasta evidencia y discrepancias. No existe rollback del borrado de
   obras; no hacer una copia de biblioteca por defecto. Una exportación voluntaria
   no garantiza restauración y queda bajo control del usuario. Recuperación futura
   requiere decisión propia; nunca restaurar el mismo UID para diagnosticar.

## Registro mínimo, comunicación y cierre

Usar [ficha vacía y ejercicios](ml-12-case-and-tests.md). Mantener el vínculo
proyecto/UID y datos de contacto separados de la bitácora general. Registrar eventos
por adición: quién, cuándo UTC, acción, referencia de aprobación, resultado,
recuentos/cobertura y próxima acción; correcciones enlazan la entrada anterior.
Guardar solo código de error saneado, no respuestas completas ni logs del SDK.
No incluir correo, IP, biblioteca, DNI, contraseñas ni tokens en Git, CI o actas
compartidas. ID opaco/hash vinculable sigue siendo dato personal, no anonimización.

Custodio restringe acceso, mantiene versiones y copia cifrada independiente,
comprueba restauración y revisa vencimientos. El registro manual de ML-11 no prueba
todas las lecturas ni inmutabilidad: documentar huecos y resolverlos antes de uso
real. La matriz D5 debe asignar finalidad, fundamento, plazo y destrucción a prueba
de identidad, vínculo, acta, comunicaciones, accesos y reservas; no conservar todo
indefinidamente ni trasladar un plazo del marcador al expediente.

Propuestas nuevas ML-12: acuse en 2 días laborables y clasificación/escalado inicial
en 5; pendientes de aceptación y capacidad. ML-11 mantiene repaso diario laborable,
seguimiento 7 días, escalado 30 y decisión 90 desde inicio/recepción sin reinicio por
reintentos; si el hito ya venció, actuar al descubrirlo. Sospecha de acceso indebido,
UID equivocado, pérdida de evidencia o plazo legal en riesgo: escalado inmediato.
Privacidad valora brecha y las obligaciones aplicables sin esperar al hito interno.

Respuesta por canal verificado, lenguaje sencillo y sin revelar información a
terceros: acuse con referencia; diagnóstico con fase y alcance; actualización tras
fallo con pendiente y siguiente fecha; cierre con qué se comprobó, qué se conserva,
fundamento/plazo revisado y vías de reclamación. No prometer recuperar datos ni
decir «todo eliminado» si queda marcador o cobertura desconocida. No enviar nada
desde esta tarea. El silencio del solicitante no autoriza borrado adicional ni
supone desistimiento del derecho: privacidad decide seguimiento y respuesta.

Cierre técnico: Auth ausente y todo el inventario autorizado verificado vacío,
revisor conforme, sin resultados ambiguos, marcador conservado y revisión ML-11
agendada desde la última de las verificaciones de Auth/datos (día 0). Separar ese
cierre de la decisión jurídica y de la retención pendiente del marcador/expediente.
Cierre administrativo sin resolución: solo decisión motivada de privacidad y
respuesta de derechos, con pendientes/escalado visibles; jamás etiquetar «borrado
completo». Reabrir por residuo, contradicción o nueva evidencia sin perder recepción
original. Retirada del marcador permanece fuera del alcance de ML-12.

## Revisión jurídica requerida

Recomendaciones de diseño, sujetas a asesoría española antes de activación:

- [RGPD](https://eur-lex.europa.eu/eli/reg/2016/679/): valorar minimización y limitación
  temporal (art. 5), base por finalidad (6), facilitar derechos e identidad proporcional
  (12), supresión/excepciones (17), destinatarios (19), seguridad (32) y posibles
  brechas (33–34). Responder sin dilación y normalmente en un mes desde recepción;
  una prórroga de hasta dos meses adicionales exige sus condiciones y comunicación
  dentro del primer mes. Soporte no suspende unilateralmente el reloj por cuota,
  falta de login o silencio. Privacidad valida cómputo y justificación por caso.
- La [AEPD sobre identificación](https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/3-identificacion-con-dni/FAQ-0108-para-el-ejercicio-de-estos-derechos-es-necesario-facilitar-la-copia-del-dni)
  descarta exigir copia del DNI como rutina; justificar solo evidencia adicional
  necesaria ante dudas razonables, con canal y retirada de evidencia adecuados.
- Revisar [art. 32 LOPDGDD](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673#a32):
  bloqueo, reserva y acceso legalmente limitado, responsabilidades y destrucción al
  prescribir. `status: deleting` es barrera operativa y no acredita ese bloqueo.
  No conservar biblioteca ni retirar marcador basándose solo en una interpretación
  automática del artículo; fijar categorías y prescripciones concretas.
- Determinar responsable, encargados, transparencia, contratos/transferencias de
  Firebase y canal/custodia, excepciones y respuesta motivada/reclamación AEPD.
  Confirmar necesidad de DPD/EIPD y cómo atender copias, logs y destinatarios fuera
  del flujo cliente, sin crear almacenes pagados ni prometer borrado fuera de control.

## Decisiones pendientes y aceptación de entrega

El [paquete de preparación v1](ml-12-mailbox-and-roles-pack.md) reúne fichas concretas
de buzón/designaciones, identidad/permisos, ensayos/custodia y encargo jurídico con
matriz de retención y aceptación de plazos. Está preparado, sin designaciones,
invitaciones, ejecución entre personas, dictamen o aceptación nuevos.

1. Designar buzón público de derechos y su atención; aprobar mecanismo identidad
   de soporte o alternativa proporcionada. La app actual no lo implementa.
2. Completar D3: revisor distinto, suplente y custodio; verificar permisos entre
   personas, auditoría y recuperación externa de custodia sin coste añadido.
3. Aprobar nuevos objetivos 2/5 días laborables y capacidad de atención; registrar
   agenda separada del plazo jurídico. No modificar por extensión D1–D7.
4. Obtener dictamen D7/matriz D5 y evaluar tokens, inventario y accesos administrativos
   de mínimo privilegio; resolver límites del registro manual Proton.
5. Solo después, aprobar activación del canal/procedimiento. Cada consulta y cada
   operación real siguen necesitando autorización concreta y tarea separada.

Aceptación de ML-12 como entrega: documentación enlazada construye; pruebas del
flujo real y emulador reproducen interrupción/acuse perdido y mantienen barrera;
ejercicios humanos tienen criterios de resultado explícitos; no cambios de reglas,
app, infraestructura o dependencias. Resultados y límites en la
[evidencia de pruebas](ml-12-test-evidence.md). No equivale a activación ni dictamen.
