# MangaList: Firebase Spark exclusivamente

::: info Lectura de versión — ML-05, 23/10/2026
La tabla de consultas se actualizó al código integrado ML-07 (5001).
Los estados remotos y pruebas fechados siguen siendo evidencia histórica.
Véanse las [admisiones y sus límites](/reference/synchronization#presupuestos-y-spark).
Véase [estado y evidencias](/maintenance/documentation-audit).
:::

Requisito del titular, 18/10/2026: no activar Blaze, vincular cuentas de facturación,
usar créditos de prueba ni desplegar servicios que requieran pago. Un producto con
franja gratuita en Blaze no cumple este requisito. No hay despliegue automático.

## Inventario aprobado y observado

| Servicio                                                               | Uso aprobado                               | Control                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Firebase Authentication                                                | Correo/contraseña y Google                 | Sin teléfono/SMS ni proveedores nuevos; admisión local y errores de cuota  |
| Firestore Standard `(default)`                                         | `users/{uid}` y `users/{uid}/mangas/{id}`  | Reglas de propietario, esquema, marcador y límite de consultas             |
| Hosting clásico                                                        | PWA en destino `app` y VitePress en `docs` | Solo contenido estático; sin backend ni SSR                                |
| Emulator Suite                                                         | Auth/Firestore locales `demo-mangalist`    | CI sin credenciales; E2E bloquea peticiones fuera de localhost             |
| Storage, Functions, Run, App Hosting, Extensions, SQL/Data Connect, AI | Prohibidos                                 | Rechazo de configuración/SDK; no provisionar                               |
| Analytics, Remote Config, Messaging, App Check                         | No utilizados en este cliente              | Añadirlos exige revisar inventario y compatibilidad; nada se habilita aquí |

La presencia heredada de `storageBucket` en la configuración web no inicializa Storage.
No se instala ni importa su SDK. Cloud Storage requiere Blaze según la
[FAQ oficial](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

Inspección GET del 18/10/2026, aproximadamente 07:04 Europe/Madrid: facturación
desactivada y sin cuenta asociada; Firestore Standard nativo en `eur3`.
Ver [evidencia e inventario de APIs habilitadas](verification-spark-2026-10-18.md).
Una API habilitada no equivale a recurso desplegado o uso facturable. No se deshabilita
ninguna automáticamente, porque podría tener dependencias operativas.

## Validación antes de cualquier publicación futura

`npm run check:spark` verifica `spark-policy.json`, objetivos, hooks, servicios permitidos,
rewrites, importaciones Firebase (incluidas las que no usan `from`), dependencias de servidor
y ausencia de despliegue en CI. Examina `src` y `src-pwa`, así como dependencias transitivas
de ambos lockfiles; los scripts `.mjs` se comprueban también con formato y ESLint.
Se ejecuta antes de instalar dependencias en CI. Las pruebas negativas alteran configuración
y evidencias para comprobar que se rechazan servicios incompatibles y facturación activa.

Los hooks de Hosting y Firestore ejecutan `npm run check:spark:remote`. Este comando
solo lee mediante Google Cloud CLI: `billing projects describe` y `firestore databases describe`.
Necesita un `gcloud` autenticado y permisos de lectura de facturación y base de datos.
Rechaza facturación activa, cuenta asociada incluso desactivada, proyecto/edición distintos,
errores de red, permisos insuficientes, CLI ausente o evidencia incompleta. No habilita APIs,
no cambia el plan y no ofrece un modo de omitir la comprobación. El proyecto del hook debe
coincidir con la política. `deploy:hosting` verifica también antes de invocar Firebase CLI.

`deploy:hosting` selecciona solo `hosting:app`; `deploy:docs` selecciona solo
`hosting:docs` y conserva la misma comprobación remota. El verificador permite
exactamente estos dos destinos, con rutas y asociaciones de `.firebaserc` fijas.
Cada sitio conserva sus hooks independientes. Las cuotas de Hosting se comparten
entre ambos. Consulta [la publicación del portal](../../operations/deployment.md).

Los tests de CI no acceden a producción. No se añade ninguna credencial ni rol de despliegue.
Ejecutar una comprobación no autoriza desplegar. No ejecutar comandos de despliegue para
probar los hooks contra producción.

Estos controles previenen errores comunes de este repositorio; no son una frontera contra
un administrador que modifique el código, use otro fichero de configuración o cambie el
plan desde la consola. La evidencia es puntual: tampoco evita un cambio de plan concurrente.
El análisis estático no reconoce todos los posibles clientes REST, imports calculados o
servicios futuros. Revisión humana y permisos mínimos siguen siendo necesarios.

## Cuotas y presupuesto de consultas

El cliente valida las [peticiones de emuladores antes de inicializar servicios](../development/firebase-startup.md).
Una petición fuera de desarrollo, con proyecto no demo o configuración incompleta, falla
temprano. Los valores desconocidos no se convierten silenciosamente en modo cloud. La
coherencia de una app existente se comprueba antes de Auth/Firestore; no certifica el plan
remoto ni sustituye la comprobación de facturación previa a una publicación autorizada.

Referencia revisada el 18/10/2026: Firestore Standard incluye 50 000 lecturas, 20 000
escrituras y 20 000 borrados diarios, 1 GiB almacenado y 10 GiB de transferencia saliente
mensual para una base gratuita. El reinicio diario se rige por hora del Pacífico, no Madrid.
Consultar [cuotas oficiales](https://firebase.google.com/docs/firestore/quotas?hl=en).
Hosting Spark ofrece 10 GB almacenados y 10 GB de descarga al mes según la
[tabla de precios](https://firebase.google.com/pricing). Auth tiene límites específicos
por operación/proveedor: no asumir envíos de correo o accesos ilimitados.

| Operación                   | Presupuesto de la aplicación                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Biblioteca                  | Una apertura lógica por almacén; rangos ID con cursores, límite 5001 por consulta, presupuesto local de 10000 obras/64 rangos; cada target nuevo consume admisión de lectura |
| Reglas de listado           | Exigen propietario y `limit <= 5001`; rechazan consultas sin límite                                                                                                          |
| Duplicados                  | Máximo 10 resultados por búsqueda                                                                                                                                            |
| Detalle                     | Un documento por petición                                                                                                                                                    |
| Admisión por pestaña/minuto | 60 lecturas puntuales, 120 operaciones de escritura, 3 aperturas de listener, 10 operaciones de Auth                                                                         |
| Transacciones               | Máximo 3 intentos del SDK por transacción                                                                                                                                    |
| Importación                 | Concurrencia 8; IDs estables y transacción por fila; hasta 60 admisiones/minuto por presupuesto de lecturas; detiene chunks posteriores ante cuota/presupuesto               |
| Borrado por confirmación    | Máximo 5 lotes de 400 borrados; hasta 6 consultas, más marcador y verificación de Auth                                                                                       |

Una petición no equivale a una lectura facturable: una consulta consume por documentos,
una vacía tiene coste mínimo, una transacción puede repetir lecturas, las reglas consultan
el marcador y los listeners cobran lecturas por cambios y reconexiones. Un intento de
borrado grande puede leer hasta 2400 obras, borrar 2000 y gastar lecturas adicionales del
marcador/reglas. Los números anteriores no representan un límite global facturable.

Una biblioteca que excede el presupuesto local de 10000 obras o 64 rangos produce un error explícito, cierra la suscripción y
no entrega una copia parcial. Se bloquean importación/exportación con error de sincronización
o carga en curso. No se eliminan obras para cumplir el límite. Hace falta revisión de coste
antes de ampliar estos presupuestos. El cliente ML-07 requiere las reglas versionadas
de límite 5001; no debe suponerse compatibilidad con reglas antiguas de 1001.
El estado remoto no se verifica aquí. Probar la actualización PWA antes de publicarla.

El presupuesto está en memoria de cada pestaña: recargar lo restablece y otras pestañas,
usuarios o clientes modificados lo eluden. No limita cambios recibidos en un listener ya
abierto ni impone una capacidad global de biblioteca. Las reglas no limitan frecuencia
ni cuentan documentos totales. No se garantiza evitar abuso o agotamiento de cuota.

## Cuota agotada y fallos

`resource-exhausted`, su variante con prefijo y límites de Auth generan mensajes específicos.
El circuito local pausa nuevas operaciones controladas durante 15 minutos. No hay bucles
de reintento de aplicación; volver a intentar exige acción del usuario y presupuesto disponible.
La pausa no asegura que la cuota se haya recuperado: puede ser necesario esperar al reinicio.
Los borradores y éxitos de importación permanecen en la sesión; no se promete persistencia
después de cerrar la pestaña. Firestore conserva sus propios mecanismos de backoff,
reconexión y escrituras pendientes: este control no los convierte en un límite global.

Si Spark rechaza operaciones por cuota, aceptar indisponibilidad y posponer trabajo.
Nunca ofrecer actualizar a Blaze como solución. No vaciar datos ni reiniciar importaciones
automáticamente. Revisar uso en consola con permisos de lectura; no crear presupuestos
de facturación ni activar integraciones para obtener alertas.

## Borrado de cuentas sin servidor de pago

1. Reautenticar y comprobar identidad. Una confirmación simultánea en la misma instancia se rechaza.
2. Crear mediante transacción el marcador mínimo `status: deleting`, sin email ni biblioteca.
3. Las reglas bloquean nuevas altas/actualizaciones, también en lotes atómicos y otras sesiones.
   Solo se permiten lectura y borrado del propietario; el marcador no puede retirarse ni desbloquearse.
4. Leer del servidor y borrar lotes de hasta 400; máximo 2000 por confirmación. Comprobar
   sesión entre lotes. Un fallo conserva el marcador, Auth y progreso confirmado.
5. Solo tras una consulta vacía confirmada por servidor se intenta eliminar Auth, comprobando
   nuevamente la sesión. Una respuesta perdida puede subestimar el progreso; repetir es seguro.

Si se interrumpe, el mismo usuario puede volver a Ajustes, reautenticarse y continuar desde los
documentos restantes. Una librería vacía no elimina el marcador. Si falla Auth, el siguiente
intento confirma de nuevo la ausencia de obras antes de borrar el acceso.

**Si desaparece el cliente, nadie continúa el trabajo.** No hay tarea durable, trigger,
reconciliación automática, TTL ni garantía de finalización o plazo. Si el usuario pierde su
acceso o elimina Auth por otro medio, puede necesitar asistencia administrativa expresamente
autorizada. No se implementa un trabajador externo ni se utiliza GitHub Actions como limpiador.
El alcance es la subcolección `mangas`; futuras subcolecciones exigen actualizar inventario,
procedimiento y tests. Borrar un documento no borra sus subcolecciones, como explica el
[modelo oficial](https://firebase.google.com/docs/firestore/data-model).

El marcador retiene UID en su ruta, estado y dos fechas. Es un identificador residual, no
una promesa de borrado de todo dato personal. Se conserva para bloquear tokens de otras
sesiones; no se retira automáticamente. Aprobar retención y procedimiento de revisión antes
de afirmar eliminación completa. Admin SDK puede saltarse reglas: no se le atribuye protección.

Procedimiento propuesto de asistencia, sin ejecutarlo: con autorización para un UID concreto,
verificar identidad/solicitud y marcador, inventariar únicamente sus rutas, comprobar cuotas,
continuar lotes acotados, confirmar ausencia de obras y después tratar Auth. Registrar solo
resultados necesarios, sin copiar la biblioteca. Si falta cuota, detenerse y reprogramar manualmente.
La retirada del marcador requiere una decisión separada sobre sesiones antiguas y retención.

## Decisiones del titular pendientes

Los [controles de entrada del verificador](spark-guard-entrypoints.md) rechazan argumentos
ambiguos y cambios en scripts críticos; sus límites no sustituyen la protección de ramas ni IAM.

- Revisar los límites/coste de la paginación completa ya priorizada: [cursores 1.0](../firestore/firestore-cursors-v1.md).
- Asignar responsable y plazo de asistencia para borrados abandonados; aprobar retención del UID/marcador.
- Autorizar por separado revisión de IAM para restringir asociación de facturación, permisos
  de despliegue y protección de main/CI. No modificar permisos aquí ni autoasignar roles.
- Revisar APIs habilitadas no utilizadas antes de deshabilitar alguna; evaluar App Check solo
  si su proveedor y configuración cumplen Spark y existe autorización remota específica.
- Autorizar una publicación posterior con pruebas de actualización de clientes antiguos y
  estrategia de rollback que preserve el bloqueo de marcadores.

La recuperación de importaciones usa las mismas rutas y cuotas de Spark; ver [identidades, costes y límites](../features/import-recovery.md).

La descarga ahora realiza una lectura adicional acotada del servidor y rechaza caché o cambios pendientes; ver [coste, formatos y límites](../features/synchronization-and-export.md).
