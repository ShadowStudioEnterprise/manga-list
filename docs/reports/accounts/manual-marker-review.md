# Revisión manual del marcador: propuesta operativa MangaList 1.0

Actualización ML-11 (21/10/2026): véanse el [informe de validación](ml-11-validation-2026-10-21.md)
y el [procedimiento y decisiones pendientes](ml-11-operating-procedure.md).
La revisión a 30 días sigue siendo propuesta, sin validación legal definitiva.

Decisión del titular recibida el 19/10/2026: revisar manualmente a los 30 días,
sin eliminación automática. Pendiente de validación legal y técnica. Este documento
prepara el procedimiento; no autoriza operaciones reales. No añade TTL, cron,
Functions, extensiones, billing ni campos al documento `users/{uid}`.

## Inicio del plazo y responsables

El día 0 es la confirmación operativa documentada de finalización de datos y Auth,
no `updatedAt`: ese campo solo indica el inicio del borrado. Sin confirmación no
hay fecha de retirada calculable. A los 30 días se abre una revisión humana; si se
retrasa, el marcador permanece. No existe tarea programada en esta iteración.
Registrar horas en UTC y presentar citas al titular en Europe/Madrid.

Antes de implantar: el titular designa por nombre un operador de soporte, un
suplente, un revisor técnico/seguridad independiente y un responsable de privacidad.
Soporte verifica identidad y alcance; el operador reúne evidencias; el revisor
contrasta proyecto, UID y condiciones; privacidad valida propósito, plazos y
excepciones; el titular autoriza por separado cualquier operación sobre el UID.
Si faltan personas, permisos mínimos o separación de revisión, conservar y escalar.
No se asigna esta responsabilidad implícitamente al desarrollador.

## Identificación y expediente mínimo

Usar un canal privado aprobado y el [procedimiento de asistencia](abandoned-deletion-assistance.md).
La persona que controla Auth se reautentica con su proveedor original. Vincular el
caso al UID que devuelve ese flujo, sin aceptar un correo, UID aportado o captura
como prueba suficiente. Si Auth ya no existe, emplear un expediente previo cuya
identidad se verificó y un mecanismo de desafío aprobado; si no existe evidencia
suficiente, detener la actuación y escalar a privacidad. No recrear Auth para
demostrar identidad. No solicitar contraseñas, tokens, códigos MFA ni biblioteca.

Separar el ID opaco de caso del vínculo restringido proyecto/UID. El registro
compartido contiene ID de caso, fecha de revisión, fase, responsables, referencias
a evidencias, decisión, motivo y siguiente revisión. Guardar el UID y las pruebas
de identidad solo en el registro privado de acceso mínimo; ni Git ni PR ni logs
públicos. No copiar correo, IP, notas, títulos ni credenciales en evidencias.
Registrar accesos y aprobaciones según el canal aprobado. El plazo del expediente
y la retirada del vínculo caso/UID requieren validación de privacidad: no se
adopta automáticamente el plazo de 30 días del marcador para otros registros.

## Revisión humana por caso

1. Comprobar autorización de consulta, alcance y coincidencia exacta proyecto/UID
   con un segundo revisor; anotar versión del esquema y reglas efectivas. Las
   consultas de producción requieren aprobación separada de esta iteración.
2. Verificar la evidencia del día 0: confirmación de eliminación Auth y ausencia de
   datos asociados. No inferirla de la antigüedad, `status` ni documento padre.
3. Preparar lecturas servidor paginadas y acotadas del inventario de subcolecciones
   y demás ubicaciones asociadas. Registrar solo rutas de esquema, cantidades,
   marcas de tiempo y resultado, nunca el contenido. Un listado vacío de mangas
   no demuestra que no haya otras subcolecciones. Inventario desconocido = preservar.
4. Confirmar que Auth sigue ausente y comprobar el historial autorizado de
   eliminación/revocación. Si existe, hay restauración/importación prevista del
   UID o un resultado ambiguo, preservar y tramitar asistencia independiente.
5. Verificar margen propuesto de al menos 24 horas desde la última confirmación
   de revocación/eliminación, además de la revisión a los 30 días desde finalización.
   Su suficiencia y tratamiento de tokens antiguos requieren validación técnica.
   Las reglas actuales no consultan revocación: no ofrecen bloqueo inmediato de
   lectura; quitar el marcador permitiría escribir a un token aún aceptado.
6. Revisar incidencias, reclamaciones, preservación justificada, concurrencia,
   posibilidad de reutilizar el UID y compatibilidad del rollback. No cancelar el
   bloqueo ni eliminarlo para facilitar soporte. Un cambio de reglas exige repetir
   los ensayos con la versión candidata y revisar su coste.
7. Emitir decisión documentada y firmada por operador y revisor. Una propuesta
   favorable de retirada se remite a privacidad y al titular con UID restringido,
   alcance exacto, riesgos y plan de verificación. Esperar autorización específica.
   La ejecución y comprobación posterior constituyen otro trabajo autorizado;
   esta iteración no incluye herramienta de retirada ni instrucciones ejecutables.

## Criterios de decisión

| Resultado                            | Condiciones y actuación                                                                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preservar y reabrir asistencia       | Auth existe, datos pendientes o identidad/proyecto inciertos; no retirar ni recrear UID.                                                                                                                                                               |
| Preservar por evidencia insuficiente | Falta día 0, inventario, revisión de tokens, aprobación legal/técnica o segundo revisor; documentar carencia y asignar próxima revisión.                                                                                                               |
| Preservar por excepción              | Incidente o deber de conservación validado por privacidad; justificar necesidad mínima y fecha de reevaluación. No retención indefinida sin revisión.                                                                                                  |
| Proponer retirada                    | Todas las comprobaciones son favorables, 30 días desde finalización, margen validado, Auth ausente, inventario vacío, sin concurrencia/reutilización prevista, dos revisores y validación legal/técnica. Requiere autorización separada para ejecutar. |

Si el borrado está incompleto: propuesta de seguimiento humano a los 7 días y
escalado a los 30; a los 90, privacidad decide y justifica continuidad o siguiente
actuación. Estos plazos adicionales siguen pendientes de aprobación. En cada
preservación registrar fecha concreta de siguiente revisión y responsable, evitando
que «pendiente» se convierta en conservación sin control.

## Plantilla privada y ensayo

Campos del caso: ID; proyecto/UID en vínculo restringido; evidencia de identidad y
autorización; operador/revisor/suplente; día 0 y fundamento; fecha de revisión;
Auth ausente comprobado; inventario/versiones/recuentos; última revocación o
eliminación confirmada; margen; incidencias/restauraciones; validación privacidad;
decisión/motivo; autorización de retirada si procede; próxima revisión; referencia
al acta final. No rellenar esta plantilla con personas reales en el repositorio.

Ensayo sintético: caso completo candidato; datos pendientes; Auth presente;
identidad no demostrada; `updatedAt` antiguo sin día 0; token antiguo; fallo de
lectura; inventario ampliado; restauración UID prevista. Todos salvo el primero
deben preservar y escalar; el primero solo propone retirada. La regresión de reglas
comprueba marcadores de 29, 30 y 90 días: siguen bloqueando escrituras y el cliente
no puede retirarlos. El emulador no certifica expiración/revocación de tokens de
producción ni validez legal; son validaciones pendientes.

Fuentes oficiales consultadas el 19/10/2026:
[sesiones y revocación](https://firebase.google.com/docs/auth/admin/manage-sessions),
[subcolecciones y eliminación](https://firebase.google.com/docs/firestore/manage-data/delete-data),
[cuotas y TTL](https://firebase.google.com/docs/firestore/quotas).
