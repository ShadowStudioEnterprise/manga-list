# ML-13: IAM, permisos y publicación

Revisión de 23/10/2026 sobre `342ad9a` (main, PR #17), en rama aislada.
Estado: auditoría versionada; aceptación operativa pendiente. Firebase Spark
exclusivamente. No se consultaron IAM, Auth, secretos, cuentas o datos remotos;
no se cambiaron permisos, rules desplegadas, facturación ni producción.
No había un conector Firebase/GCP de lectura explícitamente disponible.
La configuración local y los informes históricos no acreditan el estado efectivo.

La muestra pública del portal (inicio, Spark, dos páginas ML-12, medición ML-10 y
avisos legales) respondió HTTP 200 en seis lecturas sin autenticación el 23/10/2026.
Se observaron nosniff y Referrer-Policy; no CSP ni X-Frame-Options. Es evidencia
HTTP de esas respuestas, no un inventario de versiones de Hosting ni de IAM.
La rama de auditoría todavía no está publicada en el portal.

## Matriz de riesgos

Severidad expresa impacto potencial; «pendiente» no implica exposición comprobada.
Las ubicaciones son del árbol base revisado; el PR añade controles sin cambiar
contratos de aplicación ni reglas.

| ID  | Severidad / estado                    | Evidencia y alcance                                                                                                                                                                                                                                                     | Recomendación / responsable propuesto                                                                                                                                                     |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Alta / pendiente externo              | IAM, herencia, grupos, cuentas de servicio, claves y roles efectivos no observados. Los SDK Admin/servidor pueden acceder mediante IAM sin las rules del cliente.                                                                                                       | Propietario del proyecto: completar checklist, registrar exceso y revisión independiente; ningún cambio automático.                                                                       |
| R2  | Media / comprobado                    | `firebase.json`: ambos sitios tienen `nosniff`; solo docs tiene Referrer-Policy. No hay CSP, X-Frame-Options ni frame-ancestors versionados. No demuestra XSS explotable.                                                                                               | Mantenedor: proponer cabeceras contra enmarcado y referrer; ensayar CSP con OAuth popup, fuentes, estilos y PWA antes de autorizar publicación.                                           |
| R3  | Media / superficie comprobada         | `quasar.config.js`: prefijos de cliente `VITE_FIREBASE_` y `QCLI_`; `.env.example` vacío. `src/boot/firebase.js` usa seis identificadores Firebase públicos. No se encontró una clave privada o token en el árbol escaneado.                                            | Desarrollo: ningún secreto en esos prefijos, revisión de variables nuevas y bundle. Verificar restricciones de API key en consola sin copiarla. La API key web no sustituye autorización. |
| R4  | Media / pendiente externo             | `src/services/auth-service.js`: email/password y Google, persistencia local con alternativa en memoria. `serializeAuthUser` conserva UID/email/perfil, sin tokens. La UI no certifica proveedores, dominios, plantillas, protección de enumeración o revocación reales. | Responsable Auth: revisar configuración sin listar usuarios ni enviar correo. Mantener pendiente aceptación OAuth/recuperación real.                                                      |
| R5  | Media / pendiente operativo           | `SECURITY.md` conserva una referencia obsoleta al PR #2 «en revisión»; ya advertía de canal privado pendiente. ML-11/12 requieren responsables y doble control.                                                                                                         | Se actualiza y amplía el procedimiento existente; mantenedor debe verificar canal privado y responsables. No inventar buzón ni prometer SLA.                                              |
| R6  | Media / riesgo residual               | CI instala dependencias y Firebase CLI; `npm ci` usa lockfiles, pero scripts de instalación ejecutan código de terceros. Acciones por SHA; runner Ubuntu alojado; no hay secretos ni despliegue declarados en workflow.                                                 | Revisar cambios de lockfile, procedencia y avisos; ejecutar sin credenciales cloud. Un audit limpio no certifica ausencia de código malicioso.                                            |
| R7  | Alta / pendiente externo              | PAT, GitHub Apps, OAuth Apps, secrets de repositorio/entorno/organización, protección de ramas y usuarios autorizados no están definidos por `.github/workflows/ci.yml`.                                                                                                | Administrador GitHub: inventariar permisos, repositorios, expiración, propietarios y última necesidad; no rotar/revocar desde esta tarea.                                                 |
| R8  | Baja / control comprobado             | CI: `contents: read`, checkout sin persistir credenciales, acciones con SHA completo, artefactos sintéticos con retención 7 días.                                                                                                                                       | Conservar política; detector offline bloquea deriva privilegiada conocida. Revisar manualmente artefactos y nuevos workflows; no subir logs de cuentas reales.                            |
| R9  | Media / superficie pública comprobada | VitePress compila páginas aunque no estén en sidebar; copia measurements, dos auditorías JSON y avisos legales generados. Identificadores de proyecto/sitio/ruleset y commits en informes son metadatos, no credenciales.                                               | Revisor de privacidad: revisar inventario y build, no confiar en ocultar navegación. Para datos reales retirar con autorización, valorar cachés/historial y copias.                       |
| R10 | Baja / alcance comprobado             | `firestore.rules`: propiedad por UID de ruta, forma cerrada en create/update, marcas temporales, listas/cadenas acotadas, límite list 5001 y denegación residual. Pruebas existentes cubren terceros, anónimos, campos extra y barrera de borrado.                      | Conservar emulador. No certifica rules desplegadas, revocación de token, cuota por usuario ni límite total de biblioteca. Un propietario puede consumir cuota con peticiones repetidas.   |

## Reglas y privacidad

Create y update reutilizan la misma validación de forma. Update conserva createdAt;
ningún campo aportado por el cliente concede rol administrativo. La propiedad se
comprueba además de hasOnly; no depende de email ni de email_verified. Los límites
de fuentes/géneros/notas y timestamps se validan en servidor. La barrera deleting
impide escrituras nuevas y conserva lectura/borrado del propietario aceptado: es
el comportamiento deliberado ML-10/11/12, no prueba de revocación inmediata.
Los clientes no acceden a subcolecciones desconocidas. Las rules no limitan un
operador IAM a un solo UID ni garantizan borrado de residuos desconocidos.

No se identificaron UID de usuarios reales, emails de usuarios, enlaces de
recuperación, referencias de soporte reales, claves privadas o tokens en las
fuentes documentales revisadas. Es una revisión acotada y heurística, sin garantía
sobre historial Git completo, adjuntos, imágenes, logs externos o datos remotos.
Los UID sintéticos de tests se contrastan con su generador demo; «UID» en una
plantilla no es un dato real. Los correos de autoría en avisos de terceros y el
noreply de package.json se conservan por procedencia/licencia (ML-14).

Un UID es identificador personal potencial, no contraseña. Tokens ID, refresh,
acceso, códigos de recuperación y claves privadas son secretos. Una referencia
de soporte puede vincular un caso a una persona: tampoco debe publicarse.
No se acepta un UID/email aportado como prueba de identidad. Las plantillas
ML-11/12 siguen vacías y privadas al completarse; los plazos de retención y
revisión humana a los 30 días siguen pendientes, sin automatizar borrados.

## Checklist manual de consola (sin ejecutar)

Conservar acta restringida con fecha, proyecto contrastado, operador, revisor,
resultado por punto y referencia de evidencia mínima. La versión pública solo
lleva estado y recuentos; nunca exportar miembros nominales, claves o bibliotecas.

- [ ] IAM & Admin: revisar roles directos e heredados de organización/carpeta,
      grupos y miembros externos; allUsers/allAuthenticatedUsers, condiciones,
      roles personalizados y privilegios Owner/Editor innecesarios.
- [ ] Cuentas de servicio: finalidad, claves administradas por usuario, antigüedad,
      impersonación, Service Account User/Token Creator y federación de identidad.
      No crear claves, descargarlas, cambiar políticas ni retirar service agents.
- [ ] Contrastar Firebase «Usuarios y permisos» con IAM completo de GCP; la vista
      Firebase no incluye necesariamente todos los principales.
- [ ] API keys: restricciones de APIs/aplicación y origen esperado; revisar sin
      mostrar valores ni probar usos alternativos. No activar APIs nuevas.
- [ ] Auth: proveedores, dominios autorizados, redirecciones, plantillas de acción,
      protección de enumeración y política de contraseña compatibles con Spark.
      No listar usuarios ni enviar correos, generar enlaces o revocar sesiones.
- [ ] Firestore: edición Standard, reglas/releases efectivos contra fuente
      aprobada; no consultar documentos. Revisar exceso de permisos de datos.
- [ ] Hosting: app/docs separados, dominios, cabeceras y caché de versión efectiva.
      Revisar también retención de builds y exposición de mapas/descargas.
- [ ] GitHub: protección main, revisiones requeridas, entornos, permisos por
      defecto del token, aprobación de forks, Apps/OAuth/PAT y secrets por nivel.
      Registrar nombres funcionales y alcance; no revelar valores.
- [ ] Terceros: soporte Proton/Nextcloud continúa propuesto; no asumir servicio
      activado. Revisar operadores, comparticiones, expiración, custodia y borrado
      de copias solo tras aprobación ML-11/12; sin cuentas ni carpetas nuevas.
- [ ] Spark: comprobar plan y facturación desvinculada con acceso autorizado;
      no habilitar billing, Blaze, Identity Platform ni infraestructura de pago.
- [ ] Asignar responsables de incidentes, canal privado y revisión periódica;
      pendientes y excepciones deben tener propietario y fecha de próxima revisión.

## Roles mínimos propuestos, sin concesiones

Validar permisos individuales vigentes y alcance en consola antes de aprobar.
No existe un único rol seguro para todas las labores.

| Tarea                                           | Acceso candidato                                                           | Límite                                                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Auditar repositorio, compilar y probar demo     | GitHub lectura; CI contents:read; ningún rol GCP                           | No credenciales de despliegue ni datos reales                                                                             |
| Revisar política IAM                            | Permiso resourcemanager.projects.getIamPolicy, con rol de lectura aprobado | No usar Owner como atajo; la lectura revela identidades                                                                   |
| Revisar Hosting                                 | roles/firebasehosting.viewer                                               | No autoriza publicar                                                                                                      |
| Publicar Hosting en una tarea futura autorizada | roles/firebasehosting.admin y roles/serviceusage.apiKeysViewer según CLI   | Es más amplio que subir un sitio; revisar alcance y hooks Spark; ningún despliegue aquí                                   |
| Revisar rules                                   | roles/firebaserules.viewer                                                 | No publicar reglas; despliegue separado y expresamente autorizado                                                         |
| Revisar Auth                                    | Permisos de configuración mínimos aprobados                                | roles/firebaseauth.viewer puede revelar usuarios; no concederlo por defecto para esta auditoría                           |
| Consultar datos de un caso aprobado             | Procedimiento ML-11/12 y permisos temporales específicos                   | roles/datastore.viewer permite leer datos y no equivale a «solo metadatos»; IAM no ofrece por sí solo aislamiento por UID |
| Revisar facturación                             | Lectura específica autorizada                                              | No Billing Admin ni vinculación de cuenta; no requerida por CI                                                            |

## Inventario y redacciones

El [inventario público por archivo](/security/public-inventory) cubre páginas,
JSON/mediciones, diagramas y otros assets versionados. La salida local del control
incluye el listado completo y el número de archivos compilados. Los avisos legales
se generan además en build por ML-14; la búsqueda local también publica fragmentos.

| Material                                                            | Decisión de publicación / redacción                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Guía, arquitectura, referencia, mantenimiento, desarrollo y roadmap | Mantener contratos y límites; no añadir capturas o ejemplos de cuentas reales                                                   |
| Informes security/operations y measurements                         | Mantener metadatos históricos de proyecto/sitio/ruleset y demo; no constituyen comprobación actual ni autorización              |
| Informes y plantillas accounts ML-11/12                             | Mantener propuestas sin completar; cada caso rellenado va fuera de Git/portal, con UID/email/referencias redactados             |
| Diagramas y SVG                                                     | Revisión textual y render habitual; sin evidencia de datos reales. El detector no hace OCR                                      |
| Avisos legales y propuestas ML-14                                   | Conservar atribuciones y emails de autores exigidos por avisos; no confundir con usuarios del producto                          |
| Secrets, logs operativos, exportaciones, HAR y capturas privadas    | No incorporar. Ninguna redacción concreta de datos reales se identificó en el árbol revisado; revisión humana previa a publicar |

Si se descubre información sensible posteriormente, no copiarla en el PR: registrar
solo ubicación/tipo en privado. Retirar del sitio requiere autorización de despliegue;
borrar una página o quitar sidebar no elimina caché, historial o copias de terceros.
El procedimiento de divulgación está en SECURITY.md en la raíz del repositorio.

## Controles reproducibles y límites

`npm run audit:security` no accede a red, variables de entorno ni Firebase. Escanea
archivos seguidos por Git: patrones de credenciales, archivos privados y política
conservadora de CI. `npm run audit:security:built` exige build local y revisa también
HTML, assets de búsqueda, JSON copiados y avisos generados. Solo registra ruta,
línea y tipo, nunca el valor detectado. Las pruebas inyectan secretos sintéticos y
escaladas de permisos para comprobar detección y supresión de valores.

Son alarmas heurísticas, no análisis completo de flujo de datos o parser YAML.
No detectan todo formato de secreto, datos personales arbitrarios, OCR ni historial.
La CI conserva npm audit de ambos lockfiles, emulador demo y revisión documental
ML-05; un resultado limpio no cierra IAM, privacidad, cuota ni aceptación humana.
No se ejecutan check:spark:remote, deploy ni comandos de administración en ML-13.

La consulta de avisos npm del 23/10/2026 devolvió cero vulnerabilidades conocidas
en ambos lockfiles (incluido desarrollo). Se mantuvo TLS usando certificados del
sistema. Esto no comprueba paquetes globales, reputación ni riesgos no publicados.

Fuentes primarias consultadas el 23/10/2026:
[IAM Firebase](https://firebase.google.com/docs/projects/iam/overview),
[roles por producto](https://firebase.google.com/docs/projects/iam/roles-predefined-product),
[IAM Firestore](https://firebase.google.com/docs/firestore/security/iam),
[API keys](https://firebase.google.com/docs/projects/api-keys),
[checklist Firebase](https://firebase.google.com/support/guides/security-checklist) y
[GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token).
