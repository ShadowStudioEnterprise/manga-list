# ML-15: sesiones compiladas con almacenamiento denegado

Fecha: 28/10/2026. Ampliación local sobre la revisión
`336ae9a2a66cfe7265bf4969781eff4d0df8ad39`, con corrección nueva para revisión.
ML-15 permanece **OPEN**. Sin cambios remotos, merge ni despliegue; Spark exclusivamente.

## Ensayo reproducible

`npm run test:auth:built` inicia exclusivamente Auth Emulator con demo-mangalist.
Antes hay que generar SPA y PWA con la configuración demo utilizada en CI.
El ensayo rechaza artefactos de otro proyecto. Prueba ambos artefactos en Chromium
y Firefox con dos políticas sintéticas: getters de localStorage/sessionStorage
que lanzan SecurityError, o escrituras que lanzan QuotaExceededError.

Cada caso registra una cuenta sintética en el emulador, entra en Biblioteca,
comprueba que otra pestaña permanece sin sesión y que recargar borra la sesión
en memoria. Vuelve a entrar con email/contraseña, verifica el mismo UID y sale.
Exige que no haya errores globales de página ni solicitudes externas inesperadas.

Todas las solicitudes del navegador se interceptan: estáticos y respuestas Auth
se sirven desde loopback mediante Node; no se continúa ninguna solicitud.
Solo se admiten signUp, signInWithPassword y lookup con la clave demo. Los
redireccionamientos están desactivados. Firestore se aborta expresamente.
Los service workers están bloqueados. Chromium añade el modo offline del navegador;
Firefox necesita navegar en modo online porque rechaza la navegación antes del
interceptor cuando está offline. Esto no acredita login sin conexión.

## Defecto y corrección

El primer intento produjo cuatro PASS en Chromium y cuatro fallos instrumentales
NS_ERROR_OFFLINE en Firefox. Al corregir el transporte, los flujos de Firefox
completaron registro, login y logout, pero los cuatro casos fallaron por errores
globales de almacenamiento. No se consideran PASS.

Las trazas localizaron el error en el callback de Web Locks de
`src/services/shared-library.js`. El catch exterior controlaba el rechazo de la
promesa request; Firefox además publicaba ese rechazo como error global.
La corrección contiene el error dentro del callback y conserva el fallo cerrado:
notifica el error de biblioteca y termina la coordinación, sin abrir listeners
adicionales ni convertir un error en confirmación de datos.

Dos regresiones unitarias comprueban lectura y escritura denegadas: una única
notificación, cero listeners, cero datos y callback resuelto sin rechazo.

## Evidencia y límites

Resultado final: **8/8 PASS**, con **171/171 unitarios PASS**.
Los builds locales declaran la revisión padre con dirty=true; el resumen incluye
la huella de la fuente corregida y de sus manifiestos. No certifican el padre limpio.

El resultado final se registra en [el resumen saneado](../../measurements/ml15-built-auth-2026-10-28/summary.json).
Los logs completos permanecen locales; no se publican cuerpos Auth ni tokens.
Versiones locales: Node 24.18.0, Firebase SDK 12.18.0, CLI 15.32.1,
Playwright 1.63.0, Chromium 153.0.8010.12 y Firefox 155.0.

Es integración con SDK compilado y transporte sintético hacia Auth Emulator,
no aceptación del servicio real. No comprueba contenido de biblioteca, reglas
Firestore, navegación privada nativa ni una PWA instalada. La biblioteca comunica
un error al no poder coordinarse; la sesión puede continuar en memoria.

El CI anterior de #32 terminó PASS en ambos eventos (PR 40745405743 y push
40745259474), con 75 casos de navegador; no certifica esta corrección posterior.
La nueva ampliación requiere su propio CI y revisión.

Siguen BLOCKED por candidato/alcance o intervención humana: aceptación real del
cambio autenticado de contraseña, verificación del nuevo email y vinculación;
caducidad temporal de enlaces y revocación reales; aislamiento remoto por UID.
Safari/iOS sigue BLOCKED por falta de dispositivo confirmada por el usuario.
Los ensayos reales previos y los límites de los emuladores constan en
[el seguimiento anterior](ml-15-followup-2026-10-28.md).

## Seguimiento del 30 de octubre: rutas reservadas de Auth

Durante la aceptación humana del candidato local cbd1c98ca9e4, la ventana
de vinculación mostró Biblioteca en firebaseapp.com antes de seleccionar
ninguna identidad Google. La demo original conservó su obra. Al cerrar esa
ventana apareció «Se ha cerrado la ventana de acceso antes de terminar».
Se registra cancelación real observada; no demuestra conflicto de credenciales,
vinculación ni creación de otra cuenta. Esos casos siguen BLOCKED.

La regresión local con el PWA compilado anterior reprodujo en Chromium y Firefox
que el service worker devolvía la aplicación para /__/auth/handler, sin llegar
al endpoint reservado del servidor. Es un defecto sintético reproducido,
compatible con el incidente humano; no se inspeccionó el worker de su perfil.

La corrección excluye todo /__/ del fallback de navegación, conservando las
exclusiones existentes y el fallback de las rutas ordinarias. Se aplica a
GenerateSW y también a la plantilla alternativa InjectManifest. La prueba
tests/pwa/auth-reserved-routes.test.js usa Chromium y Firefox, un servidor
local con respuestas identificables y configuración demo; bloquea solicitudes
externas y no autentica usuarios. Comprueba handler, iframe, action y el
endpoint de inicialización, además de una navegación normal de la aplicación.

Reproducción: compilar con las seis variables Firebase demo del CI, ejecutar
npm run build:pwa y npm run test:pwa. Antes de corregir, ambos motores fallaron
porque handler fue servido por el worker. El resultado posterior se documentará
con los controles de esta rama. Esta corrección requiere revisión y no se ha
desplegado: no cambia la PWA ya instalada ni la configuración remota. ML-15
permanece abierta.

Validación posterior: 14/14 pruebas PWA PASS (incluidas las dos nuevas),
171/171 unitarias PASS; lint:check, docs:check y check:spark PASS.
Versiones: Chromium 153.0.8010.12 y Firefox 155.0. El build PWA usa
la revisión padre cbd1c98ca9e4 con cambios locales; no certifica un artefacto
desplegado ni el padre limpio. La compilación terminó correctamente.

La auditoría raíz del 30/10 detecta 7 vulnerabilidades (1 moderada y 6 altas)
en la cadena de Vue I18n, re2js y Vite de VitePress. Es un FAIL independiente
del enrutamiento; el resultado histórico de cero no se reutiliza. Al fallar
la primera parte de audit:dependencies, la auditoría PWA debe ejecutarse
por separado. No se aplicaron actualizaciones forzadas ni cambios remotos.
