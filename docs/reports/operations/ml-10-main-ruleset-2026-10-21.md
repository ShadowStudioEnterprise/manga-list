# ML-10: propuesta de protección de main — 21/10/2026

Estado: **activado tras aprobación específica; verificación por lectura superada**.
Rama independiente desde main `36fe4f3bd46615a4e18983d506fb79d2337c768c`.
Este documento y su JSON no activan reglas al fusionarse. No autorizan fusión,
despliegue, cambios Firebase, datos reales, IAM ni facturación.

## Activación y comprobación posterior

El usuario aprobó específicamente la configuración propuesta después de la CI
correcta del candidato `e2de55edfe44e38c7a8322520ead0e73b60f0022`.
El [ruleset 25518766](https://github.com/ShadowStudioEnterprise/manga-list/rules/25518766)
se creó Active el 21/10/2026 a las **03:52 CEST**. La lectura posterior confirmó
las cuatro reglas efectivas en main, todos los parámetros de la propuesta, bypass
vacío y `current_user_can_bypass: never`. Main conservó `36fe4f3` durante la activación.
El JSON de propuesta se conserva **Disabled** para evitar futuras importaciones
activas por accidente; no es una copia del estado remoto actual.

La consulta GraphQL del PR #8 confirmó dos checks `verify` de GitHub Actions
(15368), ambos `COMPLETED/SUCCESS` e **`isRequired: true`**, cero hilos de revisión
y PR todavía en borrador. Runs: [PR 39527212406](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39527212406)
y [push 39527193600](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39527193600).
Esta evidencia corresponde a ese SHA, no a cambios documentales posteriores.

En la revisión de cierre de las **09:17 CEST**, main ya estaba en
`0148d5b8d7c06cd845be413cc1ecaccd4f354815`: el PR #7 ML-08 fue fusionado fuera
de este trabajo a las 09:13 CEST. Se volvió a comprobar el ruleset por API autenticada:
sigue Active, sin bypass y sin cambios de configuración desde su creación.
GitHub informa `protected: true`. La consulta pública omite la lista de bypass;
su ausencia en esa respuesta no equivale a una excepción configurada.

Se actualizó únicamente la rama de propuesta con el nuevo main para conservar
una base vigente y evitar que los checks del SHA anterior se presenten como
validación del candidato actualizado. El PR #8 permanece abierto en borrador;
esta continuación no fusiona ningún PR ni despliega.

La [evidencia resumida](../../measurements/ml10-main-ruleset-2026-10-21.json)
conserva configuración, SHAs y alcance de la verificación. No se hicieron pruebas
de push directo, force push o eliminación sobre main, ni se creó un hilo de
revisión de prueba o se pasó el PR a ready. No se ensayó desactivar el ruleset.
La recuperación y las pruebas activas de la última sección siguen documentadas,
sin declararse ejecutadas. La activación remota está completada; la documentación
versionada continúa pendiente de revisión y eventual fusión autorizada.

## Auditoría comprobada

Consulta inicial: 21/10/2026, 03:21 CEST (01:21 UTC). API REST de GitHub y
referencias Git actualizadas. La conversación anterior recuperada conserva los
«continua», pero las respuestas son referencias sin contenido; no prueba una
aprobación específica de una configuración. Esta sección conserva la evaluación
anterior a la aprobación posterior registrada arriba.

| Elemento                    | Evidencia                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repositorio                 | Público, propietario de tipo User: ShadowStudioEnterprise; no es una organización                                                                  |
| Rama predeterminada         | `main`, SHA `36fe4f3bd46615a4e18983d506fb79d2337c768c`, merge de #6 ML-07                                                                          |
| Protección clásica          | Consulta autenticada: 404 `Branch not protected`; rama informa `protected: false`                                                                  |
| Rulesets y reglas efectivas | `GET /repos/ShadowStudioEnterprise/manga-list/rulesets?includes_parents=true` y `/rules/branches/main`: listas vacías                              |
| Recuperación administrativa | Cuenta autenticada ShadowStudioEnterprise, `permissions.admin: true`; no se modificaron permisos                                                   |
| Revisores                   | Colaboradores: solo el propietario, rol admin. No hay revisor externo disponible acreditado                                                        |
| PR abiertos al iniciar      | Solo [#7 ML-08](https://github.com/ShadowStudioEnterprise/manga-list/pull/7), borrador, sin revisiones ni revisores solicitados                    |
| Candidato #7                | `b92e90f72d89f7ddb9ad7daec6bc478be0ded337`; ejecuciones push `39526473383` y PR `39526490600` en curso en esa consulta; no se certifica como verde |
| Workflow registrado         | Solo `CI`, ID `374894343`, activo, `.github/workflows/ci.yml`                                                                                      |
| CI de main                  | [Run 39520669373](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39520669373), push, SHA de main, `success`                     |
| Check exacto                | `verify`, GitHub Actions, App ID **15368**, job `118963460391`, `completed/success`                                                                |

### Alcance real de CI

En main, `CI` se dispara con `push`, `pull_request` y `workflow_dispatch`, sin
filtros de rutas/ramas. Tiene un único job `verify`, Ubuntu 24.04, límite 25 minutos,
permisos `contents: read`, acciones fijadas por SHA y checkout sin persistir credenciales.
La concurrencia cancela ejecuciones previas de la misma referencia, separando
push y PR por `github.ref`.

El job verde ejecutó control Spark sin credenciales, instalación con lockfiles,
auditoría de dependencias, formato/lint, documentación y enlaces, unitarias,
reglas Firestore en `demo-mangalist`, E2E con emuladores, builds SPA/PWA de demo,
consistencia de builds y ciclo PWA local. Conserva artefactos siete días. No hay
despliegue automático. El #7 añade pasos de modelo/payload ML-08 y contraste con
emulador, manteniendo el mismo nombre de job; estos cambios no están en main.

## Capacidades y restricciones del plan

Los [rulesets de rama](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
están disponibles en repositorios públicos con GitHub Free. No se necesita contratar
otro plan para esta propuesta. Si el repositorio pasa a privado, hay que reevaluar
la disponibilidad antes de confiar en su aplicación. La API autenticada no devolvió
`plan.name`: se verifica compatibilidad con Free, no el plan contratado.

Se propone un ruleset **del repositorio y de rama**. No se depende de reglas de
organización, push rulesets, merge queue ni políticas empresariales. La preparación
usa `Disabled`; no se presupone acceso a `Evaluate` o a paneles de planes superiores.
Los estados documentados para el flujo general son Active y Disabled.

## Configuración concreta propuesta

Plantilla local: `docs/operations/main-ruleset.proposed.json`.

| Campo en GitHub                                        | Valor                                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Nombre / target                                        | `ML-10 main baseline` / Branch                                                                       |
| Enforcement al preparar                                | **Disabled**; Active solo tras aprobación específica                                                 |
| Target branches                                        | Include by pattern: `main` (API: `refs/heads/main`); sin exclusiones ni comodines                    |
| Bypass list                                            | Vacía; también se aplican las reglas a administradores al operar sobre la rama                       |
| Restrict deletions                                     | Activado                                                                                             |
| Block force pushes                                     | Activado (`non_fast_forward`)                                                                        |
| Require a pull request before merging                  | Activado                                                                                             |
| Required approvals                                     | **0**                                                                                                |
| Require review from Code Owners                        | Desactivado                                                                                          |
| Dismiss stale approvals / approval of most recent push | Desactivados                                                                                         |
| Require conversation resolution before merging         | Activado                                                                                             |
| Require status checks to pass                          | Activado: contexto exacto **`verify`**, origen **GitHub Actions / 15368**                            |
| Require branches to be up to date                      | Activado (`strict_required_status_checks_policy: true`)                                              |
| Otros controles                                        | No activar Restrict updates/creations, firmas, historia lineal, deployments ni workflows adicionales |

El [PR obligatorio admite cero aprobaciones](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
Permite que el propietario use PR y CI sin quedar esperando su propia aprobación.
No equivale a revisión humana independiente. Si se incorpora otro revisor, aumentar
a una aprobación requiere una decisión posterior. Exigir actualizaciones de rama
cuesta nuevas ejecuciones y evita aceptar resultados anteriores a cambios de base.

## Activación exacta, después de aprobación

1. Repetir las lecturas de auditoría de la tabla: main, PR abiertos, workflows,
   rulesets, reglas efectivas y protección clásica. Confirmar acceso admin y un
   `verify` exitoso en los últimos siete días de GitHub Actions sobre el candidato actual. La CI de otro SHA
   no sustituye la del PR. Revisar si #7 sigue en curso o ha terminado.
2. Guardar un registro local con hora, SHA de main y JSON/export de toda protección
   previa. Si ahora existen otras reglas, reconciliarlas: las protecciones se
   acumulan y prevalece la restricción más fuerte. No eliminarlas automáticamente.
3. Abrir [Settings → Rules → Rulesets](https://github.com/ShadowStudioEnterprise/manga-list/settings/rules).
   New ruleset → Import a ruleset; elegir el JSON propuesto, o New branch ruleset
   y trasladar la tabla. Revisar que enforcement siga **Disabled**, target solo
   main y bypass vacío. Guardar Disabled también es un cambio remoto: no hacerlo
   durante esta preparación sin aprobación específica.
4. Revisar el check seleccionado: la interfaz puede mostrar `CI / verify`, pero
   el contexto API comprobado es `verify`. Seleccionar GitHub Actions como origen.
   Si la interfaz no permite fijarlo, detener la activación y revisar el JSON/API;
   no cambiar silenciosamente a Any source. El JSON contiene `integration_id: 15368`.
5. Registrar el ID/URL del ruleset y comprobar que la cuenta conserva acceso a
   editarlo. Repasar cero aprobaciones y conversaciones resueltas. Con la aprobación
   específica vigente, cambiar Disabled → **Active**, Save changes. El efecto es
   inmediato, incluidos PR ya abiertos contra main.
6. Leer `/rulesets/{id}` y `/rules/branches/main`, y conservar respuesta, hora y
   captura. Deben aparecer PR, checks, deletion y non_fast_forward para main.
   Comprobar el origen, contexto, strict, cero aprobaciones y conversaciones en
   el detalle del ruleset. No basta que la pantalla diga Active.

La [guía de creación e importación](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
describe los controles de interfaz; su ubicación puede variar con la versión de GitHub.

## Riesgos y recuperación

- Check mal escrito, workflow renombrado, omitido por filtros/condiciones o sin
  ejecución tras actualizar base: el PR puede quedar esperando indefinidamente.
  Conservar el job estable, revisar SHA y volver a ejecutar CI tras corregirlo.
  Para validar un PR, usar ejecuciones push/pull_request; un workflow_dispatch
  manual puede no satisfacer el check requerido en el PR. Si hay checks en el
  commit de merge de prueba, comprobar ese commit además del head.
- Un `verify` de otra workflow de GitHub Actions podría compartir nombre. El
  origen protege frente a otras Apps, pero no garantiza el contenido del workflow.
  Revisar cambios de `.github/workflows/ci.yml`; cero aprobaciones no lo impide.
- Caídas de Actions, auditorías de dependencias sobrevenidas, cancelaciones y
  pruebas intermitentes bloquean aunque la aplicación no cambie. El run de main
  tardó unos 15 minutos; actualizar base puede repetir ese coste.
- Conversaciones abiertas, borrador o conflictos bloquean por razones distintas.
  Resolver cada conversación de revisión y volver a comprobar; no exigir que
  desaparezcan todos los comentarios ordinarios de la discusión.
- GitHub acepta algunas conclusiones `neutral`/`skipped` como checks válidos; el
  ruleset no expresa «solo success». La política operativa exige `completed/success`
  y pasos relevantes ejecutados. El workflow actual no omite el job con condiciones.
- Sin bypass permanente se reduce la excepción habitual, pero hace falta conservar
  acceso a la cuenta administradora. Un ruleset no evita su propia edición por un
  administrador; tampoco recupera una cuenta perdida o un repositorio eliminado.

Recuperación de un bloqueo, con autorización específica para esa intervención:
Settings → Rules → Rulesets → `ML-10 main baseline` → Enforcement **Disabled** →
Save changes. Guardar antes la configuración y el motivo; no borrar la regla.
Corregir por PR, obtener `verify` exitoso, comparar con el export y reactivar tras
la autorización correspondiente. Si otro ruleset o protección clásica sigue
bloqueando, inspeccionarlo; desactivar este no los elimina. No hacer force push,
restablecer main, introducir bypass ni tocar facturación como salida de emergencia.

La [gestión de rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
permite desactivar sin borrar. Se ha confirmado el permiso admin mediante lectura;
no se ha ensayado la desactivación remota ni la recuperación de credenciales.

## Prueba posterior pendiente

1. Tras activar, usar un PR documental controlado contra main, sin auto-merge.
   Confirmar en su caja de merge que `verify` es obligatorio y que no pide revisor.
   Un borrador sigue bloqueado por ser borrador: para comprobar elegibilidad final
   deberá autorizarse pasarlo a ready; no fusionarlo como parte de esta prueba.
2. Observar bloqueo con CI pendiente y, después, `completed/success` en el SHA
   actual y ausencia de bloqueo por checks. Si cambia main, actualizar la rama y
   repetir. Puede utilizarse el PR ML-10 si su estado y permisos lo permiten.
3. Con un hilo de revisión de prueba autorizado, comprobar bloqueo por conversación
   pendiente y su desaparición al resolverla. No confundir discusión con review thread.
4. Verificar bloqueo de push directo, force push y eliminación leyendo reglas
   efectivas y ausencia de bypass. **No intentar escrituras destructivas sobre main**.
   Para ensayar rechazos reales hace falta una rama desechable y ruleset temporal
   con alcance exacto, aprobados aparte; no se afirma haber probado esos rechazos.
5. Registrar SHA, URL del PR/run, reglas efectivas y resultado; distinguir
   elegibilidad de fusión de fusión realizada. Mantener main y despliegues intactos.

La [documentación de checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
explica resultados aceptados y problemas de workflows omitidos. La protección
está aplicada y verificada por lectura; las pruebas activas y la recuperación
ensayada siguen pendientes, según el registro de activación de este informe.
