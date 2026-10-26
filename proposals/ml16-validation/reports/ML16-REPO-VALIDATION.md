# ML-16 — cierre de validación Safari, 25/10/2026

Safari nativo 18.6 (20621.3.11.11.3), macOS 15.7.9 (24G830), Europe/Madrid.
Revisión de aplicación ensayada: 0bb93e755d76fc5cd92f54978e732c5924ba27e7.
Árbol equivalente de la corrección remota: 504cf2d953d4ed2062e92889ceab682b564dca01.

| Ensayo                                         | Resultado y alcance                                                                                                                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actualización pública 0c871ab → 0bb93e7        | PASS: dos clientes controlados, aviso y formulario conservados; waiting hasta cerrar el último cliente y versión nueva al reabrir.                                                                                |
| OAuth Google remoto                            | PASS: PWA instalada de producción, SSO existente y cuenta demo autorizada confirmada por el usuario; biblioteca vacía y salida final. No cubre contraseña, MFA o recuperación.                                    |
| Arranque frío offline instalado                | PASS guiado: proceso ausente antes del corte, proceso nuevo durante offline y sonda pública fallida. Usuario observa biblioteca o aviso local.                                                                    |
| Reconexión sin cerrar app                      | PASS: mismo PID, conexión recuperada, HEAD 200 y biblioteca vacía con instantánea del servidor sin pendientes.                                                                                                    |
| Captura automática de pantalla durante corte   | BLOCKED: la ventana de captura terminó antes del ensayo. El renderizado offline se acredita por observación del usuario, no por captura automática.                                                               |
| Flujos Safari de fuente 0bb93e7 con emuladores | PASS: registro/login por correo, creación sintética, progreso compartido entre pestañas, exportación JSON v2 confirmada por servidor, importación y recepción en otra pestaña.                                    |
| Escritura offline con emuladores               | PASS limitado: desconexión del SDK, favorito pendiente y confirmación del servidor tras reconexión. No es escritura offline remota.                                                                               |
| Responsive                                     | PASS limitado: Ajustes autenticados en Safari a 320/768/1280; no dispositivo iOS ni auditoría de todas las pantallas.                                                                                             |
| Consola/red                                    | Cobertura parcial: observaciones del flujo y diagnósticos conservados; no se afirma ausencia universal de errores.                                                                                                |
| CI previo del contenido de aplicación          | PASS en rama 2484547 y merge temporal d62fcec3, árbol idéntico al publicado. Cada ejecución: 119 unitarias, 26 Firestore, 2 borrado interrumpido, 45 E2E y 4 PWA. No se ejecutó el SHA literal 0bb93e7 en GitHub. |

El registro UTC del corte empieza 2026-10-24T23:57:43.542Z; el proceso nuevo aparece aproximadamente a 23:58:12.104Z; reconexión a 2026-10-25T00:54:22.436Z. La biblioteca remota vacía no valida lectura offline de obras preexistentes. No se escribieron obras en producción.

La incidencia del aviso PWA en pestañas sin controller motivó la corrección; se exige active y waiting para evitar avisos falsos iniciales. Los errores HMR del laboratorio inicial no se reprodujeron con HMR normal y no se presentan como defecto de producción. Los errores de diagnósticos import()/consulta sin limit fueron propios del instrumental local. Se conservan límites por suspensión de pestañas, selección de archivos e iCloud.

Evidencias completas entregadas localmente al responsable, sin publicar cuentas ni credenciales:

- ML16-ampliacion-CI-Safari-2026-10-25.zip, SHA-256 7b6741913c20b05d198916167357097ba093a758d03dff7e411068c7da93c5ed.
- ML16-oauth-offline-instalada-2026-10-25.zip, SHA-256 8a6aa824a3d0a02fb7a6ee574f111e18da2a697e6f6491a3650e8fa22a1a9b5c.

[CI de rama](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40139276638) y [CI de PR](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40139296051).

El usuario autorizó posteriormente subir, fusionar y desplegar. La publicación se limita a Hosting de la aplicación y mantiene Spark; no incluye reglas, IAM, facturación ni datos. El resultado de esa operación se registra por separado y no convierte estas pruebas en ensayos del SHA de merge posterior.
