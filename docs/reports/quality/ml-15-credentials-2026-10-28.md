# ML-15: cambios de credenciales y vinculación para 1.0

28/10/2026, Europe/Madrid. Implementación para revisión; no desplegada.
El usuario confirmó incluir en 1.0 el cambio de email, el cambio de contraseña
desde ajustes y la vinculación email/Google. Amplía el alcance de
[la validación ML-15 anterior](ml-15-auth-2026-10-27.md); no modifica sus resultados
históricos ni declara cerrada ML-15.

## Comportamiento preparado

- Ajustes muestra los métodos vinculados y permite cambiar correo, cambiar
  contraseña, añadir contraseña a una cuenta Google y vincular Google a una
  cuenta de email/contraseña.
- Cada cambio confirma de nuevo la identidad: contraseña actual para cuentas
  con ese método; popup Google para cuentas que solo tienen Google. Cancelación,
  credenciales incorrectas, bloqueo del popup y fallo de red permiten reintentar.
- Cambiar correo utiliza `verifyBeforeUpdateEmail`: envía un enlace a la nueva
  dirección y conserva la actual hasta verificarlo. Al volver, «Actualizar datos
  de acceso» recarga los datos; si la sesión ha dejado de ser válida, se debe
  entrar de nuevo. No se guardan credenciales ni enlaces en borradores o ajustes.
- Cambiar contraseña utiliza `updatePassword` después de confirmar la actual.
  La recuperación por correo sigue disponible como alternativa.
- La vinculación utiliza `linkWithCredential` o `linkWithPopup` sobre el usuario
  actual. Conserva el UID y la ruta de biblioteca. Si la credencial pertenece a
  otra cuenta, informa del conflicto sin iniciar sesión en ella ni fusionar datos.
- Los formularios borran contraseñas al cancelar, terminar o fallar. Cambiar de
  UID cierra el formulario y limpia sus campos. El servicio rechaza operaciones
  concurrentes y comprueba que la identidad no haya cambiado durante la
  confirmación antes de enviar la mutación.

No se añade desvinculación de proveedores ni fusión de cuentas. La implementación
usa las APIs de Firebase ya disponibles: no cambia configuración, proveedores
remotos, reglas, IAM o facturación. Firebase Spark exclusivamente.

Referencias primarias: [gestión de usuarios](https://firebase.google.com/docs/auth/web/manage-users),
[API Auth](https://firebase.google.com/docs/reference/js/auth#verifybeforeupdateemail) y
[vinculación de proveedores](https://firebase.google.com/docs/auth/web/account-linking).

## Validación y cierre

Los tests unitarios usan límites SDK simulados; los tests de navegador usan
exclusivamente Auth/Firestore emulados con el proyecto `demo-mangalist`. Ninguna
prueba de esta ampliación opera cuentas reales ni envía correo real.

- PASS: 155/155 unitarios, incluidos 12 nuevos casos del servicio con SDK simulado:
  confirmación, rechazo y reintento, ausencia de sesión, sustitución de identidad,
  bloqueo concurrente, envío verificado y conflictos/cancelación/bloqueo/red de Google.
- PASS: cuatro recorridos enfocados de navegador (dos en Chromium y dos en Firefox):
  contraseña actual incorrecta, limpieza y reintento; cambio efectivo, rechazo de
  la anterior y entrada con la nueva; obra y UID conservados; cancelación de email,
  envío de verificación sin cambio optimista, consumo del código mediante API
  local, actualización del perfil y entrada con el nuevo email y el mismo UID.
- PASS: 37 regresiones existentes de navegador. La primera ejecución ampliada
  completó 39/41 (esas 37 y dos casos nuevos de email); los otros dos se detuvieron
  por un selector ambiguo de alertas del test. Tras precisarlo, los cuatro casos
  nuevos pasaron sin reintentos. No se presenta la primera ejecución como 41/41.
- PASS: comprobación de ancho y revisión visual de Ajustes a 375 px; no certifica
  un navegador móvil nativo. Los diálogos permiten cancelar y limpiar campos.
- PASS: lint, auditoría offline de credenciales, check:spark local y documentación.
  Los builds y el CI del nuevo candidato se registran en la PR correspondiente.

Entorno: Node 24.18.0, Firebase JS 12.18.0, Playwright 1.63.0, Chromium
153.0.8010.12 y Firefox 155.0; Java 23.0.1 para emuladores. No se cambian lockfiles.
Hubo bloqueos instrumentales de permisos al iniciar emuladores y generar docs,
resueltos con permisos locales; un intento enfocado no encontró Playwright fuera
del PATH de npm y se repitió con `npx --no-install`. No son defectos del producto.

Reproducir con `npm test`, `npm run test:auth`, `npm run lint:check`,
`npm run check:spark`, `npm run audit:security`, `npm run docs:build` y
`npm run docs:check`. La suite Auth contiene los casos nuevos y conserva el
aislamiento de red hacia los emuladores. El CI de la PR de validación anterior
(`e48ffa4e`) no acredita estos cambios de comportamiento. Logs, trazas y códigos
sintéticos permanecen locales; no se publican ni se guardan códigos reales.

Siguen pendientes para cierre integral: pruebas reales autorizadas del correo de
verificación y su página alojada, vuelta a la app, Google popup y conflictos entre
demos, dispositivos/Safari, revocación de otras sesiones y los bloqueos restantes
de ML-15. La autorización para implementar no autoriza cambiar nuevas credenciales
reales, vincular demos ni enviar nuevos correos reales sin consentimiento concreto.
