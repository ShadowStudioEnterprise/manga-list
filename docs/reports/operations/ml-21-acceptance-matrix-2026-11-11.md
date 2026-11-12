# ML-21 — Matriz de aceptación de MangaList 1.0

Fecha: 11 de noviembre de 2026 · Base documental: `b6ee55a` · Aprobada por el titular el 12/11/2026, condicionada al ensayo ML-10

## Criterios de registro

- **PASS**: la evidencia acredita el resultado esperado para la revisión, el
  entorno y el alcance indicados.
- **FAIL**: el resultado observado difiere del criterio. Registra el impacto y
  la corrección o el resultado de la repetición.
- **BLOCKED**: falta evidencia o un requisito del ensayo, o existe un
  aplazamiento documentado. Registra la excepción y la condición de revisión.

Para cada fila, completa revisión candidata, fecha UTC, entorno, esperado,
observado, referencia saneada, responsable y decisión del titular cuando aplique.
Los pases históricos y las decisiones administrativas conservan su alcance.

## Excepciones aceptadas por el titular

El titular acepta para MangaList 1.0 las excepciones `BLOCKED` E1–E9 de ML-11/12
(PR #42), X16-1, X16-2, X16-A, X16-B1 y X16-C de ML-16 y el aplazamiento de las
sesiones con lectores de pantalla de ML-17. Esos escenarios quedan fuera de los
requisitos para publicar 1.0. Cada fila conserva su condición de revisión.

## Capacidad, operación y comprobaciones remotas

| Área                               | Estado                    | Evidencia o condición pendiente                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ML-08 · decisión de capacidad      | PASS · documental         | PR #41. Spark, objetivo 36 cuentas activas/día, techo condicionado de 50, bibliotecas ordinarias de hasta 500 obras y reserva administrativa del 20 %. [Acta ML-08](../firestore/ml-08-capacity-acceptance-2026-11-09.md).                                                                                                           |
| ML-08 · observación                | Seguimiento posaceptación | Ventana de 31 días de cuota agregada real bajo los umbrales aprobados: objetivo de 36 cuentas activas/día y techo condicionado de 50. [Acta ML-08](../firestore/ml-08-capacity-acceptance-2026-11-09.md).                                                                                                                            |
| ML-09 · riesgo residual            | PASS · documental         | PR #40. Riesgo de indisponibilidad temporal aceptado para 1.0. Pausa local entre pestañas, Spark sin facturación y App Check diferido. [Acta ML-09](../firestore/ml-09-risk-acceptance-2026-11-08.md).                                                                                                                               |
| ML-10 · protección de `main`       | PASS · lectura histórica  | Activación y comprobación por lectura el 21/10/2026. [Informe ML-10](ml-10-main-ruleset-2026-10-21.md).                                                                                                                                                                                                                              |
| ML-10 · lectura remota del ruleset | PASS                      | 12/11/2026 UTC. El titular confirmó el ruleset activo sobre `main`, sin bypass, con PR y el check `verify` obligatorios y bloqueo de borrado y de force push. El PR #37 histórico se cerró sin fusionar.                                                                                                                             |
| ML-10 · ensayo en PR               | BLOCKED                   | Ejecutar y documentar el ensayo controlado en el PR del candidato final antes de fusionar.                                                                                                                                                                                                                                           |
| ML-13 · cierre operativo para 1.0  | PASS                      | 12/11/2026 UTC. Spark sin facturación; revisión de IAM, clave web, Auth, reglas de Firestore, Actions y canal privado. El titular asume seguridad, recepción y operación y acepta la ausencia de un segundo revisor para 1.0. [Auditoría y decisiones de ML-13](../../security/iam-audit.md#revision-de-consola-del-12-11-2026-utc). |
| ML-15 · OAuth y recuperación       | PASS                      | 12/11/2026, 13:51 UTC, Google Chrome. Google OAuth real, acceso a biblioteca y cierre de sesión correctos. Correo real de Firebase Authentication, página de acción alojada y restablecimiento completados en `mangalist-61bb8.web.app`. [Acta ML-15/17](../quality/ml-15-17-administrative-closure-2026-11-11.md).                  |
| ML-17 · lectores de pantalla       | BLOCKED                   | Excepción aceptada para 1.0. Pendientes sesiones asistidas con NVDA o Narrador, VoiceOver y TalkBack. [Acta ML-15/17](../quality/ml-15-17-administrative-closure-2026-11-11.md).                                                                                                                                                     |
| ML-20 · respuesta operativa        | PASS · ejercicio de mesa  | Realizado el 12/11/2026 con el titular único en todos los roles. Reinicio real de cuota y recuperación real de Hosting aceptados como excepciones para 1.0. [Incidencias](../../operations/incidents.md#ejercicio-de-mesa-del-12-11-2026).                                                                                           |

El titular conserva las capturas y el PDF de ML-10 y ML-13 fuera del repositorio.
En ML-13 se registró como mejora opcional reducir las 25 APIs permitidas por la
clave web y revisar las APIs auxiliares del inventario de 41 habilitadas. Solo
Firestore registró tráfico en la ventana observada de 24 horas (2 solicitudes).

## ML-11 y ML-12 — Procedimientos preparados y sin activar

Las filas siguen el [acta del PR #42](../accounts/ml-11-12-not-activated-acceptance-2026-11-09.md).
La eliminación ordinaria y su reanudación tienen evidencia sintética propia.

| Id  | Estado  | Condición para revisar el bloqueo                                                            |
| --- | ------- | -------------------------------------------------------------------------------------------- |
| E1  | BLOCKED | Designar operador, suplente, revisor y custodio con doble revisión y custodia independiente. |
| E2  | BLOCKED | Acreditar buzón operativo y atención efectiva.                                               |
| E3  | BLOCKED | Comprobar identidad y alternativa para casos sin acceso a Authentication.                    |
| E4  | BLOCKED | Validar permisos delegados entre personas (P2).                                              |
| E5  | BLOCKED | Acreditar auditoría (P3), custodia, destino y recuperación desde respaldo externo (P4).      |
| E6  | BLOCKED | Completar evaluación técnica D6 para intervenir sobre datos.                                 |
| E7  | BLOCKED | Completar asesoría jurídica D7 y validar matriz D5 de retención y plazos.                    |
| E8  | BLOCKED | Resolver objetivos de 2 y 5 días y calendario T-01.                                          |
| E9  | BLOCKED | Resolver autorización expresa de activación A-01.                                            |

## ML-16 — Evidencia física y excepciones

El titular aplaza el segundo router para una LAN aislada sin WAN hasta después de
1.0. El [acta conjunta ML-20/16](ml-20-16-acceptance-2026-11-11.md) conserva los
resultados físicos previos, sus límites y el cierre de H1–H7.

| Id o ensayo       | Estado                    | Evidencia o condición de revisión                                                                                                                                                            |
| ----------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Android físico    | PASS · histórico          | Recuperación con Doze profundo inducido el 27/10/2026.                                                                                                                                       |
| Safari macOS      | PASS · histórico parcial  | Recorridos verificados dentro del alcance ensayado.                                                                                                                                          |
| iPhone 11 Wi-Fi   | PASS · histórico          | Recuperación tras bloqueo físico en el alcance ensayado.                                                                                                                                     |
| iPhone 11 celular | PASS · histórico limitado | 500 obras verificadas (PR #43). Se conserva el cierre de sesión anterior a la exportación y el límite de inspección de Archivos.                                                             |
| Fase 1B · PC      | PASS                      | `Listen` observado en loopback. La repetición del 11/11/2026 acreditó JSON v2, 500 IDs únicos, capítulos de texto, SHA-256 concordante y cero procesos y puertos del laboratorio pendientes. |
| H4 · relé         | Resuelto                  | La evidencia del ensayo solo registró `v`. El relé admite ese nombre y rechaza los demás antes de reenviar; pruebas del relé 12/12.                                                          |
| X16-1             | BLOCKED                   | Doze profundo natural y transición Wi-Fi ↔ datos móviles en Android, pendientes de evidencia física.                                                                                         |
| X16-2             | BLOCKED                   | B2 queda fuera del build por la guarda `DEV`. Revisar si cambia el contrato del build. Se conserva el PASS parcial de Safari.                                                                |
| X16-A             | BLOCKED                   | Acreditar router LAN aislado sin WAN y comprobar Archivos, Blob y snapshot en iOS.                                                                                                           |
| X16-B1            | BLOCKED                   | Acreditar router LAN aislado sin WAN y comprobar login y Ajustes en ambas orientaciones en iOS.                                                                                              |
| X16-C             | BLOCKED                   | Diagnóstico inalámbrico de Doze natural aplazado. H7 cerrado con TTL máximo de 45 minutos.                                                                                                   |

## Paso previo a ML-22

El titular único aprueba la matriz el 12/11/2026. La aceptación final queda
condicionada únicamente a ejecutar y documentar el ensayo controlado de
**ML-10** en el PR del candidato final antes de fusionarlo. La preparación
técnica local de ML-22 puede avanzar mientras se completa el ensayo.
