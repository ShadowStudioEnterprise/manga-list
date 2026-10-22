# ML-12: ensayos organizativos y custodia, ficha v1

Parte del [paquete de preparación](ml-12-mailbox-and-roles-pack.md).
Solo simulaciones y archivos ficticios; **ejecución entre personas pendiente**.
Los ensayos Proton anteriores siguen siendo parciales, según
[su evidencia](proton-drive-service-rehearsal-2026-10-21.md); este documento no los
amplía ni afirma haber comprobado independencia o restauración externa.

## Preparación de sesión

Operador, revisor y custodio completan designaciones y alcance de ensayo privado.
Si falta una persona independiente, se puede revisar el guion localmente, pero el
resultado organizativo es `INCONCLUSO`. No usar otra cuenta propia para aprobarlo.
Puede evaluarse revisor/custodio coincidentes si el titular acepta expresamente
la acumulación y se conserva independencia respecto al operador.

Usar una carpeta nueva con prefijo `SYN-ML12-ENSAYO`, actas sin UID/correo y una
copia ficticia de la [ficha de caso](ml-12-case-and-tests.md). Asignar roles como
`PERSONA_A` y `PERSONA_B`; la correspondencia nominal, si se necesita, fuera de
Git. Usar exclusivamente hechos y fechas inventados. No importar casos reales.
No enviar invitaciones ni mensajes sin autorización posterior concreta.

Orden de sesión propuesta (duración orientativa, sin reserva ni cita creada):

| Fase      | Preparación / resultado                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| 1, 15 min | Alcance, roles, conflicto, seguridad del entorno, medios sin coste y criterio de parada  |
| 2, 20 min | Buzón ficticio: recepción, spam, rebote, duplicado y suplencia; conservar fecha original |
| 3, 30 min | Permisos P01–P08 y guiones de identidad; hechos observados/declarados separados          |
| 4, 30 min | Casos de mesa y comunicación de pendientes sin divulgar cuenta                           |
| 5, 30 min | Custodia y restauración desde medio independiente, o registrar impedimento               |
| 6, 15 min | Conciliación, incidencias y veredicto conjunto por control                               |

No simular emergencias con pérdida de contraseñas, borrado permanente, vaciado de
papelera, cambios MFA ni revocación de sesiones de la cuenta existente.

## Guiones organizativos O01–O08

Desarrollan los [ocho casos ML-12](ml-12-case-and-tests.md). Una persona representa
soporte; la otra entrega hechos por fases y comprueba las decisiones.

| ID  | Hechos ficticios entregados                                              | Resultado y evidencia requerida                                                                                                 |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| O01 | Petición con email/UID alegados, sin fuente previa                       | Acuse neutral, identidad pendiente; no confirmar existencia; justificar siguiente evidencia                                     |
| O02 | Desafío caducado, repetido y cuarto intento                              | Rechazar esa prueba sin guardar valor; alternativa humana y reloj legal intacto. Recorrido de mesa no prueba el validador ID-02 |
| O03 | Persona controla sesión, pero representa a otra sin mandato              | Separar identidad/representación/alcance y escalar antes de revelar o actuar                                                    |
| O04 | Operador único o permiso que solo autoriza lectura                       | No autoaprobar; suplente/titular, carencia y siguiente fecha                                                                    |
| O05 | Auth ausente, mangas aparentemente vacíos y lectura de otra ruta fallida | Inventario desconocido; no cierre completo, plan de inspección pendiente                                                        |
| O06 | Solicitud sin respuesta, hitos internos vencidos y fecha legal próxima   | Mantener recepción original, escalado inmediato del riesgo legal; no inferir desistimiento                                      |
| O07 | Dos verificaciones ficticias: datos a las 10:00Z, Auth a las 10:05Z      | Día 0 = 10:05Z; revisión marcador +720 h; cierre técnico por ámbito, retención y comunicación separadas                         |
| O08 | UID equivocado o acceso indebido detectado antes de cerrar               | Parada, evidencia mínima, privacidad/incidente; no alterar acta anterior para ocultar error                                     |

Hoja de resultado por caso: entrada y versión; decisión del operador; evidencia que
pidió; conclusión del revisor y motivo; esperado/observado; discrepancias; plazo y
responsable de corrección; repetición; resultado final. Las filas tienen estado
inicial `PENDIENTE`. Ensayar un rechazo correcto también puede ser `APTO` para la
prueba, pero nunca equivale a caso real resuelto o a control implementado.

## C-01: ficha de custodia y restauración

Propuesta coherente con P3/P4 de ML-11: registro por adición, copia por hitos,
conciliación semanal y antes de un cierre; referencia bajo control de otra persona.
Su suficiencia para datos reales continúa pendiente de evaluación técnica/jurídica.
No se elige ni se instala una herramienta de cifrado de producción aquí.

| Campo privado            | Contenido a completar                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Custodio y aceptación    | Persona distinta del operador, cuenta propia y facultades                                             |
| Herramienta y versión    | Existente, mantenida, sin nuevo coste, validada para cifrado y restauración                           |
| Origen y destino general | Sistema de trabajo y otro dispositivo/medio controlado; detalles restringidos                         |
| Material mínimo          | Actas, aprobaciones y manifiesto por categoría; vínculo/identidad separados según necesidad           |
| Claves y recuperación    | Custodia separada del único cifrado; disponibilidad comprobada sin registrar valor o ubicación exacta |
| Accesos y permisos       | Quién prepara, lee, conserva y puede modificar cada referencia                                        |
| Hitos de copia           | Aprobación, operación, incidente y cierre; conciliación semanal propuesta                             |
| Retención/destrucción    | Regla D5 para original, versiones, descargas, papelera y copia                                        |
| Incidencias              | Responsable, parada, siguiente acción y fecha                                                         |

Un hash contrasta bytes con una referencia; no acredita identidad, hora confiable,
inmutabilidad o autoría por sí mismo. Si operador controla original y manifiesto,
la comparación no acredita custodia independiente. Registrar horas como declaradas
salvo fuente de tiempo acreditada. El registro humano tampoco detecta toda lectura
silenciosa: carencia explícita a resolver en P3/D7.

## Pruebas C01–C07

| ID  | Ejercicio con archivos ficticios                        | Aprobación requerida                                                                                                                |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| C01 | Inventariar entrega completa                            | Cantidad, rutas relativas, tamaños y huellas; sin datos reales; referencia de versión                                               |
| C02 | Cifrar copia con herramienta elegida y recuperarla      | Bytes contrastados; clave no publicada, no junto a la única copia; no usar prototipo local como herramienta aprobada                |
| C03 | Transferir mínimo al custodio por canal aprobado        | Recepción independiente, inventario y contraste confirmados por custodio                                                            |
| C04 | Restaurar en otro medio/equipo con acceso independiente | Contenido e inventario completos, no solo una muestra; permisos reconstruidos y contrastados                                        |
| C05 | Alterar una copia ficticia de trabajo                   | Detectar discrepancia con referencia independiente; nueva entrada, nunca sobrescribir evidencia anterior                            |
| C06 | Simular indisponibilidad del equipo del operador        | Custodio puede recuperar el conjunto y materiales necesarios sin credenciales del operador; si solo declara posibilidad, INCONCLUSO |
| C07 | Revisar retención y retirada de accesos                 | Inventario de todas las copias y plan según D5; no borrado permanente durante ensayo                                                |

No probar claves incorrectas o manipulación sobre originales necesarios; usar
copias ficticias de descarte y conservar la referencia de ensayo. Restaurar archivos
no demuestra recuperar cuenta ni descifrar datos tras reset del proveedor.

## Acta de cierre del ensayo

Completar privadamente: versión; participantes y roles; UTC inicio/fin; P01–P08,
O01–O08 y C01–C07 con veredictos y evidencia; limitaciones; incidentes; correcciones;
riesgos P3/P4; disponibilidad de responsables; conclusiones separadas de operador,
revisor y custodio; aceptación de alcance por titular.

Clasificación final: `APTO_SOLO_ENSAYO / REQUIERE_CAMBIOS / INCONCLUSO`. No hay un
resultado automático `ACTIVADO`. Solo proponer activación después de resolver
dictamen, retención, identidad, medios y todas las condiciones; aprobaciones reales
con referencia y fecha. Estado de este paquete: guion preparado, sin acta ejecutada.
