# Decisiones técnicas de la revisión del 16/10/2026

## Base y alcance

La revisión parte de `main` y HEAD remoto verificado
`effcef43cef0585fe32f1dbb1dc2d435152ffc7f`, igual al SHA de la auditoría.
Rama: `development/audit-2026-10-16`.

Se contrastaron el código actual, el informe técnico y la verificación del sitio del
16/10/2026. La conversación de referencia solo devolvió referencias internas; no se
atribuyen a ella decisiones que no pudieran leerse. Las pruebas usan exclusivamente
`demo-mangalist` y servicios en loopback. No se reutilizaron cuentas, datos, credenciales
ni sesiones de producción. No se modificaron configuración remota, main ni Hosting.

## P2: conflicto persistente en biblioteca

Antes, las acciones CRUD y el listener escribían en `mangaStore.error`. Un conflicto
correctamente rechazado por la transacción contaminaba el banner de conexión. Reintentar
llamaba a `subscribe(uid)`, cuya guarda de suscripción activa no limpiaba ese error.

Ahora `syncError` pertenece exclusivamente al listener. Los errores de las operaciones se
propagan a su formulario, diálogo o notificación. Una operación exitosa o fallida no borra
un fallo real del listener. Al fallar el listener se permite una nueva suscripción; su
siguiente snapshot limpia el banner. Las páginas capturan también un fallo síncrono del
reintento. Una versión de suscripción descarta callbacks tardíos incluso después de volver
a suscribir el mismo UID.

La edición sigue comprobando únicamente los campos modificados en transacciones y conserva
el borrador rechazado. Favoritos incorpora la misma precondición sobre el valor mostrado.
Los incrementos siguen leyendo el capítulo actual dentro de una transacción. El borrado
individual conserva la política de confirmación y eliminación por ID; no compara versiones.

## Sesión entre pestañas

La prueba nueva de borrado reprodujo una vuelta inesperada al login al activar la primera
pestaña después de abrir otra. Se revisó el SDK instalado: el arranque predeterminado de
`getAuth` prioriza IndexedDB y migra la sesión que encuentra en localStorage, retirando
esa clave. Después el servicio de la app cambiaba de nuevo a localStorage. Otra pestaña
podía observar la retirada como un cierre transitorio y redirigir al login.

El boot usa ahora `initializeAuth` con persistencia local y alternativa en memoria desde
el principio, conservando `browserPopupRedirectResolver` para Google. El servicio mantiene
su fallback de persistencia. La regresión verifica estas dependencias de arranque y el
flujo de dos pestañas con vuelta al foco antes de eliminar la cuenta. No se ha probado
OAuth Google real; conservar el resolver evita eliminar deliberadamente esa capacidad.
La [guía oficial de dependencias Auth](https://firebase.google.com/docs/auth/web/custom-dependencies)
describe la inicialización explícita y los valores predeterminados de `getAuth`.

## Borrado de cuenta: bloqueo y reanudación

Secuencia del cliente:

1. Reautenticar siempre. La opción antigua `reauthenticate: false` ya no permite omitirlo.
2. Verificar que continúa activa la misma sesión.
3. Crear o actualizar transaccionalmente `users/{uid}` con `status: deleting` y timestamps.
   Se conservan los timestamps de creación de documentos existentes. Un marcador previo
   permite reanudar sin modificarlo.
4. Leer del servidor lotes de hasta 400 obras, borrarlos y comunicar solo progreso confirmado.
   Un error de caché o falta de red no equivale a una colección vacía.
5. Tras una lectura vacía confirmada por el servidor, borrar el usuario de Authentication.

Las reglas conservan compatibilidad con bibliotecas sin documento padre y con documentos
antiguos de dos timestamps. El estado `deleting` es irreversible desde el SDK cliente:
no puede quitarse, sobrescribirse ni borrarse. Se permiten lecturas y borrado de obras
propias para recuperar/exportar o continuar la limpieza, pero no altas ni modificaciones.
`getAfter` bloquea también lotes que intenten iniciar el borrado y escribir una obra a la
vez. La documentación oficial describe esta comprobación del estado posterior al lote:
[condiciones de reglas](https://firebase.google.com/docs/firestore/security/rules-conditions).
Las longitudes de arrays se calculan una vez para mantener la validación máxima dentro
del presupuesto de evaluación de reglas.

El marcador permanece después de eliminar Auth: contiene solo el estado y dos timestamps,
identificados por UID, sin email ni biblioteca. Impide que un token todavía válido en otro
dispositivo reconstruya datos huérfanos. La interfaz informa de esta retención mínima.
`firestoreDataDeleted` significa que se vació la biblioteca, no que se eliminó el marcador.
Los fallos incluyen `deletionStarted`, `deletedCount` y `partialDataDeletion` cuando procede.
Un callback de progreso que falla no interrumpe la limpieza.

### Límites expresos

Esto mitiga la carrera de escrituras, pero **no es un ejecutor durable ni borrado completo
de todo identificador**. Si se cierra el navegador, hace falta volver a Ajustes y reintentar.
No hay reconciliación automática de Auth/Firestore, ni limpieza recursiva de futuras
subcolecciones, ni garantía frente a modificaciones con Admin SDK. No se debe retirar el
marcador manualmente mientras puedan existir sesiones antiguas. La eliminación automática
del marcador exige un proceso de servidor y un criterio de revocación/retención verificado.
Si el servidor confirma una operación pero se pierde su respuesta, el progreso local puede
ser menor que el efectivo; repetir la limpieza es seguro.

### Compatibilidad de una futura publicación

Esta rama no publica reglas ni aplicación. Cuando se autorice una entrega, revisar y probar
primero las nuevas reglas, después el cliente. Con reglas antiguas la creación del marcador
es rechazada y el cliente se detiene antes de borrar obras. No revertir las reglas de forma
que se vuelva a permitir borrar marcadores existentes. Las reglas nuevas protegen también
frente a clientes antiguos que intenten escribir tras iniciarse un borrado.

## Verificación reproducible

Usar Node 24 y Java 21 o superior; Firebase CLI 15.32.1. Instalar con `npm ci` y
`npm ci --prefix src-pwa`, y preparar Chromium con `npx playwright install chromium`.

```sh
npm run lint:check
npm test
firebase emulators:exec --project demo-mangalist --only firestore "npm run test:rules"
npm run test:e2e
```

En Windows, poner el directorio `bin` del JDK real al principio de PATH evita el wrapper
Oracle que puede dejar procesos o bloquear el arranque. En este entorno se usó Java 23.0.1.
Los tests E2E rechazan un servidor existente y abortan peticiones fuera de los puertos
locales 9100, 8188 y 9199. Compilar SPA/PWA requiere las seis variables Firebase de ejemplo
con proyecto `demo-mangalist`; ver el workflow CI. Compilar no despliega.

Consultar [los resultados de esta revisión](../quality/verification-2026-10-16.md) y
[el roadmap](roadmap.md) antes de decidir una publicación.
