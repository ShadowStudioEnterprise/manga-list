# ML-16 — estado vigente consolidado

25/10/2026, Europe/Madrid. Validación en Safari nativo **18.6 (20621.3.11.11.3)**, macOS **15.7.9 (24G830)**. Cierre del alcance ejecutado con las limitaciones indicadas. Los bloqueos históricos superados no son casos pendientes actuales.

Revisión publicada y ensayada: **0bb93e755d76fc5cd92f54978e732c5924ba27e7**. La matriz distingue producción de SPA local con emuladores. No se declara una auditoría integral de todos los estados o dispositivos.

| Caso                                  | Resultado     | Alcance / evidencia                                                                                                                                                         |
| ------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entorno, Safari real y apertura       | PASS          | Versión nativa y app instalada identificadas; environment.json y current-installed-evidence/installed-version-inspector.txt                                                 |
| Navegación, consola y red públicas    | PASS limitado | Observaciones históricas de login/recarga; no auditoría exhaustiva ni consola limpia de todos los flujos. INFORME.md y evidencias numeradas                                 |
| Responsive                            | PASS limitado | Login público histórico; Ajustes de fuente 0bb93e7 en SPA local demo a 320/768/1280. No dispositivo iOS. AMPLIACION-CI-Y-SAFARI.md                                          |
| Autenticación por correo y creación   | PASS          | Fuente 0bb93e7, emuladores loopback, identidad y obras sintéticas nuevas. Sin bibliotecas personales                                                                        |
| Múltiples pestañas                    | PASS          | Fuente 0bb93e7 demo: progreso e importación recibidos sin recarga. No mide exclusión exacta de listeners                                                                    |
| Exportar/importar JSON                | PASS          | Fuente 0bb93e7 demo: exportación v2 confirmada por servidor e importación de una fila ficticia; no importación remota                                                       |
| Escritura offline y recuperación      | PASS limitado | Fuente 0bb93e7 demo: desconexión del SDK, favorito pendiente, reconexión y confirmación del servidor. No escritura offline remota                                           |
| Instalación y reapertura PWA          | PASS          | App independiente instalada; revisión 0bb93e7 confirmada en inspector nativo                                                                                                |
| Actualización entre releases públicas | PASS          | 0c871ab → 0bb93e7: dos clientes controlados, aviso/formulario conservados, waiting hasta cerrar último cliente y nueva revisión al reabrir. CIERRE-ACTUALIZACION-PUBLICA.md |
| OAuth Google remoto                   | PASS          | PWA instalada 0bb93e7; SSO existente y demo confirmada por usuario, biblioteca vacía y salida final. CIERRE-OAUTH-OFFLINE-INSTALADA.md                                      |
| Arranque frío offline instalado       | PASS guiado   | Proceso ausente antes del corte; PID nuevo durante online=false y sonda pública fallida. Usuario observa biblioteca o aviso local. No captura automática offline            |
| Reconexión instalada                  | PASS          | Mismo PID, online y HTTP 200; biblioteca vacía con instantánea del servidor sin pendientes                                                                                  |
| Captura automática durante corte      | BLOCKED       | Ventana terminó antes del ensayo guiado. No se presenta como prueba ejecutada ni defecto de producto                                                                        |
| CI remoto de contenido idéntico       | PASS          | Rama 2484547 y merge temporal d62fcec3, árbol 504cf2d idéntico al publicado. Cada ejecución: 119 unitarias, 26 Firestore, 2 borrado interrumpido, 45 E2E, 4 PWA             |
| CI del SHA literal publicado 0bb93e7  | No ejecutado  | Los SHA de GitHub difieren aunque el árbol sea idéntico; no se atribuye al SHA publicado                                                                                    |

## Incidencias y límites conservados

El aviso PWA falló en el primer ensayo público con un cliente sin controller; la corrección posterior y sus regresiones están documentadas en SEGUIMIENTO-AVISO-PWA.md. El ciclo público estricto posterior pasó. Los errores HMR del laboratorio inicial no se reprodujeron con HMR normal; no son un fallo de producción demostrado. Los errores de diagnósticos import()/consulta sin limit del inspector local, los avisos por pestaña sincronizadora suspendida y los problemas de iCloud/disco conservan su detalle en AMPLIACION-CI-Y-SAFARI.md y el historial. No se afirma ausencia universal de incidencias.

La pantalla durante el corte físico está acreditada por el usuario y respaldada por registros de proceso/red; no por captura automática. La demo remota está vacía, de modo que no valida lectura de obras preexistentes offline. OAuth reutilizó SSO; no cubre contraseña/MFA/recuperación.

## Entrega y revisión

Informes en ../ML16-release-review/: CIERRE-ACTUALIZACION-PUBLICA.md, AMPLIACION-CI-Y-SAFARI.md y CIERRE-OAUTH-OFFLINE-INSTALADA.md. Evidencias con hashes en sus paquetes correspondientes. La sesión de MangaList demo se cerró; no se revocó la sesión Google ni se borró la cuenta.

PR #23 comprobada abierta, en borrador y sin fusionar, sobre la rama de #22. La descripción remota todavía conserva la frase anterior «OAuth ... no se repitieron»; el informe local posterior acredita la repetición. No se cambió la PR en esta consolidación. No hay autorización implícita para fusionar o publicar de nuevo.

No queda un ensayo funcional pendiente que exija otra release dentro del alcance descrito. Permanece la limitación de captura offline y cobertura parcial indicada. Los dos despliegues previos fueron autorizados por separado; esta consolidación solo modifica documentos locales. El estado anterior íntegro se conserva en ESTADO-ACTUAL-HISTORICO-PRE-CONSOLIDACION.md e INFORME.md.
