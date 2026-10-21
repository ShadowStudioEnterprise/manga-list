# ML-12: ficha de caso y ensayos

Complementa el [procedimiento](ml-12-interrupted-deletion.md). Solo plantillas vacías
y datos sintéticos en Git. No cumplimentar aquí un expediente real.

## Ficha privada vacía

| Campo                                                 | Valor pendiente                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| ID opaco / versión de procedimiento                   | Asignar sin correo o UID en el nombre                                                  |
| Recepción original UTC / canal / alcance solicitado   | Pendiente                                                                              |
| Fecha límite jurídica / responsable del cómputo       | Pendiente; independiente de hitos internos                                             |
| Identidad / representación                            | Método, resultado, referencia restringida; sin secretos                                |
| Confirmación del alcance por solicitante              | Referencia, versión, fecha                                                             |
| Operador / revisor / suplente / privacidad / custodio | Referencias nominales solo en registro privado                                         |
| Autorización de lectura / proyecto y UID              | Referencia al vínculo restringido y doble contraste                                    |
| Inventario                                            | Esquema, rutas, paginación, cobertura, instante servidor, recuentos y errores saneados |
| Estado                                                | Auth; marcador; mangas; otras rutas; copias/logs; desconocidos explícitos              |
| Plan de actuación / aprobación destructiva            | Alcance, ventana, presupuesto, controles por lote y puntos de parada                   |
| Bitácora                                              | Evento, actor, UTC, autorización, resultado confirmado/desconocido y siguiente acción  |
| Excepción                                             | Motivo, fundamento validado, datos mínimos, aprobador, revisión no mayor a 30 días     |
| Comunicación                                          | Referencia restringida, fecha, fase, pendientes y siguiente actualización              |
| Cierre                                                | Técnico por ámbito / administrativo motivado; revisor, evidencia, fecha y reapertura   |
| Día 0 / revisión marcador / retención expediente      | Verificaciones Auth/datos, +720 h, matriz D5 y vencimientos separados                  |

La bitácora no debe copiar contenido de mangas, correos, direcciones IP, UID,
respuestas SDK completas ni pruebas de identidad. El vínculo privado permite
reproducir el contraste del caso; el acta conserva solo referencias y recuentos.
La referencia sola no acredita identidad ni aprobación: el revisor comprueba el
documento restringido. Correcciones se añaden con referencia a la entrada anterior.

## Mensajes modelo, sin enviar

Acuse: «Hemos recibido tu solicitud y le hemos asignado una referencia privada.
Te indicaremos la comprobación mínima necesaria por este canal. No envíes
contraseñas, tokens, códigos de acceso ni tu biblioteca. La próxima actualización
será en la fecha indicada en la respuesta de tu caso».

Interrupción: «La eliminación sigue pendiente. Hemos comprobado la fase indicada
en tu expediente; la interrupción no restaura datos ya eliminados. Te indicaremos
si puedes reanudar desde Ajustes con tu proveedor original o si hace falta revisión
manual. La próxima comprobación está fechada en la respuesta de tu caso».

Cierre por ámbito: «Se ha comprobado la ausencia de la cuenta de acceso y de los
datos del ámbito descrito en tu respuesta privada. Se conserva el marcador de
prevención de nuevas escrituras y la evidencia mínima descrita, con la finalidad,
revisión y plazo validados para tu caso. Las limitaciones sobre copias/dispositivos
y las vías para solicitar revisión o reclamar se indican en esa misma respuesta».

Personalizar con hechos y fechas verificados, nunca enviar un cierre modelo si
queda inventario desconocido. Privacidad incorpora fundamento, plazo aplicable y
vías de reclamación; estos textos no sustituyen esa decisión.

## Ensayos técnicos reproducibles

Usar solo `demo-mangalist`, datos ficticios y direcciones `.test`. El runner
existente arranca Firestore local; sin importaciones de producción ni credenciales.
Requiere Node compatible, dependencias ya instaladas, Firebase CLI y Java >=21.

```sh
node --experimental-vm-modules --test tests/account-service.test.js tests/manual-marker-review.test.js
node scripts/test-firestore-local.mjs
node scripts/test-firestore-local.mjs --ml12
npm run check:spark
npm run docs:build
```

El comando de emulador ejecuta toda la batería Firestore y reglas reales locales.
Las pruebas ML-12 están en `tests/firestore/security.test.js` y
`tests/account-service.test.js`; las anteriores mantienen cobertura complementaria.

| Escenario                                          | Evidencia y resultado esperado                                                                                                                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ML-12 acuse de commit perdido                      | Aplicar lote real en emulador y lanzar error después: contador confirmado 0, servidor 400 eliminados, Auth no tocado; cliente nuevo ve residuo y completa manteniendo marcador                |
| ML-12 Auth ausente con residuo                     | Crear usuario ficticio en Auth local, marcar y sembrar residuo; eliminar solo identidad ficticia y comprobar que Firestore conserva datos/barrera; no equiparar Auth ausente con finalización |
| ML-12 acuse Auth perdido (doble controlado)        | Simular aplicación de baja seguida de error: fase local falla aunque Auth simulado ya esté ausente; exigir lectura autorizada antes de repetir/cerrar                                         |
| Interrupción entre lotes / cliente nuevo           | Prueba existente en reglas: 401 datos, primer lote 400; cliente nuevo elimina 1, no recrea documentos                                                                                         |
| Más de 2000 / cuota / reautenticación              | Pruebas de servicio existentes: 2401 en varios intentos; Auth no se borra al agotar presupuesto; cuota impide nuevas peticiones; fallo reauth no borra                                        |
| Otra identidad / lote concurrente / token aceptado | Reglas existentes: terceros denegados, lote que inicia barrera no escribe mangas, propietario aún aceptado puede leer; no prueba revocación real                                              |
| Inventario desconocido / retirada insegura         | Reglas ML-11: ruta desconocida sobrevive; retirar marcador administrativamente reabre escrituras a contexto aceptado                                                                          |

El escenario Auth usa su emulador aparte, según evidencia: no se añade un ejecutor
Admin ni se simula expiración de credenciales de producción. Los errores de cuota
y pérdida de acuse son inyecciones controladas, no fallos reales de red/cuota.

## Ejercicio humano de mesa, pendiente de ejecución entre personas

Operador y revisor distintos usan solo `SYN-ML12-001` a `SYN-ML12-008` y la ficha
vacía. Revisor recibe hechos parciales, solicita evidencia faltante y registra
decisión/razón/fecha/actor. Aprobar únicamente si cada fila cumple su resultado;
un fallo obliga a corregir y repetir la fila. No es una prueba automática de
identidad, de correos, IAM o del sistema de custodia.

| Caso sintético       | Entrada                                                     | Criterio de aprobación                                                                                   |
| -------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 001 suplantación     | UID y correo aportados, sin evidencia previa                | No revelar existencia; identidad pendiente y escalado, no borrado                                        |
| 002 desafío inválido | Caducado, repetido o cuarto intento                         | Rechazo de ese desafío, sin guardar valor; revisión humana y reloj derechos vivo                         |
| 003 representación   | Login válido, mandato no acreditado                         | Separar identidad/representación/alcance; no actuar hasta revisión                                       |
| 004 autoridad        | Operador es único revisor o autorización solo lectura       | No autoaprobar ni borrar; suplencia/titular y próxima fecha                                              |
| 005 inventario       | Timeout y padre ausente con subcolección desconocida        | No concluir cero; cobertura parcial, parada y escalado                                                   |
| 006 abandono         | Sin respuesta, supera hitos 7/30/90 o plazo legal en riesgo | No reiniciar recepción; escalado por hito vencido y respuesta motivada; no baja automática               |
| 007 cierre           | Auth ausente, inventario vacío, marcador presente           | Cierre técnico por ámbito, no «todo borrado»; día 0 correcto, agenda +720 h y retención separada         |
| 008 incidencia       | Lote aplicado fuera del UID aprobado / acceso indebido      | Parada inmediata, preservar evidencia mínima, privacidad evalúa brecha; no ocultar corrigiendo registros |

Pendiente: participantes, fechas y actas ficticias de aprobación. Pasar ensayos de
código no acredita haber ejecutado estas comprobaciones organizativas.
