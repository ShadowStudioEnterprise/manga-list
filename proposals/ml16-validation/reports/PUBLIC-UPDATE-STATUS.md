> **CASO CERRADO COMO PASS el 25/10/2026.** 0c871ab → 0bb93e7 en Safari real, con dos clientes controlados y ciclo completo de espera/activación. Informe: ../ML16-release-review/CIERRE-ACTUALIZACION-PUBLICA.md. El texto siguiente conserva la preparación y los bloqueos históricos.

# Último caso ML-16: cambio entre releases públicas

Estado: **BLOCKED por ausencia de otra release publicada**. Comprobación del 24/10/2026 a las **17:17:21 Europe/Madrid**, `55-public-recheck-result.json`.

El usuario eligió preparar una release para revisión **sin desplegar**. Se preparó la candidata local **ace83113522048905988146e6df774623f187124**, basada en main `7f5ff099`, con actualizaciones mínimas de dos dependencias de compilación. Propuesta en `../ML16-release-review/RELEASE-PROPOSAL.md`, código y artefactos en esa carpeta. Pasa inventario de producción, 119 unitarias y 3 pruebas PWA locales; sigue pendiente CI del nuevo commit, verificación Spark remota actual y aprobación separada. Esta preparación no convierte el caso en PASS ni crea una release publicada.

Producción sigue en `9006459c54893de65f967439006c70c2446d05d5`, misma revisión observada en la caché de la app instalada. La revisión publicada declara dirty=false y build del 23/10/2026. No hay transición de versión que ejecutar en este momento. Los PASS de OAuth demo, offline, actualización local y consulta de actualización pública permanecen vigentes.

## Ensayo preparado para una segunda release aprobada

1. Antes de publicar, registrar la revisión activa/cacheada de la app instalada y una pestaña Safari del mismo origen. Mantener un formulario con texto sintético sin enviar, sin datos personales.
2. Obtener el identificador exacto de una release diferente ya aprobada y publicada por su responsable. La publicación es una acción separada; este plan no autoriza deploy, rollback ni cambios de Firebase remoto.
3. En Safari nativo, solicitar la comprobación de actualización y guardar: revisión pública nueva, worker activo anterior, worker waiting y aviso visible. Comprobar que el formulario conserva su texto y no se activa el worker antes de cerrar los clientes.
4. Cerrar un cliente, verificar que la actualización sigue esperando si queda otro. Cerrar todos los clientes del origen, incluida la app instalada.
5. Reabrir la app y la pestaña. Verificar worker activo nuevo, ausencia de waiting y correspondencia con la nueva revisión pública. Revisar consola y recursos de esa apertura; no declarar PASS solo por ver el login.
6. Guardar antes/después, fecha, Safari/macOS y límites. Si no aparece worker nuevo o las revisiones no cambian, mantener BLOCKED o registrar FAIL según el comportamiento observado.

No se selecciona automáticamente el candidato local `6712945` como nueva release: no se ha comprobado que sea el objetivo aprobado de producción ni que coincida con main actual. No se crea una publicación vacía para forzar el ensayo.

Decisión necesaria: usar una próxima release ya aprobada, preparar por separado una propuesta de release para revisión, o cerrar la validación actual con este único bloqueo documentado. Ninguna opción requiere repetir los ensayos que ya tienen evidencia suficiente.

## Estado posterior: publicación autorizada

El 24/10/2026 el usuario autorizó y se publicó 0c871ab exclusivamente en hosting:app, a las 23:04:26 Europe/Madrid. El hook original gcloud pasó y las reglas efectivas permanecieron sin cambios. El estado histórico de preparación anterior queda superado por PUBLICACION-Y-VALIDACION.md. Hay PASS de detección waiting, texto conservado y apertura posterior de versión nueva; FAIL observado de aviso visual y BLOCKED del ensayo estricto con dos clientes controlados (la primera pestaña tenía controller:null). No hay PASS global de ML-16 ni fusión de PR.

Actualización del seguimiento: la revisión local **0bb93e755d76fc5cd92f54978e732c5924ba27e7** corrige el aviso en pestañas sin controller y evita avisos falsos durante instalación inicial. PASS local en Safari nativo: dos clientes controlados, waiting al cerrar uno y activación al salir del último; también aviso en cliente sin controlar. 119 unitarias, 4 PWA y builds/inventarios aprobados. No publicada, sin CI remoto de esta revisión. Producción sigue en 0c871ab y el requisito estricto entre releases públicas continúa pendiente. Detalle en ../ML16-release-review/SEGUIMIENTO-AVISO-PWA.md.

## Actualización vigente — 25/10/2026

Publicada con autorización la revisión **0bb93e755d76fc5cd92f54978e732c5924ba27e7**, únicamente en hosting:app, a las 00:19 Europe/Madrid. **PASS del caso pendiente entre releases públicas en Safari real**: ambas pestañas controladas antes de publicar, worker anterior retenido y nuevo waiting, aviso visible y texto conservado; cerrar una mantiene waiting, cerrar la última y reabrir carga la nueva revisión. Spark y reglas comprobados, sin cambios de reglas ni merge. El estado histórico BLOCKED de ese caso queda superado. No equivale a una revalidación integral de todas las funciones en 0bb93e7; CI remoto y flujos autenticados/offline de esta revisión no se repitieron. Informe vigente: ../ML16-release-review/CIERRE-ACTUALIZACION-PUBLICA.md.
