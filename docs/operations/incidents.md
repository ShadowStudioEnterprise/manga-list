# Incidencias operativas en Spark

ML-20 · 6 de noviembre de 2026. Guía de diagnóstico y ensayo para MangaList 1.0.

## Primeros pasos

1. Abre un expediente en el canal privado aprobado. Anota hora UTC, síntoma, código saneado,
   superficie (web, PWA o portal), revisión copiada en Ajustes, alcance y última acción confirmada.
   Usa un ID opaco. Los datos de identidad van en el registro restringido del caso.
2. Distingue caché, escrituras pendientes y confirmación de servidor. Si el resultado de una
   escritura es incierto, verifica el estado antes de repetirla. Preserva borradores y copias.
3. Registra hipótesis, evidencia a favor o en contra, responsable, siguiente comprobación y
   criterio de recuperación. Reproduce con `demo-mangalist` y datos ficticios.

Los umbrales de esta guía son **propuestos**. Tratar como crítico desde el primer indicio de
acceso cruzado, exposición de secretos, pérdida irreversible o error generalizado tras una
publicación. Escalar si un fallo funcional se reproduce en dos clientes independientes durante
cinco minutos, o si un caso individual sigue abierto tras un ciclo de recuperación controlada.
Los cinco minutos son una ventana de diagnóstico propuesta, independiente de obligaciones
de privacidad o plazos de soporte.

| Función                                | Designación                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| Coordinación, comunicación y suplencia | Pendientes de designación por el titular.                                           |
| Auth, Firestore, PWA y Hosting         | Responsable técnico y revisor independiente pendientes.                             |
| Privacidad y borrados interrumpidos    | Responsable de privacidad, operador, suplente y custodio del expediente pendientes. |
| Acciones en producción                 | El titular aprueba por caso, artefacto, destino y alcance.                          |

## Cuota Spark

1. Clasifica `resource-exhausted` por servicio y operación. Separa la pausa local del uso
   agregado del proyecto. Detén reintentos masivos, importaciones y reconexiones en bucle.
2. Con acceso de lectura autorizado, registra porcentaje y ventana del recurso afectado en
   la consola. Umbrales propuestos por recurso y ventana, 70 % para revisar tendencia, 85 %
   para pausar carga voluntaria y escalar, y rechazo efectivo para entrar en recuperación.
   Firestore restablece cuotas diarias alrededor de medianoche del Pacífico. Hosting comparte
   cuota entre sus destinos y tiene ventanas propias.
3. Conserva la pausa y los datos pendientes. Cuando la cuota permita operar, un único cliente
   usa el reintento explícito. Confirma un snapshot de servidor completo y que las operaciones
   pendientes se resuelven antes de reabrir otras pestañas. Si vuelve el rechazo, detén la prueba.

La pausa de 15 minutos del cliente y la cuota del servicio tienen relojes distintos.
Consulta [las defensas ML-09](../reports/firestore/ml-09-recovery-2026-10-23.md),
[cuotas de Firestore](https://firebase.google.com/docs/firestore/quotas) y
[cuotas de Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing).
El plan operativo es Spark con Auth, Firestore Standard y Hosting estático.

### Sospecha de abuso de cuota autenticado

Un aumento sostenido de consumo o rechazos en varios clientes independientes abre una
investigación. Contrasta el recurso, la ventana y el uso agregado con reconexiones,
importaciones o recuperaciones previstas. Un `resource-exhausted` por sí solo no atribuye
abuso a una cuenta. Registra únicamente cifras agregadas y evidencia saneada.

1. Aplica el [acta de capacidad ML-08](../reports/firestore/ml-08-capacity-acceptance-2026-11-09.md)
   (PR #41). El objetivo es 36 cuentas activas al día y el techo condicionado es 50, con
   bibliotecas ordinarias de hasta 500 obras. Entre 37 y 50, revisa el consumo antes de
   admitir más actividad. Por encima de 50 o con cualquier recurso en rojo, escala al titular
   antes de ampliar la cohorte. Coordina por separado bibliotecas mayores, restauraciones
   y borrados masivos. Para Firestore, los límites operativos con reserva del 20 % son
   40.000 lecturas, 16.000 escrituras y 16.000 borrados al día, 0,8 GiB de almacenamiento
   y 8 GiB de transferencia mensual. Evalúa cada recurso por separado.
2. Ante indicios de abuso, pausa las cargas voluntarias y reabre la evaluación de riesgo con
   el titular. Mantén la pausa local de cuota de 15 minutos, compartida entre pestañas del mismo
   origen, y conserva los cambios pendientes. El [acta ML-09](../reports/firestore/ml-09-risk-acceptance-2026-11-08.md)
   (PR #40) acepta para 1.0 la posible indisponibilidad temporal por agotamiento de cuota.
   La pausa no limita el consumo global. Mantén Spark sin Blaze ni facturación y App Check
   diferido hasta después de 1.0.
3. Cuando el recurso permita operar, reintenta desde un solo cliente y confirma un snapshot
   completo de servidor y la resolución de operaciones pendientes. Si vuelve el rechazo,
   detén la prueba y escala. Con acceso de lectura autorizado, observa durante 31 días el
   uso diario en consola y registra los picos semanales de lecturas, escrituras y borrados.
   Reduce el objetivo si el consumo real supera el perfil esperado, antes de ampliar la cohorte.

## Acceso y sesiones

1. Identifica proveedor, flujo (inicio, retorno OAuth, cambio o recuperación) y síntoma
   (credencial, sesión, red o almacenamiento denegado). Registra si una pestaña privada,
   un perfil limpio o la PWA reproducen el fallo con una cuenta sintética en laboratorio.
2. Ante fallo de Google, comprueba revisión de cliente y que `/__/auth/` queda fuera del
   fallback SPA de la PWA. Distingue cierre/cancelación de fallo de proveedor. Para
   credenciales, usa los flujos de acceso o recuperación y preserva el mensaje genérico.
3. Confirma acceso, cierre, comportamiento tras recarga y separación de dos identidades
   sintéticas. Si aparece una biblioteca ajena, detén la prueba y activa privacidad.

## Sincronización

1. Registra estado de red, pausa, pestañas, snapshot de servidor y escrituras pendientes.
   Contrasta una pestaña con un segundo cliente independiente y la misma revisión.
2. Preserva cambios pendientes y reduce a una pestaña activa. Recupera conexión y observa el
   relevo o solicita estado si el cliente lo ofrece. Ante discrepancia, confirma con servidor.
3. Da por recuperado el flujo cuando dos clientes coincidan en el estado confirmado y no
   queden escrituras pendientes. Si falta confirmación, conserva la evidencia y escala.

## PWA

1. Compara la revisión en Ajustes con la versión servida y registra si el worker está activo
   o en espera. Si falla una URL reservada, registra estado HTTP y tipo de contenido sin
   copiar códigos OAuth ni parámetros de sesión.
2. Preserva formularios y termina operaciones. Cierra todos los clientes de ese origen para
   permitir la activación; reabre y verifica revisión, arranque sin conexión y acceso.
3. Contrasta con un perfil limpio antes de plantear limpiar datos del sitio. Mantén el perfil
   afectado mientras haya borradores o escrituras sin confirmar.

## Despliegue y rollback

1. Identifica `app` o `docs` y la revisión afectada. Registra release, versión, hashes,
   CI del candidato y compatibilidad con los contratos y reglas que estén activos.
2. Si hay regresión confirmada, prepara un artefacto de recuperación verificable.
   Si el proyecto, el inventario, Spark, el destino o la compatibilidad son inciertos,
   detén la promoción. Aplica los controles del
   [procedimiento de recuperación](../reports/operations/releases-and-recovery.md) y usa
   el [registro de publicación](../reports/operations/release-record-template.md).
3. Tras aprobación específica, el operador designado sigue el procedimiento de
   [despliegues](deployment.md) del destino. Comprueba revisión servida, rutas principales
   y estado PWA. El rollback de Hosting cambia contenido servido. Los datos y Auth se
   verifican por separado y los borrados confirmados son irreversibles.

## Privacidad

1. Ante sospecha de exposición o acceso cruzado, limita difusión de la evidencia, preserva
   la referencia y comunica por el canal privado aprobado. Escala a privacidad y seguridad
   para que decidan contención, plazos y comunicación.
2. Separa hechos de sospechas. Registra superficie, revisión, cobertura, instante UTC y
   resultado saneado. Excluye correos, UID, IP, tokens, bibliotecas y capturas con identidad
   de Git, CI y tickets públicos. Conserva vínculo e identidad bajo acceso restringido.
3. Comprueba el árbol y portal locales con el escáner y ensaya separación con dos UID
   sintéticos. La aprobación del canal, retención, responsables y cualquier actuación
   de contención real corresponde al expediente autorizado.

## Borrados interrumpidos

1. Distingue Auth, marcador y datos por separado. Un Auth ausente o una biblioteca vacía en
   caché no acreditan finalización. Usa el [procedimiento ML-12](../reports/accounts/ml-12-interrupted-deletion.md).
2. Si Auth sigue activo, identidad y alcance están verificados y procede la vía ordinaria,
   reautentica con el proveedor original y reanuda desde Ajustes. Conserva el marcador y
   verifica datos restantes en servidor tras un acuse perdido.
3. Escala a privacidad si falta identidad, hay Auth ausente con residuo o el inventario es
   desconocido. Registra estado y plazos por ámbito. La [revisión del marcador](../reports/accounts/manual-marker-review.md)
   es manual y su política de retirada está pendiente de validación.

## Simulacros aislados

Ejecutar desde un checkout limpio con las dos instalaciones fijadas por lockfile, Node,
Java 21 o posterior, Firebase CLI y Chromium/Firefox de Playwright. Ejecutar los runners de
emuladores en serie, ya que comparten puertos. Usar solo `demo-mangalist` y direcciones
`.test`. Construir SPA/PWA con la configuración demo de CI y los artefactos del mismo checkout.
Registrar comando, revisión, esperado, observado y resultado. **PASS** indica que se
comprobó el resultado esperado, **FAIL** que difirió y **BLOCKED** que faltó un requisito.

| Escenario              | Reproducción y criterio                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cuota y sincronización | `npm run test:e2e`, casos ML-09 y ML-07. Inyección de rechazo o suspensión, pausa entre pestañas, recuperación explícita y snapshot confirmado.                                                                    |
| Auth                   | `npm run test:e2e` y `npm run test:auth:built`. Credenciales sintéticas, fallo de red, renovación, aislamiento y almacenamiento denegado.                                                                          |
| PWA                    | `npm run test:pwa` con build PWA demo. Worker espera a los clientes, reserva rutas de Auth y arranca desde el build local.                                                                                         |
| Release y rollback     | `node --test tests/build-evidence.test.js` y verificación de sellos SPA/PWA demo. Inventario válido aceptado, archivo alterado o contrato incompatible rechazado. Simula selección y descarte local de artefactos. |
| Privacidad             | `npm run audit:security:built`, `node scripts/test-firestore-local.mjs` y casos ML-15 de E2E. Detecta patrones en archivos y comprueba que un UID sintético no accede al otro.                                     |
| Borrado interrumpido   | `node scripts/test-firestore-local.mjs --ml12`. Acuse de lote perdido con reanudación, e identidad ausente con residuo y marcador preservado.                                                                      |

Los ejercicios técnicos cubren los mecanismos indicados. La cuota agregada real, la
restauración de Hosting, la contención de un incidente real y el ejercicio de mesa
con operador y revisor designados quedan pendientes. Para la mesa, cada revisor recibe
un escenario con una evidencia ausente (cuota, versión, identidad o inventario), anota
la decisión y solo pasa cuando identifica la evidencia que falta y el punto de parada.
