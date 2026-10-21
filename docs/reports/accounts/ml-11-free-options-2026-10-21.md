# ML-11: alternativas gratuitas al archivo Nextcloud

**Decisión posterior del usuario:** [Proton Drive seleccionado para preparación](proton-drive-implementation-proposal.md).
Las recomendaciones de ensayo Nextcloud de este informe quedan como antecedentes.

Consulta de fuentes oficiales: 21/10/2026. El promotor indica que solo dispone de
su ordenador habitual. Evaluación documental: no se han creado cuentas, instalado
servicios, contactado con proveedores ni cargado expedientes reales.

## Recomendación adaptada al presupuesto cero

**Sí existen cuentas Nextcloud alojadas sin cuota.** Para conocer la interfaz sin
administrar un servidor, priorizar un ensayo con datos ficticios en The Good Cloud
(2 GB); TAB.DIGITAL anuncia 8 GB gratuitos, pero su enlace de alta consultado vuelve
a la portada: confirmar que el alta gratuita está disponible antes de elegirlo.
No se ha probado ninguno ni se les atribuyen controles no verificados.

Para buscar un sustituto con auditoría, evaluar **Seafile Professional para hasta
tres usuarios**, cuya licencia se anuncia gratuita. Necesita servidor; por tanto
no elimina el alojamiento. Con el único ordenador disponible, su encaje inmediato
es un ensayo local, accesible solo mientras el equipo esté encendido y sin abrirlo
a Internet. No se ha instalado ni se ha acreditado su aptitud ML-11.

Si se quiere Nextcloud completo en Internet sin alquiler, Oracle Always Free es
una vía posible, condicionada a disponibilidad, cuotas, mantenimiento y revisión
del proveedor. No recomendarlo como única custodia de expedientes: Oracle puede
recuperar instancias inactivas. No simular carga para eludir esa política.

El presupuesto anterior de 30–50 €/mes correspondía a una arquitectura propia con
registro separado y copias; **no es una tarifa mínima de Nextcloud**. Ese software
se puede usar sin cuota de licencia y existen terceros que financian cuentas
gratuitas. Cero euros de suscripción no equivale a continuidad, trabajo y respaldo
sin coste, ni a cumplimiento jurídico acreditado.

## Opciones contrastadas

| Opción                             | Qué es gratis                                            | Alojamiento                    | Encaje y límites observados                                                                                                                                    |
| ---------------------------------- | -------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nextcloud de The Good Cloud        | Cuenta con 2 GB                                          | Incluido en la oferta gratuita | Ensayo sencillo de interfaz y archivos ficticios. No se acreditan administración de instancia, exportación de auditoría, custodia independiente o N3.          |
| Nextcloud de TAB.DIGITAL           | Cuenta anunciada con 8 GB, sin método de pago            | Incluido según anuncio         | Mayor espacio anunciado; alta efectiva y condiciones específicas del plan pendientes. No extrapolarle las funciones de los planes privados de pago.            |
| Nextcloud en el ordenador habitual | Software comunitario                                     | El propio ordenador            | Sin alquiler; consume recursos, energía y tiempo. Adecuado para laboratorio local. No hay equipo dedicado, respaldo independiente ni continuidad acreditada.   |
| Nextcloud en Oracle Always Free    | Recursos elegibles dentro de cuotas                      | OCI en región principal        | Posible servidor sin cuota; capacidad no garantizada y recuperación por inactividad. No confundir con los créditos de prueba de 30 días.                       |
| Seafile Professional autohospedado | Licencia para hasta 3 usuarios                           | No incluido                    | Alternativa de servidor con auditoría documentada; el coste del servidor, copias y mantenimiento persiste. Validar cómo computan todas las cuentas necesarias. |
| Proton Drive Free                  | 2 GB iniciales; hasta 5 GB cumpliendo acciones iniciales | Incluido                       | Almacenamiento cifrado para evaluar con archivos ficticios; no se acredita como gestor de expedientes con registro independiente o N3.                         |
| Syncthing                          | Sincronización entre equipos                             | No aporta alojamiento en nube  | Con un solo equipo no resuelve la custodia externa. Replica cambios y borrados; su registro no equivale a auditoría completa de accesos humanos.               |

Las cuotas son almacenamiento compartido o recursos limitados, no una promesa de
instancia dedicada, equipo multiusuario ni servicio mantenido a medida de ML-11.
No se permite compartir una contraseña para aparentar varias personas.

## Detalle y fuentes

**Nextcloud alojado gratis.** El [programa oficial Simple Signup](https://nextcloud.com/sign-up/)
remite a terceros; Nextcloud GmbH no presta la cuenta ni atiende sus incidencias.
[The Good Cloud](https://buy.thegood.cloud/en/faq) confirma 2 GB y limitaciones del
plan gratuito. No se eleva su oferta a servicio empresarial validado.
[TAB.DIGITAL](https://cloud.tab.digital/pricing) anuncia 8 GB sin método de pago;
el enlace público consultado no confirmó el proceso de alta. Antes de usar datos
reales faltan condiciones del plan, finalidad admitida, contrato de encargo cuando
proceda, conservación/inactividad, ubicación, exportación y pruebas de controles.
No se afirma que un proveedor carezca de capacidades porque no las detalle.

**Oracle.** La [documentación Always Free vigente](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
indica recursos A1 equivalentes a 2 OCPU y 12 GB RAM y 200 GB combinados de discos
de arranque/datos en la región principal, sujetos a cuotas. No reutilizar cifras
antiguas de 4 OCPU/24 GB como oferta actual. Advierte de falta de capacidad y de
recuperación de instancias con baja utilización durante siete días. La
[guía Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)
separa recursos gratuitos de créditos promocionales y señala que normalmente se
requieren teléfono y tarjeta; no cobra la tarjeta sin pasar a pago. No crear una
cuenta ni aceptar sus términos dentro de esta evaluación. No recomendar ampliar
a Pay As You Go para obtener capacidad como solución de coste cero garantizado.
Las copias en la misma cuenta no acreditan custodia independiente.

**Seafile.** La [tarifa oficial](https://www.seafile.com/en/pricing/) confirma Pro
gratis hasta tres usuarios sin archivo de licencia. Es distinto de la prueba de
Seafile Cloud, que se desactiva a los 30 días y no sirve como archivo gratuito
permanente. Su [auditoría Pro](https://manual.seafile.com/latest/administration/auditing/)
documenta accesos de inicio de sesión y archivos, cambios de archivos y permisos,
guardados en la base del servicio. No demuestra registro independiente, cobertura
de todas las denegaciones ni bloqueo si falla la auditoría. La edición Pro tiene
[licencia propietaria](https://manual.seafile.com/latest/introduction/seafile_professional_edition_software_license_agreement/);
gratuita hasta ese límite no significa software libre ni alojamiento gratuito.

**Proton.** La [ampliación gratuita](https://proton.me/support/more-storage-proton-drive)
requiere completar acciones en los primeros 30 días para pasar de 2 a 5 GB. Una
acción incluye generar un enlace público: solo usar un archivo ficticio y retirar
el enlace al terminar; no proponer publicar un expediente para obtener espacio.
La [política de inactividad](https://proton.me/support/inactive-accounts) contempla
eliminación de cuentas gratuitas tras más de doce meses de inactividad. Mantener
actividad y una copia restaurable si se aprueba en el futuro como destino auxiliar;
no convertirlo en archivo único. Cifrado no demuestra trazabilidad de cada lectura.

**Syncthing.** Sus [preguntas frecuentes](https://docs.syncthing.net/users/faq.html)
explican que la sincronización propaga borrados y no sustituye a una copia de
seguridad; el registro puede omitir estados intermedios tras desconexiones. No se
elige como gestor central de expedientes ni como copia independiente automática.

## Qué haría con el único ordenador disponible

1. Mantener preparación y plantillas ficticias localmente, con coste de suscripción
   de 0 €. No reutilizar el volumen ni las credenciales del piloto previo como
   futura producción. No cambiar el router, abrir puertos o crear un túnel público.
2. Priorizar The Good Cloud 2 GB para un eventual ensayo de uso alojado sin cuota,
   sujeto a autorizar el alta y confirmar condiciones. Confirmar TAB.DIGITAL solo
   si se necesita más capacidad. Espacio de prueba propuesto: menos de 100 MB de
   archivos ficticios; no hace falta la hipótesis previa de 10 GB para este ensayo.
3. Conservar una exportación local del ensayo y comprobar que se puede recuperar.
   No considerar sincronización o historial como restauración demostrada.
4. Si falta auditoría suficiente, comparar Seafile Pro local hasta tres cuentas con
   el piloto Nextcloud. No instalar otra plataforma solo por su anuncio: definir
   primero las pruebas y comprobar que los roles caben sin compartir cuentas.
5. Mantener Oracle como alternativa secundaria para un laboratorio remoto, previa
   autorización del alta/ensayo y revisión de cuotas y términos; no asumir que se
   puede sostener gratuitamente toda la arquitectura propuesta.

## Controles y decisiones pendientes

D3 sigue vigente: revisor independiente pendiente. D1/D2, revisión humana y agenda,
D5, conservación, y D7, revisión jurídica, tampoco se resuelven con un plan gratis.
N1–N5 son propuestas nuevas pendientes; N3 de mediación y bloqueo ante fallo del
registro es una elección de diseño, **no una exigencia tecnológica literal del
RGPD**. Una solución documental más sencilla puede estudiarse con controles
alternativos y análisis de riesgo, sin presumir equivalencia ni rebajar D3.

Queda por aceptar: priorizar el ensayo gratuito de Nextcloud, comparar Seafile Pro
si los permisos/auditoría no bastan, y mantener 0 € como objetivo de suscripciones
sin prometer operación real cualificada a coste total cero. Cambiar de plataforma
o simplificar N3 exige actualizar la propuesta y hacer explícitas sus limitaciones.
Este informe no selecciona ni activa un canal real.

Pruebas futuras con casos ficticios: cuentas individuales y MFA, permisos de
lectura/escritura por rol, exportación, restauración, revocación, accesos y
denegaciones, retención, comportamiento ante fallo y posibilidad de conservar
evidencia fuera del alcance del operador. Un plan no apto para N3 puede servir
para aprender la interfaz sin convertirse en el sistema operativo de ML-11.

Firebase permanece exclusivamente en Spark. No se añade almacenamiento de
expedientes, credenciales administrativas ni costes a Firebase, y no se habilita
borrado automático de cuentas o marcadores. No hay validación jurídica definitiva.
