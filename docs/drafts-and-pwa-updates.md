# Borradores de pestaña y actualización PWA

Continuación H6–H7 sobre `a72645d`, sin nuevos servicios ni cambios remotos. Solo Spark.

## Recuperación opcional de formularios

Añadir y editar obra ofrecen «Conservar borrador en esta pestaña», desactivado inicialmente.
No se guardan formularios en disco sin esa elección. Se usa `sessionStorage`, separado por UID
actual y formulario (`new` o `edit:<id>`). El nuevo formulario debe recuperarse expresamente;
no sobrescribe la versión sincronizada automáticamente. Una recuperación conserva la base
original de la edición para que las transacciones sigan detectando conflictos reales.

Se conservan solo los campos editables, incluida la base original, sin credenciales, tokens,
metadatos de documentos ni archivos de importación. Límite de diez formularios por pestaña y
80 000 unidades UTF-16 por entrada; esquema, tipos y tamaños se validan antes de recuperar.
Los borradores caducan a las 24 horas de su último cambio conservado. La caducidad se comprueba
al leer/recuperar y se depuran las entradas caducadas al escribir: no hay un proceso que borre
datos mientras el navegador permanece cerrado. Si se alcanza un límite o el navegador deniega
el almacenamiento, se desactiva la conservación y se muestra un error, sin perder el formulario
abierto ni expulsar borradores válidos silenciosamente.

Guardar correctamente en la biblioteca elimina el borrador de ese formulario. Desactivar la
casilla elimina su copia local y mantiene los campos abiertos. «Descartar borrador» elimina una
copia ofrecida para recuperación; «Cargar versión actual» elimina también la copia anterior,
tras la confirmación existente. Los errores de guardado y conflictos conservan el borrador.
Los controles del formulario se bloquean mientras se está guardando para evitar ediciones
nuevas que no formen parte de la solicitud en curso. Un cambio de cuenta durante la consulta
de duplicados cancela el guardado posterior; no migra el formulario a la cuenta nueva.

Cerrar sesión, cambiar una sesión ya identificada o completar el borrado de cuenta limpia
los borradores de esta pestaña, sin tocar datos ajenos a esta función. Si el navegador impide
el acceso, no se bloquea el cierre de sesión: puede ser necesario borrar los datos del sitio
manualmente. No se puede limpiar desde una pestaña cerrada ni desde un equipo remoto.

Esta opción es ayuda ante recargas accidentales, no copia de seguridad ni cifrado adicional.
El propio sitio, extensiones con permisos, una vulnerabilidad XSS o alguien con acceso al perfil
podrían leerla; la UI advierte sobre equipos compartidos. No se activa persistencia de Firestore
en disco ni hay escrituras remotas por conservar/recuperar un borrador. Los navegadores pueden
restaurar o copiar sesiones y el usuario puede borrar datos: no se garantiza recuperación al
cerrar una pestaña, ventana, navegador o proceso. Véase el alcance de
[sessionStorage en MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage).

No se recuperan diálogos de capítulo, selecciones de importación, contraseñas ni cualquier otro
formulario. Cancelar o navegar no elimina una copia elegida por el usuario; volver al mismo
formulario permite recuperarla dentro de los límites anteriores. Sin activar la casilla, salir
puede perder la edición. No se añade guardado automático en Firestore ni promesa de trabajo
en segundo plano cuando desaparece el cliente.

## Una actualización espera a que termine el usuario

Quasar GenerateSW activaba por defecto `skipWaiting` y `clientsClaim`. Ambos se fijan a `false`.
El registro avisa cuando hay una versión en espera, incluso si ya esperaba antes de abrir la
pestaña. Los layouts de acceso y de biblioteca muestran el aviso. No se envía `SKIP_WAITING`,
no se recarga ante `controllerchange`, no hay temporizador de sondeo, cuenta atrás ni botón que
active una versión sobre otras pestañas. La plantilla InjectManifest, actualmente sin uso,
tampoco fuerza activación.

El aviso pide guardar formularios en la biblioteca, terminar importaciones y otras operaciones
pendientes, cerrar **todas** las pestañas/ventanas y la app instalada, y volver a abrirla. Hay que
guardar antes: cerrar una pestaña puede perder su borrador y las operaciones pendientes no son
guardados confirmados. Una recarga corriente puede seguir usando la versión anterior si quedan
clientes abiertos. Se utiliza el ciclo de vida estándar, descrito por
[Workbox](https://developer.chrome.com/docs/workbox/handling-service-worker-updates).

Esto reduce interrupciones provocadas por la aplicación; no garantiza preservación ante cierre,
fallo del sistema, herramientas de desarrollo que fuercen activación ni cambios futuros en otro
cliente. El cache de recursos estáticos no convierte una biblioteca en una copia offline completa.
No se añaden cachés de respuestas Firebase ni colas de escrituras de fondo.

## Evidencia automática

- Regresiones de aislamiento por cuenta/formulario, consentimiento y recuperación explícitos,
  caducidad, límites, datos corruptos, almacenamiento denegado, lista de campos y conflictos
  después de recuperar la base original. Cambio de cuenta durante duplicados cancela guardado.
- Chromium con Auth/Firestore de demostración: escribir sin persistir, activar, recargar,
  recuperar, guardar y comprobar limpieza; crear otro borrador y comprobar cierre de sesión.
- `npm run test:pwa`, después de compilar PWA con configuración demo: servidor HTTP local y
  Chromium reales con dos revisiones del worker compilado. Comprueba dos pestañas, aviso nuevo
  y ya pendiente tras recarga, texto sin guardar intacto, ningún cambio de controlador forzado,
  versión antigua activa mientras queda otra pestaña y versión nueva al cerrarlas y reabrir.
  La sonda de versión se añade solo a la respuesta del servidor de pruebas; no modifica el build.
  La prueba rechaza builds sin ID demo y bloquea peticiones externas del navegador.

CI compila SPA/PWA demo y añade esa prueba de ciclo de vida. Siguen pendientes Safari, Firefox,
iOS/Android y aceptación real de instalación/actualización en dispositivos autorizados. No se
ha publicado una versión ni cambiado producción para comprobarlo.
