# Cobertura de navegador con emuladores

Continuación H3 sobre `1977820`, con datos sintéticos de Auth y Firestore Standard.
No prueba producción, OAuth Google real ni instalación en dispositivos.

## Matriz que ejecuta CI

| Escenarios                                                       | Chromium               | Firefox       |
| ---------------------------------------------------------------- | ---------------------- | ------------- |
| Registro, bookmarklet, recuperación y persistencia de sesión     | Sí                     | Sí            |
| Dos pestañas: campos distintos y conflicto del mismo campo       | Sí                     | Sí            |
| Importación, exportación y aislamiento por cuenta                | Sí                     | Sí            |
| Exportación rechazada sin conexión y recuperación                | Sí                     | Sí            |
| Borradores opcionales, recuperación y limpieza al guardar/salir  | Sí                     | Sí            |
| Capítulos y borrado confirmado en ancho móvil                    | Sí                     | Sí            |
| Borrado de cuenta: contraseña errónea y finalización en emulador | Sí                     | Sí            |
| Axe a 320/768/1280 píxeles y recorrido de teclado                | Sí                     | Sí            |
| Copiar versión con permisos reales y portapapeles denegado       | Sí                     | Sin cobertura |
| Medición de 100/1000 obras con CDP                               | Sí                     | Sin cobertura |
| Worker compilado, actualización pasiva con dos pestañas          | Sí, suite PWA separada | Sin cobertura |

Firefox comparte los nueve escenarios portables de `library.spec.js`. No se duplica su
implementación: una corrección en el flujo se comprueba en ambos motores. El caso de permisos
del portapapeles lleva una etiqueta explícita `@chromium-only`; el archivo de escala conserva
su alcance Chromium porque usa CDP. No se fingen métricas ni permisos equivalentes en Firefox.
Las pruebas portables mantienen las mismas aserciones y el rechazo de errores no controlados.

La primera ejecución detectó una suposición del recorrido de teclado: después de cerrar el
diálogo, intentaba llegar al menú anterior avanzando hasta el último enlace y esperando que
Tab volviera al principio del documento. En Firefox automatizado el foco permaneció en ese
último enlace. El recorrido vuelve ahora al encabezado con Shift+Tab, comprueba el foco real
y activa el menú con Enter; no usa clic ni asigna el foco por script. Si falla la búsqueda,
adjunta el recorrido de foco para distinguir bloqueos y orden incorrecto. No certifica la
navegación por la barra del navegador ni su retorno al documento.

Los proyectos de [Playwright](https://playwright.dev/docs/test-projects) usan las versiones de
navegador asociadas al paquete instalado. Tras actualizarlo deben instalarse de nuevo los
[navegadores correspondientes](https://playwright.dev/docs/browsers):

```sh
npx playwright install chromium firefox
npm run test:e2e
```

En Linux CI instala también las dependencias del sistema con `--with-deps`. Un navegador
ausente hace fallar las pruebas; no se omite el proyecto silenciosamente. Se usa un solo
trabajador y los mismos emuladores locales; cada escenario registra identidades sintéticas
nuevas. Ambos proyectos bloquean peticiones externas, utilizan `demo-mangalist` y nunca
reutilizan un servidor existente. Añadir Firefox no añade servicios de Firebase ni permisos.

Los informes completos de axe y las capturas/trazas de fallos quedan en directorios por
proyecto dentro de `test-results/`; CI los conserva siete días. Los resultados incompletos
de axe requieren revisión humana. Los intentos de red bloqueados y la ausencia de errores
no certifican todos los estados de la aplicación ni la ausencia de vulnerabilidades.

## Alcance pendiente

Firefox automatizado no equivale a Firefox instalado por el usuario ni a un dispositivo
Android. Tampoco cubre Safari/WebKit, iOS, lectores de pantalla reales, zoom del sistema,
redimensionamiento continuo o instalación/actualización PWA en móviles. La prueba separada
del worker sigue siendo solo Chromium. El permiso real de portapapeles en Firefox y el
diagnóstico de Ajustes en ese motor siguen pendientes.

Se mantienen las limitaciones Spark: presupuestos locales sin garantía global de cuotas,
ausencia de finalización automática del borrado sin cliente y prohibición de activar Blaze.
No se fusiona ni despliega esta ampliación de pruebas.

## Verificación local

La primera ejecución completa obtuvo 20/21 escenarios correctos: 12 Chromium y ocho
Firefox. Tras sustituir la suposición de retorno circular por navegación hacia atrás, la
prueba de teclado se repitió en ambos motores y pasó 2/2. CI vuelve a ejecutar los 21
escenarios juntos sobre el commit publicado. Spark, formato y ESLint pasan localmente.

La repetición Firefox mostró un aviso de Vue Router sobre `history.state`; la navegación,
la restauración del foco y el cierre con Escape pasaron. No se ha silenciado el aviso ni
se atribuye su causa a código de aplicación sin una reproducción específica. Su revisión,
junto al aviso de ResizeObserver ya documentado, sigue pendiente. No se cambia el rechazo
de errores no controlados del navegador.
