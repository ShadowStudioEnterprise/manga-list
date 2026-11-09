# ML-11 y ML-12 — Preparados y no activados para MangaList 1.0

Fecha: 9 de noviembre de 2026 · Referencia de código: `origin/main` en `b71f1ba`

## Decisión

El titular del proyecto decide publicar MangaList 1.0 con la revisión de marcadores de eliminación (ML-11) y la asistencia a eliminaciones interrumpidas (ML-12) **preparadas pero no activadas**. Las decisiones de diseño D1 a D7 siguen aceptadas, pero el procedimiento humano no se pone en marcha porque no pueden acreditarse sus condiciones con un titular único. Las excepciones se registran aquí y se trasladan a la matriz de aceptación de ML-21.

## Qué existe y qué no

- Existe y está probado con datos sintéticos: reautenticación, marcador `deleting` con barrera contra nuevas escrituras, borrado de las obras en lotes de 400 (hasta 2.000 por intento), eliminación posterior de Authentication, conservación del marcador ante un fallo y reanudación del borrado.
- No existe: asistencia humana, buzón operativo, plazos de respuesta, trabajador en segundo plano ni fecha persistente de finalización de una eliminación.

## Lo que el usuario puede esperar

- La eliminación se solicita desde la aplicación. Si se interrumpe, se completa reintentándola desde la propia aplicación.
- Mientras no se complete, permanecen el marcador y los residuos pendientes de borrar.
- No se ofrece asistencia humana ni se promete ningún plazo de respuesta. Los objetivos de 2 y 5 días de los informes no se anuncian como compromisos.

## Excepciones registradas

| Id  | Excepción                                                                                                                                    | Impacto                                           | Estado                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------- |
| E1  | Operador, suplente, revisor y custodio sin designar; doble revisión, suplencia y custodia independiente no acreditables con un titular único | No se puede activar el procedimiento              | Pendiente de personas |
| E2  | Sin buzón operativo ni atención efectiva                                                                                                     | Sin canal de asistencia                           | No activado           |
| E3  | Validación de identidad y alternativa sin Authentication sin comprobar                                                                       | No se pueden atender casos sin acceso a la cuenta | No activado           |
| E4  | Permisos entre personas (P2) sin comprobar                                                                                                   | Sin acceso delegado                               | Solo ensayo           |
| E5  | Suficiencia de auditoría (P3), custodia y destino (P4) solo ensayados; respaldo externo no demostrado                                        | Sin recuperación externa acreditada               | Solo ensayo           |
| E6  | Evaluación técnica D6 pendiente                                                                                                              | Sin criterio para intervenir sobre datos          | Pendiente             |
| E7  | Asesoría jurídica D7 y matriz D5 pendientes                                                                                                  | Plazos y retención sin validar                    | Pendiente             |
| E8  | Objetivos de 2 y 5 días y calendario T-01 sin aceptar                                                                                        | Sin compromisos de servicio                       | No aceptado           |
| E9  | Activación A-01 no autorizada                                                                                                                | Cada operación real exigiría autorización expresa | No activado           |

Los hitos de 720 horas, 7, 30 y 90 días y la revisión del vínculo a los 30 días son internos y no constituyen plazos legales aprobados. Esta acta no contiene asesoramiento jurídico.

## Lo que esta decisión no autoriza

- No sustituye el dictamen jurídico ni justifica conservar datos de forma indefinida.
- No autoriza retirar marcadores ni actuar sobre cuentas o datos reales; toda operación real requiere autorización propia.
- No permite anunciar asistencia, plazos ni custodia externa como capacidades operativas.

## Condiciones para activar en el futuro

Designar personas distintas para las funciones de E1, comprobar buzón, identidad y permisos entre personas (E2 a E4), demostrar suficiencia de auditoría y restauración desde la custodia (E5), completar la evaluación técnica (E6) y la asesoría jurídica (E7), aceptar o rechazar los objetivos de servicio (E8) y emitir una decisión expresa de activación (E9).

## Riesgos residuales

- Un usuario con una eliminación interrumpida que no logre completar por sí mismo no tiene vía de asistencia.
- El marcador y los residuos no caducan ni se retiran automáticamente.
- La retención y los plazos para solicitudes de supresión no están validados jurídicamente.

## Condiciones de revisión

Se reabre esta decisión ante cualquiera de estas circunstancias:

- Una solicitud real de ayuda para completar una eliminación.
- Disponibilidad de una segunda persona o de asesoría para las funciones pendientes.
- Crecimiento notable de cuentas o difusión de la landing pública.
- Cambios en el código de eliminación, en las reglas de Firestore o en la política de privacidad.

## Seguimiento

Responsable: titular del proyecto. Se revisa junto con las actas de ML-08 y ML-09 en 9 de noviembre de 2027, o antes si ocurre alguna condición anterior.

## Aprobación

Titular del proyecto: aprobado el 9 de noviembre de 2026.
