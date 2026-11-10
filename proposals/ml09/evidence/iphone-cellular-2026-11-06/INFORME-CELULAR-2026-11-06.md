# ML-09 · ensayo celular observado · 06/11/2026

**Conexión celular guiada, pérdida real de red, escritura pendiente, recuperación y archivo exportado de 500 obras verificados con el alcance descrito debajo. ML-09 permanece abierta.** Se conserva la incidencia de cierre de la cuenta antes de exportar; su causa no está determinada. No se fusiona ni despliega.

## Identidad y entorno

- Aplicación: `28d876d394dc3e5bf458303abd181f10ecb33b3b`, checkout limpio antes y después. El candidato antiguo `6712945` no se arrancó.
- Teléfono: iPhone 11 según la declaración inicial. **iOS 27.0.1 confirmado por el usuario durante esta sesión**; el ensayo actual no se atribuye a la versión inicial 26.3.1.
- Navegador del ensayo físico: Safari. UA conservado en los JSON: Version/27.0.1, Mobile Safari. El intento anterior con CriOS se registra separadamente y no certifica Safari.
- Preflight: Safari 18.6 en macOS 15.7.9, medido por SafariDriver.
- Backend: Auth y Firestore de `demo-mangalist`, solo en loopback. Cuenta y 500 obras sintéticas exclusivas de esta ejecución. Sin datos reales, cambios en Firebase remoto, billing ni servicios de pago.
- Transporte: Cloudflare Quick Tunnel autorizado por el usuario, cookie de acceso protegida y plazo absoluto de 45 minutos. La pasarela solicita respuestas finitas de WebChannel Listen (`CI=1`), conserva las escrituras y no modifica el SDK, el reloj ni los archivos del candidato. No representa una conexión directa del cliente a Firestore de producción.

## Comprobaciones

| Caso                                | Resultado observado                                                                                                                                                                                                                                                                                                                        | Evidencia                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Acceso celular y biblioteca         | El usuario confirmó Wi-Fi apagado durante la prueba. Safari del teléfono recibió 500 IDs únicos, fromCache=false, sin pendientes ni error, a través del HTTPS público. La ruta por SIM se acredita por esa observación física del usuario, no por una traza del operador.                                                                  | [^evidencia-bruta], [^evidencia-bruta], telemetría   |
| Pérdida real de conectividad        | Se indicó activar modo avión y mantener Wi-Fi apagado, conservando la pestaña. Evento offline nativo, online=false y fallos de la sonda de transporte, sin deshabilitar el SDK mediante instrumental. Las muestras offline llegaron en cola después de reconectar.                                                                         | [^evidencia-bruta], telemetría                       |
| Escritura pendiente                 | Favorito visible true en el teléfono, pending=true, fromCache=true y pendingOperations=1. El emulador seguía con favorito false, capítulo 1 y 500 documentos.                                                                                                                                                                              | [^evidencia-bruta], [^evidencia-bruta]               |
| Error al vencer el plazo            | A aproximadamente un minuto del evento offline apareció el error de confirmación de biblioteca. El usuario lo comunicó junto con el aviso de cambios pendientes. Los estados de error se conservan.                                                                                                                                        | [^evidencia-bruta], [^evidencia-bruta]               |
| Cambio concurrente                  | Mientras el usuario mantenía el corte, se confirmó capítulo 2 en el emulador, conservando favorito false y 500 IDs únicos.                                                                                                                                                                                                                 | [^evidencia-bruta]                                   |
| Recuperación                        | Tras restablecer datos móviles y seguir la indicación de un Reintentar, Safari confirmó 500 IDs únicos, capítulo 2, favorito true, búsqueda `ML09 Celular 0000`, fromCache=false, error=null y cero pendientes. El emulador coincidió. El usuario confirmó los resultados y Wi-Fi apagado. El número exacto de clics no fue instrumentado. | [^evidencia-bruta], [^evidencia-bruta]               |
| Estabilidad                         | Más de 62 segundos observados de estado recuperado confirmado antes de la incidencia posterior de cuenta. Es muestreo pasivo; no latencia exacta ni garantía permanente.                                                                                                                                                                   | [^evidencia-bruta]                                   |
| Exportación por interfaz del iPhone | Safari generó un JSON v2 verificado con el servidor, sin escrituras pendientes. El archivo entregado por el usuario tiene exactamente los mismos bytes que el Blob capturado en el teléfono.                                                                                                                                               | [^evidencia-bruta], [^evidencia-bruta]               |
| Integridad de las 500 obras         | 500 registros, 500 IDs únicos y comparación estricta de todos sus campos frente a la instantánea del emulador. Capítulo 2 y favorito true conservados. Copias parcial y alterada rechazadas por los controles negativos.                                                                                                                   | [^evidencia-bruta], [^evidencia-bruta]               |
| Guardado y entrega                  | El usuario entregó el JSON solicitado después de la indicación de guardarlo en Archivos. No se inspeccionó independientemente la interfaz de Archivos ni se atribuye un mecanismo concreto de transferencia. La coincidencia de bytes vincula el archivo entregado al exportado por Safari del iPhone.                                     | Archivo señalado por el usuario y [^evidencia-bruta] |
| Limpieza                            | Túnel, controlador y servicios demo detenidos antes de las 15:36:07 Europe/Madrid. Proceso cloudflared ausente y URL pública responde 530, sin aplicación disponible. Puertos de Auth/Firestore/aplicación cerrados.                                                                                                                       | [^evidencia-bruta], registros de ciclo de vida       |

## Cronología principal

Horas de Madrid (Europe/Madrid); se conservan los originales UTC en los JSON.

- 15:17:31.258: evento offline en el teléfono.
- 15:17:55.295: primera muestra de favorito pendiente conservada.
- 15:18:31.368: primera muestra del error de confirmación de un minuto.
- 15:19:47: servidor aún con capítulo 1 y favorito false.
- 15:20:07.344: cambio concurrente a capítulo 2 confirmado en el emulador; favorito aún false.
- 15:20:45.616: primera muestra recibida del estado recuperado con capítulo 2 y favorito true. No se interpreta como latencia exacta: la telemetría offline estaba en cola y el muestreo es periódico.
- Antes de exportar, el usuario informó de que aparecía el formulario de inicio de sesión. Se registró la incidencia y se indicó recargar después de haber confirmado la escritura en el servidor.
- 15:27:58.584: exportación comprobada por el servidor según sus metadatos.
- 15:28:03.381: recepción del evento de exportación con su SHA-256 desde Safari del teléfono, tras volver a entrar en la misma cuenta demo.
- 15:30:36: comparación íntegra del archivo entregado y solicitud de cierre anticipado del laboratorio.
- 15:31:50: cierre comprobado: proceso del túnel ausente y aplicación pública no disponible.

## Archivo recibido

[^evidencia-bruta], 220672 bytes.

SHA-256: `0003cf1772dda9212c964bc856f00c9844d6b26f9ea3c2ddd5166c2ccaf485b8`.

La copia preservada está en [^evidencia-bruta]. El archivo original señalado por el usuario en Descargas no se modifica.

## Incidencias conservadas y límites

1. La escucha continua por el túnel no confirmó las 500 obras antes del minuto, aunque la cadena local funcionó. Se conservan los intentos fallidos y el diagnóstico HTTP. La adaptación de backchannel finito pasó después con 500 IDs únicos; no se convierte el intento original en un pase.
2. La primera entrada del teléfono fue consumida por Chrome. Hubo respuestas 403 y una descarga de la respuesta sin Content-Type explícito al intentar abrir en Safari. Se corrigió la presentación inline y se conservaron esos registros.
3. La activación por GET podía consumir la clave sin que se cargase la aplicación. Se sustituyó por presentación GET y canje POST mediante un botón. El primer formulario también fue rechazado en Safari Mac; la presentación usa ahora Referrer-Policy same-origin, manteniendo el rechazo de Origin null o ajenos. El flujo completo se volvió a verificar en Safari antes de entregarlo al teléfono. Pasarela final: 19 pruebas dirigidas aprobadas. Supervisor: dos pruebas de cierre aprobadas, además de los cierres observados.
4. **Cierre de cuenta antes de exportar:** confirmado por el usuario al mostrar el formulario de login. No fue el cierre del túnel ni el vencimiento de su ventana. No hay evidencia suficiente para atribuirlo a una acción del usuario o a un defecto concreto del candidato. Se recargó y volvió a entrar en la cuenta demo para exportar. No se afirma un flujo continuo sin reinicio de sesión hasta la exportación.
5. La sonda podía seguir enviando su último estado cuando auth.currentUser quedaba null. Se conservó expresamente esa limitación: una recepción reciente con clientAt antiguo no demuestra autenticación ni estabilidad actuales. La estabilidad comunicada usa evidencia anterior a esa situación, y la exportación posterior se vincula a otro clientId de la recarga y a su huella de bytes.
6. No se prueba suspensión completa del sistema, capacidad global de Firebase, reinicio real de cuotas, consumo agregado ni otras redes/operadores. El emulador y la pasarela son parte explícita del alcance. No se alteró el reloj ni se provocó agotamiento de cuotas.

La aceptación general de ML-09 y la resolución de sus incidencias siguen pendientes. Este informe registra el ensayo solicitado y sus límites; no autoriza ni realiza fusión, despliegue o cambios remotos.

[^evidencia-bruta]: La evidencia bruta se conserva localmente por el titular; su integridad se puede verificar con el SHA-256 del paquete. SHA-256: `11ab9bb01844ba99222e7b510871749adbc9570db0f88967de10b217d7688d57`.
