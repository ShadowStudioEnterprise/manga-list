# Nextcloud para ML-11: definición de implementación

**Antecedente sustituido como candidata principal:** el usuario seleccionó
[Proton Drive](proton-drive-implementation-proposal.md). Este diseño y sus pruebas
se conservan como referencia; no se despliega ni se transfieren sus garantías a Proton.

Versión de propuesta: 1, 21/10/2026. **Diseño pendiente de aceptación; no desplegado
ni apto todavía para datos reales.** D1–D7 conservan su aceptación y sus condiciones
en el [acta ML-11](ml-11-acceptance-2026-10-21.md). Las decisiones N1–N5 de este
documento son nuevas y no se consideran aceptadas por definir la implementación.

## Función y límite del sistema

Nextcloud será el archivo privado de expedientes de revisión manual de marcadores:
actas mínimas, evidencias restringidas, revisiones y autorizaciones separadas. No
será el backend de MangaList, no alojará bibliotecas y no tendrá SDK Admin,
credenciales, enlace de sesión o conexión operativa a Firebase. La relación entre
caso y UID se guardará únicamente en el vínculo privado autorizado del expediente.

La revisión a las 720 horas se seguirá en una agenda humana. Nextcloud no decidirá
ni ejecutará borrado de cuentas o marcadores. No se añade TTL, cron, Functions,
extensiones o facturación a Firebase. MangaList permanece exclusivamente en Spark.
El canal de recepción y la comprobación de identidad se aprobarán por separado;
disponer de una carpeta no verifica identidad o representación de un solicitante.

## Arquitectura objetivo

Flujo previsto: acceso privado HTTPS → pasarela de auditoría → Nextcloud → base
de datos y archivos. La pasarela y la aplicación envían evidencia al registro
custodiado. El operador no accede directamente a la aplicación, base, disco o motor
de contenedores. La vía administrativa es distinta y queda bajo control de confianza.

| Componente           | Definición propuesta                                                                                  | Condición de entrega                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Servidor             | Linux de 64 bits, Ubuntu 24.04 LTS, dedicado al servicio y administrado de forma mantenida            | Equipo/alojamiento y responsable todavía por seleccionar; no usar Docker Desktop del piloto como servidor operativo                                                       |
| Despliegue           | Docker Engine y definición Compose revisada, imágenes fijadas por digest y volúmenes explícitos       | Sin privilegios de host, montaje de `docker.sock` ni publicación de puertos internos; secretos fuera de Git                                                               |
| Nextcloud            | Imagen comunitaria Apache; 35.0.2 es la referencia ensayada                                           | Antes de construir una candidata, verificar soporte y parches, fijar nueva revisión si procede y repetir pruebas; no conservar una versión insegura por ser la del piloto |
| Datos                | MariaDB 11.4, InnoDB y aislamiento READ COMMITTED; volumen propio                                     | Sustituir SQLite en una candidata operativa y validar migración/restauración con datos ficticios; no reutilizar el volumen del piloto                                     |
| Caché/bloqueos       | APCu local y Valkey compatible para bloqueo, en red interna                                           | Fijar versión y configuración compatibles con la candidata; comprobar bloqueo, no asumir exclusión de edición por esta caché                                              |
| Entrada              | HTTPS privado mediante proxy TLS, accesible solo a personas autorizadas                               | Seleccionar acceso privado y certificados; sin enlaces públicos, túneles abiertos ni dominio contratado automáticamente                                                   |
| Control de auditoría | Componente de mediación con registro previo y de resultado, revisado y mantenido                      | El prototipo no se despliega como producto; hacen falta diseño detallado y revisión de seguridad de toda la superficie HTTP                                               |
| Registro             | Receptor con confirmación de persistencia, permisos separados y copia bajo custodia independiente     | El operador no lo administra; una copia en el mismo host no acredita separación frente a su administrador                                                                 |
| Copias               | Copia cifrada consistente de datos, base, configuración y componentes necesarios, en destino separado | Restauración probada, claves custodiadas y retención aprobada antes de casos reales                                                                                       |

No se ha confirmado que exista equipo o destino de copias adecuado. El software
libre no aporta alojamiento, energía, mantenimiento, dominio o disponibilidad sin
coste. La implementación se detiene antes de contratar o gastar; no se deriva a
Blaze ni a servicios de pago de Firebase para cubrir esas necesidades.

## Personas y permisos

| Función                                 | Acceso objetivo                                                  | Límites                                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Operador, asumido por el promotor       | Aplicación, casos asignados y preparación de actas               | Cuenta ordinaria; sin administración de Nextcloud/servidor, registro o copias; no aprueba su propia retirada           |
| Revisor independiente, pendiente        | Consultar expediente mínimo y emitir conclusión separada         | Persona distinta del operador; información de identidad solo si es necesaria para contraste                            |
| Administración/mantenimiento, pendiente | Servicio, parches, recuperación y configuración autorizada       | Cuenta separada de uso ordinario; intervenciones documentadas; no operaciones rutinarias sobre contenido por comodidad |
| Custodia del registro, pendiente        | Controlar acceso y conservación de evidencias                    | Permisos fuera del alcance del operador; documentar si coincide con administración y qué confianza implica             |
| Privacidad/asesoría                     | Resolver base, retención, identidad/representación y excepciones | No inferir dictamen por ser promotor ni por el resultado de pruebas                                                    |
| Suplencia, pendiente                    | Continuidad de las tareas asignadas                              | Una persona usando otra cuenta no constituye suplencia ni doble revisión                                               |

El revisor puede asumir también administración/custodia solo mediante aceptación
explícita de ese reparto y su modelo de confianza; no se presupone. El operador
no acumulará esas facultades en el modelo objetivo propuesto. Esta separación es
una decisión nueva N2, más concreta que la exigencia de revisión independiente D3.

El administrador de host se considera una autoridad privilegiada de confianza.
Nextcloud y una pasarela no pueden demostrar protección absoluta frente a quien
controla aplicación, base, archivos y evidencia. El contraejemplo del piloto utilizó
ejecución administrativa dentro del contenedor, no un permiso de usuario ordinario.

## Estructura del expediente

Usar un ID opaco de caso en nombres y rutas. Mantener tres espacios de permisos
separados, evitando una carpeta padre escribible por el operador que otorgue derechos
heredados sobre la revisión o la identidad:

| Espacio             | Contenido mínimo                                                                      | Propiedad/control propuesto                                                       |
| ------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Operación           | Fechas, fase, recuentos, inventario/versiones, carencias y propuesta                  | Operador prepara; revisor consulta                                                |
| Revisión            | Conclusión, motivo, fecha, aprobaciones y siguiente revisión                          | Revisor emite; operador consulta sin sobrescribir                                 |
| Vínculo restringido | Correspondencia caso/proyecto/UID y referencias indispensables de identidad/autoridad | Acceso por necesidad; separado de actas compartidas y de logs de acceso generales |

Corregir mediante una nueva entrada que identifique la anterior; conservar versiones
conforme a la matriz aprobada. No llamar firma electrónica o registro inmutable a
un historial de archivos editable. No guardar contraseñas, tokens, MFA, cookies,
bibliotecas, títulos o notas en actas o en registros técnicos. Un caso opaco sigue
siendo vinculable si se conserva la correspondencia; no declararlo anónimo.

## Autenticación y configuración funcional

Cuenta individual por persona y una cuenta administrativa distinta para quien
administre. MFA obligatorio, recuperación bajo control y prueba positiva en
navegador antes de uso. Las credenciales de aplicación son una vía distinta:
inventariarlas, restringir clientes al alcance aprobado y probar revocación; no
tratar su uso como prueba de que se ha presentado MFA en cada petición.

Deshabilitar nuevos enlaces públicos, recompartición, compartición federada y
envío de documentos por correo. Comprobar enlaces o permisos preexistentes al
crear/importar una candidata. Seleccionar solo las aplicaciones necesarias.

La configuración ensayada mostró que `shareapi_allow_links`,
`shareapi_allow_resharing` y `shareapi_allow_public_upload` pertenecen a la
configuración de la aplicación `core`, con valor `no`. La federación usa su
configuración propia. Activar `admin_audit` y la condición de registro específica
para esa aplicación; el nivel global WARN puede suprimir sus eventos INFO.
Revalidar estos ámbitos en la versión candidata, sin copiar una opción al ámbito
equivocado ni dar por configurado un control por haber escrito una clave.

Las tareas técnicas internas de Nextcloud se programarán en su propio servidor;
no tomarán decisiones ML-11. Cualquier vencimiento de papelera, versiones, logs o
copias debe corresponder a D5. No aceptar silenciosamente valores por defecto como
política de conservación ni añadir borrado automático de expedientes sin decisión
específica. El plazo del marcador no se aplica automáticamente a esos otros datos.

## Contrato del control de auditoría

Para las vías de cliente autorizadas, la pasarela debe ser el único acceso de
aplicación. Nextcloud, MariaDB y la caché no publicarán puertos al operador. Deben
inventariarse asimismo tareas y operaciones administrativas que no pasan por ella.
No se promete que el control cubra esas otras vías sin evidencia y controles propios.

1. Asignar ID de operación; resolver recurso opaco y actor autenticado cuando sea
   posible. No confiar en un nombre indicado en URL o cabecera por el cliente.
   Una petición sin identidad validada se registra como tal, sin inventar un actor.
2. Persistir intención mínima con actor/estado de verificación, caso/recurso mínimo,
   acción y hora UTC. Exigir confirmación del receptor antes de reenviar.
3. Con fallo de registro previo, bloquear sin reenviar. Aislar el circuito y avisar
   por el canal operativo privado aprobado; no reabrir automáticamente.
4. Tras la respuesta, registrar correlación y resultado, incluidas denegaciones.
   No registrar cuerpo, secretos, cookies, consultas completas o pruebas de identidad.
5. Si falla el registro final o se pierde respuesta tras reenviar, declarar resultado
   incierto, bloquear nuevas peticiones y conciliar con evidencia autorizada. La
   operación puede haberse ejecutado: no prometer rollback ni reintento automático.
6. Reabrir únicamente tras comprobación y autorización operativa documentadas. No
   duplicar una acción para descubrir si se hizo la primera vez.

La pasarela deberá validar métodos, tamaños, tiempos, sesiones, subidas, destinos y
protocolos reales de Nextcloud, además de redacción, concurrencia y recuperación.
Su cobertura no se obtiene del prototipo de un solo proceso: el ensayo solo medió
GET/PUT ficticios. **No se recomienda desplegar ese código como proxy de producción.**
La decisión N3 exige aceptar el esfuerzo de una solución mantenida y revisada; si
no se dispone de ella, mantener el canal sin activar o evaluar otro candidato, sin
rebajar los criterios existentes por omisión. Se acepta indisponibilidad temporal
ante fallo de auditoría solo si N3 se aprueba expresamente.

## Conservación, continuidad y mantenimiento

Consultar la [evaluación de alojamiento y coste del 21/10/2026](nextcloud-hosting-cost-2026-10-21.md)
para N4. Su presupuesto es una propuesta pendiente; no autoriza contratación.

Completar con privacidad la matriz D5 por marcador, vínculo, identidad, acta,
accesos, versiones, papelera, copias y posibles reservas. No fijar aquí un plazo
legal genérico ni habilitar casos reales con esa matriz pendiente.

Propuesta operativa N4: copia consistente diaria y antes de cada actualización,
objetivo de pérdida máxima de 24 horas y recuperación en una jornada laborable.
Son objetivos pendientes de aceptación y ensayo, no un SLA demostrado. Incluir
datos, base y configuración necesaria; comprobar claves y permisos tras restaurar.
Restaurar primero en un entorno aislado, sin envíos ni credenciales de producción.
La duración de conservación de las copias se determina en D5, no por esa cadencia.

Asignar mantenimiento: revisión de avisos de seguridad cada día laborable,
priorización documentada de parches y acceso restringido mientras se resuelve una
incidencia relevante. Probar una nueva imagen, fijar digest, verificar copia y
reversión antes de actualizar. No automatizar cambios de versión sin revisión.

## Fases y criterios de aceptación

| Fase                    | Entregable                                                                     | Condición para pasar                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0: diseño              | Este documento y decisiones N1–N5                                              | Aceptación expresa del diseño; no equivale a desplegar                                                                                                   |
| F1: preparación         | Personas, equipo/coste, acceso privado, matriz y diseño detallado de auditoría | Alcance y recursos del ensayo autorizados; pendientes personales/jurídicos identificados y solo datos ficticios                                          |
| F2: candidata sintética | Linux/Compose, MariaDB/caché, HTTPS, MFA, registro y copias                    | Sin datos reales; versiones y redes verificadas; todas las pruebas exigidas ejecutadas                                                                   |
| F3: revisión            | Acta independiente, dictamen técnico y revisión jurídica                       | Responsables y permisos reales formalizados; carencias resueltas o decisiones explícitas compatibles con D1–D7; no declarar aprobación jurídica desde CI |
| F4: operación           | Autorización específica de activación y procedimiento de incidencias           | Autorización nueva; ninguna cuenta o marcador de Firebase se modifica por activar el archivo                                                             |

Pruebas obligatorias de F2: MFA positivo/negativo y recuperación; matriz completa de
permisos y herencia; web/DAV/OCS y clientes aprobados; denegaciones registradas;
fallo previo y posterior del registro; concurrencia y caída/reinicio reales;
ausencia de acceso directo para el operador; límites de administración y custodia;
revocación de sesiones y credenciales; versiones/papelera/copia; restauración de
datos y permisos; privacidad de logs y presupuesto/capacidad. Repetir regresiones
de marcador sintético a 29/30/90 días sin atribuir a Nextcloud capacidad de retirarlo.

Evidencia disponible al redactar: piloto Nextcloud 35.0.2 con cinco criterios
satisfechos (uno documental), tres fallidos, cinco inconclusos y tres no ejecutados;
ocho ensayos de modelo y seis contrastes posteriores con expectativas satisfechas,
incluido un contraejemplo administrativo. No califican esta arquitectura, ni borran
los pendientes de las fases. Los ensayos y registros se entregaron como artefactos
locales separados del código de MangaList; no contienen casos reales.

## Decisiones nuevas pendientes

| ID  | Decisión propuesta                                                                                                                                                           | Estado    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| N1  | Nextcloud como archivo privado separado de Firebase, sobre Linux y con MariaDB/caché, sujeto a las fases anteriores                                                          | Pendiente |
| N2  | Operador sin administración de host/aplicación/registro; designar administración y custodia de confianza, con revisión independiente y suplencia                             | Pendiente |
| N3  | Exigir mediación y registro previo/final para las vías aprobadas, aceptar bloqueo temporal por fallo de registro y conciliar resultados inciertos; no desplegar el prototipo | Pendiente |
| N4  | Asignar equipo, costes/esfuerzo y mantenimiento; aceptar objetivos de copia/recuperación tras ensayo, sin compras automáticas                                                | Pendiente |
| N5  | Mantener casos reales fuera hasta completar pruebas, matriz jurídica y aprobación independiente; activación en otra autorización                                             | Pendiente |

## Fuentes oficiales consultadas el 21/10/2026

- [Requisitos de servidor y bases compatibles](https://docs.nextcloud.com/server/stable/admin_manual/installation/system_requirements.html).
- [Seguridad y mantenimiento del servidor](https://docs.nextcloud.com/server/stable/admin_manual/installation/harden_server.html).
- [Caché](https://docs.nextcloud.com/server/stable/admin_manual/configuration_server/caching_configuration.html) y [bloqueo de archivos](https://docs.nextcloud.com/server/stable/admin_manual/configuration_files/files_locking_transactional.html).
- [MFA](https://docs.nextcloud.com/server/stable/admin_manual/configuration_user/two_factor-auth.html), [auditoría](https://docs.nextcloud.com/server/stable/admin_manual/configuration_server/logging_configuration.html) y [copias](https://docs.nextcloud.com/server/stable/admin_manual/maintenance/backup.html).

Las capacidades documentadas se deben contrastar en la candidata fijada. Las
decisiones de separación, mediación y objetivos operativos son propuestas propias,
no garantías que Nextcloud aporte por defecto. Esta definición no acredita
cumplimiento legal definitivo ni autoriza fusión, despliegue o acceso a datos reales.
