# Validación de Firebase antes de inicializar servicios

Continuación sobre `7df1aad`. Se endurece el arranque del cliente, sin cambiar proyecto,
proveedores, reglas, permisos, edición de Firestore ni configuración remota. El inventario
sigue siendo Auth, Firestore Standard y Hosting estático, exclusivamente Spark.

## Problema reproducido

El guard anterior comprobaba el proyecto demo después de inicializar App, Auth y Firestore.
La nueva regresión, ejecutando el módulo real con fronteras SDK controladas, falló primero:
una petición de emuladores con proyecto no demo alcanzó `getApps`, `initializeApp`,
`initializeAuth` y `getFirestore` antes de lanzar el error.

Además, `DEV=false` con emuladores solicitados simplemente omitía las conexiones locales.
La intención de usar emuladores podía así convertirse en un arranque normal. No se afirma
que la reproducción haya enviado tráfico o modificado datos: esas llamadas estaban simuladas.

## Contrato de arranque

| Configuración                                                      | Resultado                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Bandera omitida, vacía o `false`                                   | Arranque normal; no se conectan emuladores                                   |
| `true`, desarrollo real, seis valores completos y proyecto `demo-` | Conexión local en orden Auth y Firestore                                     |
| `true` en una compilación de producción                            | Error antes de invocar App/Auth/Firestore; no se ignora la petición          |
| `true` con proyecto no demo o valores incompletos                  | Error antes de cualquier llamada a los inicializadores o al registro de apps |
| Valor no reconocido, como `TRUE`, `1` o `yes`                      | Error temprano; no se interpreta como modo normal                            |
| App predeterminada existente con otros valores públicos            | Rechazo antes de crear Auth o Firestore                                      |

La bandera se normaliza a texto y se recortan espacios. Solo admite vacío, `true` y `false`;
el modo de desarrollo debe ser el booleano real de Vite. No se deduce el modo por hostname.
Una configuración incompleta sin petición de emuladores conserva el comportamiento anterior:
App/Auth/Firestore nulos y error de configuración al requerir Firebase.

La app predeterminada solo se reutiliza si sus seis valores públicos coinciden con los
configurados: API key, dominio de Auth, proyecto, bucket heredado, sender ID y app ID. Una
discrepancia o metadatos ausentes detienen el arranque; no se elimina ni modifica esa app.
Comparar el campo del bucket no instala ni activa Storage.

Auth conserva las opciones explícitas de persistencia. Si se solicitan emuladores, se llama
a `connectAuthEmulator` inmediatamente después de `initializeAuth`, antes de obtener
Firestore; después se conecta Firestore a su puerto local. Un error de conexión termina
el arranque y no se captura para probar endpoints cloud. Estos métodos configuran el destino;
no certifican que el proceso del emulador esté disponible. No hay reintento automático nuevo.
Esto sigue el [contrato de Auth](https://firebase.google.com/docs/reference/js/auth#connectauthemulator)
y la [conexión local de Firestore](https://firebase.google.com/docs/emulator-suite/connect_firestore).

## Compatibilidad y verificación

Si un build conservaba `QCLI_FIREBASE_EMULATORS=true` fuera de desarrollo, ahora falla al
arrancar. Retira la bandera o usa `false` para un candidato normal revisado; para pruebas
usa el lanzador demo. No cambies un proyecto demo por uno real para sortear el error.
Si cambia la configuración durante desarrollo y existe una app con valores anteriores,
inicia una página/contexto nuevo con la configuración correcta; no se añaden borrados de
persistencia, cierre de sesiones o eliminación de apps como recuperación automática.

Las [regresiones de arranque](../tests/regressions.test.js) cubren rechazo antes de llamadas SDK, orden y destino de las conexiones,
fallos de Auth y Firestore sin continuación, arranque normal, configuración incompleta y
reutilización/mismatch de los seis valores con el modo local habilitado y deshabilitado.
La batería de regresiones suma 59 casos. Los E2E usan los SDK reales contra emuladores;
CI comprueba también los builds SPA/PWA demo y el worker compilado.

Los doubles de SDK verifican llamadas del módulo, no ausencia de todo efecto de importar
una biblioteca. Tampoco revierten servicios iniciados por otro código, prueban que una API key
pertenezca al proyecto declarado ni certifican facturación o estado remoto. El arranque normal
sin bandera sigue pudiendo usar la configuración proporcionada. Esta defensa no convierte
un cliente modificado en confiable ni impide abuso o cuotas agotadas. No se fusiona ni despliega.

Resultado local: 59 regresiones y 27 recorridos reales Chromium/Firefox correctos. La
comprobación de reutilización se repite con arranque normal de producción simulado y modo
emulador, rechazando también espacios distintos en valores de una app ya inicializada.
Spark, formato y ESLint correctos. La evidencia de red de E2E sigue limitada al entorno demo.
