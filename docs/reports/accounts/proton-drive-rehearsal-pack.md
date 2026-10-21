# ML-11: paquete de ensayo documental de Proton Drive

Preparado el 21/10/2026 para la [plataforma seleccionada](proton-drive-implementation-proposal.md).
Solo plantillas y ejemplos ficticios. No configura Proton ni activa expedientes.
No incluir en Git las plantillas cumplimentadas con personas, cuentas o casos reales.

Avance posterior: el usuario autorizó la cuenta existente y confirmó login propio.
El [ensayo parcial del servicio](proton-drive-service-rehearsal-2026-10-21.md)
registra carga y restauración de una muestra; las casillas iniciales del paquete
local no se reescriben como si todas las pruebas de Proton hubieran pasado.

## Preparación local entregable

El paquete local `ML11-Proton-Drive-Sintetico-2026-10-21.zip` reúne instrucciones,
tres actas ficticias, ficha de conclusión pendiente, registro humano de ejemplo,
matriz PD01–PD09 sin resultados de servicio y manifiesto SHA-256.

Se conserva fuera del código de MangaList como artefacto de ensayo. No es una
copia cifrada, backup operativo o sistema de auditoría; no contiene datos reales
ni credenciales. No subirlo automáticamente a Proton. La selección P1 permite
prepararlo, sin considerar aceptados P2–P5 por esta entrega.

## Estructura propuesta para una fase de ensayo autorizada

| Espacio     | Propietario propuesto             | Contenido ficticio y acceso                                      |
| ----------- | --------------------------------- | ---------------------------------------------------------------- |
| Operación   | Cuenta del actor operador         | Actas `SYN-PD-001` a `003`; actor revisor con lectura nominal    |
| Revisión    | Cuenta distinta del actor revisor | Conclusión de ejemplo y manifiesto; operador con lectura nominal |
| Restringido | Actor custodio por determinar     | Solo ficha vacía; no añadir UID, identidad ni contactos reales   |

Crear esos espacios solo en una fase autorizada. No agruparlos bajo una carpeta
compartida padre ni copiar el ZIP completo al espacio compartido de operación:
las cuentas de prueba deben recibir únicamente el subconjunto que corresponda.
Las carpetas locales del paquete ilustran estructura, no tienen esos permisos.
Una persona manejando varias cuentas no prueba la independencia organizativa D3.

## Plantilla de acta mínima

| Campo                            | Regla de cumplimentación                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ID de caso                       | Opaco; en este ensayo solo prefijo `SYN-PD-`                                                                |
| Alcance y fase                   | Ensayo / preparado / pendiente de evidencia / pendiente de revisión                                         |
| Recepción y respuesta a derechos | Instante de recepción separado; plazo asignado por privacidad según caso, sin derivarlo del umbral de 720 h |
| Finalización acreditada          | Instante y referencias de inventario/Auth; vacío si no se acredita; no sustituir por `updatedAt`            |
| Revisión del marcador            | `completedAt` más 720 h; vacío sin finalización acreditada; es fecha de revisión humana                     |
| Evidencias                       | Referencias mínimas y versión, sin biblioteca o documentación de identidad por defecto                      |
| Actor operador y propuesta       | En el ensayo, alias ficticio; no autoaprobar                                                                |
| Versión y manifiesto             | Identificador de acta, archivos y huellas; referencia bajo custodia distinta pendiente                      |
| Revisión independiente           | Actor, versión contrastada, conclusión y motivo en espacio separado; dejar pendiente si falta               |
| Excepción y siguiente revisión   | Motivo, fundamento por revisar, responsable y máximo 30 días hasta nueva revisión cuando proceda            |
| Cierre y vínculo                 | Tras cierre, revisión humana del vínculo a los 30 días, sin borrado automático; retención según D5          |
| Carencias                        | Persona responsable, escalado y siguiente fecha; sin conservar indefinidamente por estar pendiente          |

Conclusión posible sin D3: `PENDIENTE_REVISION`. Una prueba de integridad correcta
no cambia esa conclusión. Ningún campo concede acceso a producción.

## Registro humano propuesto

Un evento contiene ID de evento, instante UTC declarado, actor ficticio, caso,
acción, versión, motivo, resultado, referencia de evidencia y vínculo de corrección
si sustituye un evento anterior. Ejemplos de acciones: preparar acta, solicitar
revisión, registrar carencia, comprobar copia y revocar acceso en un ensayo futuro.

El paquete solo registra preparación local. No inventar eventos de login, lectura,
invitación o aceptación del revisor que no hayan ocurrido. En operación futura se
registran únicamente acciones observadas o declaradas, distinguiendo ambas.
Este historial editable no descubre lecturas silenciosas ni es registro inmutable.

## Guion de aceptación del servicio

El paquete inicial marcaba los ensayos siguientes **NO_EJECUTADO_EN_PROTON**.
El informe posterior enlazado arriba registra su estado parcial actual, sin
dar por aceptados los criterios compuestos. La evidencia debe guardarse de forma privada,
con secretos y direcciones redactados antes de cualquier entrega pública.

| ID   | Acción concreta del ensayo                                                                       | Criterio / tratamiento del resultado                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| PD01 | Iniciar sesión con MFA, rechazar acceso sin factor y ensayar recuperación                        | Recuperar acceso y descifrado; no fotografiar códigos o material de recuperación                                                |
| PD02 | Invitar nominalmente al actor autorizado; probar actor no invitado                               | Acceso solo al recurso aprobado y ningún enlace público; el envío de la invitación necesita autorización                        |
| PD03 | Intentar editar la conclusión desde operador y el acta desde revisor                             | Ambos intentos denegados, comprobar propietario real y permisos heredados                                                       |
| PD04 | Revisar compartición, lector y editor con Access desactivado si procede                          | El lector no cambia permisos; el editor restringido no delega; revocación efectiva y descargas previas inventariadas            |
| PD05 | Exportar y restaurar una versión concreta y su manifiesto                                        | Coincidencia de archivos y huellas; permisos comprobados de nuevo, sin inferirlos del contenido                                 |
| PD06 | Contrastar registro disponible con lecturas, denegaciones y cambios de permiso observados        | Documentar ausencias; la falta de evidencia no es aprobación; P3 sigue pendiente si no satisface el riesgo                      |
| PD07 | Simular indisponibilidad y cuota insuficiente sin llenar la cuenta real ni desconectar servicios | Escalado y agenda disponibles en contingencia aprobada; no improvisar un destino de datos                                       |
| PD08 | Repetir mesa 29/30/90 días, sin día 0 y sin revisor                                              | Siempre revisión humana, sin retirada automática; independencia y plazo de derechos separados                                   |
| PD09 | Revisar matriz D5, versiones, papelera, descargas y copias                                       | Necesidad/plazo/responsable por categoría y capacidades de cierre documentadas, sin promesas de eliminación remota de descargas |

Un resultado «no disponible» o «inconcluso» debe conservarse como tal; no cambiarlo
a satisfactorio por tener cifrado o porque el ensayo local de manifiesto pase.

## Ensayo local de manifiesto

El manifiesto enumera rutas relativas, longitud y SHA-256 de archivos ficticios;
se excluye a sí mismo y al informe de ejecución generado después. El verificador
local de esta preparación comprueba también archivos inesperados dentro del
conjunto declarado. La lista completa y el propio manifiesto necesitan custodia.

Contrastes que se documentarán en el artefacto local:

1. Copia intacta: los archivos declarados coinciden.
2. Cambiar un acta conservando la referencia: se detecta discrepancia.
3. Añadir un archivo no declarado: se detecta discrepancia de inventario.
4. Recalcular el manifiesto tras alterar el acta: la referencia modificada puede
   dar coincidencia. Es un contraejemplo previsto, no una garantía de custodia.

Las alteraciones se hacen en copias de los documentos ficticios. No se ejecuta
borrado, carga a nube o lectura de Firebase. Este ensayo demuestra el contraste
de bytes de ese paquete, no firma, identidad, reloj confiable, integridad histórica,
cifrado, restauración del servicio o auditoría completa.

## Condiciones de continuación

Preparación local completada: ocho archivos de contenido y dos metadatos en el
paquete. Longitud, SHA-256 e inventario contrastados sobre los archivos escritos
en disco antes de comprimir. Cuatro expectativas del contraste en memoria
satisfechas: original coincide, cambio detectado, archivo extra detectado y
referencia recalculada permite coincidencia. La última es una limitación de
seguridad observada, no aprobación de custodia. El informe local conserva esos
resultados y cuatro escenarios de mesa: 29, 30 y 90 días y ausencia de día 0.
Todos mantienen la actuación administrativa en ninguna y D3 pendiente; son
ejemplos documentales, no resultados de Proton o de una herramienta operativa.

La preparación local y la documentación se pueden revisar sin activar cuentas.
La fase de servicio necesita concretar cuentas de ensayo e invitaciones y su
autorización, cumplir las condiciones de privacidad del ensayo y registrar sus
resultados. La operación con casos reales necesita además D3, matriz D5, dictamen
D7, controles alternativos P3 aceptados y autorización específica de activación.

Firebase Spark exclusivamente. No existe integración de Proton con Firebase ni
automatización de borrado. El PR #9 se fusionó posteriormente por autorización
expresa del titular; véase el [registro de fusión y condiciones pendientes](ml-11-acceptance-2026-10-21.md#actualizacion-tras-la-fusion).
Los ensayos no activan expedientes reales ni autorizan despliegues.
