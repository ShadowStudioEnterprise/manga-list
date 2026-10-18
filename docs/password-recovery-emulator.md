# Recuperación de contraseña con credenciales emuladas

Continuación H1 sobre `14d65b4`. Se amplía la prueba local de recuperación; la aceptación
operativa en producción permanece pendiente. No cambia el código de Auth de la aplicación,
sus proveedores, plantillas de correo, dominios autorizados ni configuración remota.

## Recorrido comprobado

El mismo escenario se ejecuta en Chromium y Firefox, con cuenta nueva y obra sintética:

1. Registrar, guardar una obra y cerrar sesión mediante la interfaz.
2. Pedir recuperación con un correo inexistente y con el de la cuenta. Ambos muestran el
   mismo texto genérico. El emulador no genera un código para el correo inexistente.
3. Leer el código de esa cuenta desde la API administrativa local del emulador.
4. Confirmar que un código inválido es rechazado, aplicar el correcto y rechazar su reutilización
   para establecer otra contraseña distinta.
5. Volver al login: la contraseña anterior falla y la nueva permite entrar. La biblioteca y
   el capítulo original siguen presentes también después de recargar.

El paso de confirmación usa la API REST local, no una página propia de MangaList ni la
página de acción alojada por Firebase en producción. El [emulador de Auth](https://firebase.google.com/docs/emulator-suite/connect_auth#non-interactive_testing)
permite recuperar códigos fuera de banda para pruebas automatizadas; la
[API de confirmación](https://firebase.google.com/docs/reference/rest/auth#section-confirm-reset-password)
acepta el código y la nueva contraseña. No se requiere enviar un correo real.

## Aislamiento de la prueba

Las direcciones de administración y confirmación están fijadas a `127.0.0.1:9199`, al proyecto
`demo-mangalist` y a una clave ficticia. No se obtienen de `.env`, de la política del proyecto
real o de un enlace recibido. Las llamadas de la prueba no siguen redirecciones. El lanzador
y la configuración conservan las comprobaciones de emuladores; no se reutiliza un servidor
existente ni se introduce un cliente Admin para producción.

El navegador mantiene el bloqueo de peticiones externas. El primer ensayo Firefox completó
las aserciones funcionales, pero detectó un intento de sondeo WebChannel a la URL exacta
`https://www.google.com/images/cleardot.gif` con parámetros de comprobación. Esa petición
quedó bloqueada. El escenario aborta explícitamente ese sondeo y cuenta los intentos, como
la prueba de desconexión ya hacía; cualquier otra petición externa sigue fallando el test.
No se autoriza tráfico a Google para resolver el fallo.

Tras pasar las aserciones se guarda `password-recovery-summary.json`: resultados y número de
sondeos bloqueados, sin correos, contraseñas ni códigos. CI lo conserva siete días en la
evidencia de navegador. El emulador puede imprimir códigos sintéticos en su log y una traza
de fallo puede contener solicitudes de Auth; por eso esta suite no debe recibir cuentas o
credenciales reales. El resumen no es una firma ni sustituye el resultado completo de CI.

## Alcance pendiente

La suite pasa a 27 recorridos (15 Chromium y 12 Firefox). El texto genérico probado no
garantiza resistencia a enumeración: no se evalúan tiempos, respuestas observables de la
red, límites del proveedor ni la configuración de protección de correo en producción.

Tampoco se prueban entrega/spam, dominio y plantilla del correo, página alojada de cambio,
caducidad temporal real, OAuth Google, dispositivos reales, revocación de tokens ni cierre
inmediato de otras sesiones. La prueba cierra expresamente la sesión antes de recuperar;
no supone que el cambio termine sesiones existentes o complete un borrado abandonado.

H1 solo podrá cerrarse con la aceptación autorizada del candidato publicado, configuración
efectiva y cuentas sintéticas acordadas. Este ensayo no concede esa autorización. Spark
sigue siendo exclusivo, sin Blaze, facturación ni servicios adicionales. Los presupuestos
locales siguen sin garantizar protección global contra abuso o cuotas agotadas.

## Resultado local

El primer ensayo obtuvo Chromium correcto y Firefox con flujo correcto pero fallo del
control de aislamiento por el sondeo bloqueado. Identificada la URL en la traza y añadido
su aborto exacto y contabilizado, la repetición pasa 2/2. CI ejecuta los 27 escenarios junto
con regresiones, reglas, auditorías, compilaciones y ciclo PWA sobre el commit de esta revisión.
