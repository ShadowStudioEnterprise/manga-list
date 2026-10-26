# ML-16 — ampliación de CI y Safari sobre el contenido publicado

25/10/2026, Europe/Madrid. Producción sigue en **0bb93e755d76fc5cd92f54978e732c5924ba27e7**. Esta ampliación no realiza otro despliegue, merge ni cambios remotos en Firebase.

## Identidad y revisión en GitHub

[PR #23 en borrador](https://github.com/ShadowStudioEnterprise/manga-list/pull/23), apilada sobre la rama de #22, sin fusionar ninguna. Git local no tiene credenciales de push. El conector GitHub creó un commit equivalente de contenido, **2484547fff21dcce025e45b01041997235e42533**. Su árbol Git y el del SHA publicado son exactamente **504cf2d953d4ed2062e92889ceab682b564dca01**, sin diferencias de archivos rastreados. El commit temporal de integración del PR es **d62fcec3cb7f9fafc279f7fd73f3761d4872ff85**, con el mismo árbol. Se recuperaron y compararon los objetos con Git. `ci-followup-evidence/tree-identity.json` documenta la comparación.

Por tanto, CI remoto cubre **el contenido idéntico**. No se afirma que GitHub haya ejecutado el SHA publicado 0bb93e7, ni que los builds con sellos distintos sean binariamente idénticos. La fuente local sigue limpia en 0bb93e7; la rama remota tiene otro SHA. El registro de Hosting y los hashes publicados siguen siendo los del cierre anterior.

CI de rama: [40139276638](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40139276638). CI de PR: [40139296051](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40139296051). **Ambas ejecuciones PASS.** Cada una aprueba **119 unitarias, 26 Firestore, 2 borrado interrumpido, 45 E2E y 4 PWA**, además de auditorías, formato, documentación/diagramas, landing, compilaciones e inventarios. E2E: 11,9 minutos en rama y 9,8 en PR. Los builds reales de rama identifican 2484547 y los del PR d62fcec3; todos son demo y limpios. Los cuatro ZIP originales se descargaron, pasaron integridad ZIP y coinciden byte por byte con los digests SHA-256 de GitHub. Logs completos, metadatos sin URLs temporales y sellos en ci-followup-evidence/ci-summary.json.

## Safari real: nueva cobertura de 0bb93e7

Safari **18.6 (20621.3.11.11.3)**, macOS **15.7.9 (24G830)**. SPA de desarrollo de la revisión publicada, árbol limpio, en **http://127.0.0.1:9598**, proyecto **demo-mangalist**. Esto no es la PWA estática de producción ni Playwright WebKit. El código impide emuladores fuera de modo dev/proyecto demo.

Firestore ya estaba funcionando en 127.0.0.1:8188; se conservó su proceso y contenido. Auth no estaba disponible en 9199 y se inició solo ese emulador. No se recargaron ni se alteraron reglas del emulador Firestore preexistente, ni se certificó su hash por separado; los ensayos de reglas de CI montan las fuentes del árbol indicado. El diagnóstico nativo confirma proyecto demo-mangalist, Firestore 127.0.0.1:8188 y Auth 127.0.0.1:9199. Se creó exclusivamente una identidad sintética nueva @example.invalid y dos obras ficticias.

| Prueba nativa                                     | Resultado     | Evidencia / alcance                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Registro y biblioteca vacía                       | PASS          | native-created.txt; cuenta creada por formulario contra Auth emulado, biblioteca vacía confirmada                                                                                                                                                                                    |
| Crear obra y editar progreso                      | PASS          | native-work-saved.txt; obra ficticia capítulo 5, cambio posterior 6                                                                                                                                                                                                                  |
| Sesión compartida y sincronización entre pestañas | PASS          | native-tabs-before.txt y native-tabs-after.txt/png; segunda pestaña autenticada recibe capítulo 5→6 sin recargar                                                                                                                                                                     |
| Exportar JSON real                                | PASS          | native-export.json; descarga Safari de 734 bytes, formatVersion:2, verification.source:server, hasPendingWrites:false, capítulo 6. Solo se leyó la descarga recién identificada de este ensayo                                                                                       |
| Previsualizar e importar JSON                     | PASS          | native-import-fixture.json, native-import-preview.txt y native-import-finished.txt/png; una fila ficticia nueva, cero duplicados/errores, posterior total 2 con confirmación del servidor                                                                                            |
| Importación recibida en otra pestaña              | PASS          | native-import-received-other-tab.txt; ambas obras y capítulos 6/9 sin recargar                                                                                                                                                                                                       |
| Desconexión del SDK y escritura pendiente         | PASS limitado | native-sdk-offline-before.txt y native-offline-pending.txt/png; solo disableNetwork del SDK del emulador, sin cortar la red del Mac. Aviso de datos locales y luego de cambios pendientes; favorito local true                                                                       |
| Reconexión y confirmación de servidor             | PASS          | native-sdk-recovery.txt/png: enableNetwork, waitForPendingWrites y consulta acotada desde servidor; favorito false→true, pending:false y fromCache:false, UI vuelve a instantánea confirmada                                                                                         |
| Identificación de revisión autenticada            | PASS          | native-version-settings.txt, Ajustes muestra 0bb93e755d76                                                                                                                                                                                                                            |
| Responsive de Ajustes autenticados                | PASS limitado | native-responsive-320/768/1280.txt/png; modo responsive nativo, anchura indicada en toolbar y distribución inspeccionada. Navegación colapsada en tamaños pequeños, textos y botones visibles ajustados en el área observada. No dispositivo iOS ni auditoría de todas las pantallas |
| Logout y login por correo                         | PASS          | native-demo-signout.txt y native-login-again.txt; tras entrar de nuevo se reciben las 2 obras, capítulos 6/9 y favorito 1, confirmados por servidor                                                                                                                                  |
| Salida final                                      | PASS          | native-demo-final-signout.txt; no se guardaron contraseñas en Safari y se cerró sesión sintética                                                                                                                                                                                     |

## Incidencias del instrumental y límites

- Con HMR normal, Vite conecta y no reproduce el anterior fallo ws.send del laboratorio sin HMR. Esto no es una corrección de producto ni una auditoría exhaustiva de consola.
- Safari mostró el aviso previsto de pestaña sincronizadora suspendida/no respondiente al mantener otra pestaña en segundo plano. Se cerró ese cliente y la pestaña restante volvió a recibir la instantánea confirmada. No se midió exclusión exacta de listeners ni temporización en suspensión prolongada.
- Los import() evaluados desde el inspector dieron «The string did not match the expected pattern». Se utilizó un script module diagnóstico **solo en la página local demo**, importando los mismos módulos ya cargados; se verificó el destino antes de desconectar el SDK. No se alteró código de producción ni se instrumentó su worker.
- Una primera consulta diagnóstica sin limit fue rechazada por las reglas del emulador. Se corrigió el diagnóstico a limit(10), sin modificar ni rebajar reglas. El error no provino de la consulta normal de la biblioteca. No se declara consola limpia tras estas evaluaciones.
- El selector de archivos conserva avisos de iCloud; el fixture nuevo se seleccionó navegando por el selector nativo y se importó. Los atajos de ruta no funcionaron en este recorrido; no se declara carga del archivo hasta la previsualización real.
- La desconexión fue del SDK Firestore, **no un corte físico** ni una reapertura offline de la PWA instalada. El OAuth Google remoto, el arranque frío offline instalado y otras pruebas históricas conservan sus versiones y límites; no se atribuyen a esta ejecución.

Se cerró sesión, se restauró el SDK y el modo responsive, se dejaron dos obras sintéticas en Firestore local y se detuvieron únicamente los servicios creados aquí. El Firestore preexistente seguía respondiendo HTTP 200. Al detener el emulador Auth recién iniciado, su cuenta en memoria no se presenta como una identidad persistente. Credenciales sintéticas y log privado de Auth están excluidos del paquete. No se tocaron bibliotecas personales.

## Estado final

El ensayo público de actualización continúa PASS conforme a CIERRE-ACTUALIZACION-PUBLICA.md. Esta ampliación añade pruebas nativas explícitas de la fuente 0bb93e7 con emuladores y CI del árbol idéntico. No convierte las pruebas en ejecución de todas las funciones en producción, ni acredita otro corte físico o un siguiente aviso público desde una pestaña 0bb93e7 sin controller. La PR #23 sigue en borrador; no se solicita ni ejecuta fusión o publicación adicional.

## Matriz de cierre por alcance

| Alcance                                                                   | Resultado vigente                                                                                                                   |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Actualización entre releases públicas Safari 0c871ab → 0bb93e7            | PASS, informe de cierre previo                                                                                                      |
| Flujos nativos de fuente 0bb93e7 contra emuladores                        | PASS con límites descritos: autenticación por correo, creación, import/export, dos pestañas, offline de SDK y responsive de Ajustes |
| CI remoto del mismo contenido                                             | PASS, árbol 504cf2d en rama 2484547 y merge temporal d62fcec3                                                                       |
| CI del SHA publicado literal 0bb93e7                                      | No ejecutado; la identidad del árbol no cambia el SHA ejecutado                                                                     |
| OAuth Google remoto / arranque físico offline de la PWA instalada 0bb93e7 | No repetidos; el PASS histórico mantiene revisión 9006459 y límites guiados                                                         |

Entrega ampliada sin nuevo despliegue ni merge. Producción recomprobada en 0bb93e7 durante la consolidación. La evidencia no es autorización para fusionar #22/#23 o volver a publicar.

## Ampliación posterior del 25/10/2026

OAuth remoto y arranque físico offline de la PWA instalada 0bb93e7 se han repetido: PASS, con observación guiada de la pantalla offline y registro de proceso/red. Reconexión y salida demo PASS. La captura automática offline quedó BLOCKED por vencimiento de la ventana. Véase CIERRE-OAUTH-OFFLINE-INSTALADA.md y current-installed-evidence/summary.json; este resultado sustituye la fila anterior «No repetidos», sin ampliar el alcance de los demás ensayos.
