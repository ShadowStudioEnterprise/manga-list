# ML-11: revisión manual de marcadores a los 30 días

Estado: **validación técnica parcial y propuesta operativa; pendiente de aceptación
expresa y revisión jurídica**. Fecha: 21/10/2026, Europe/Madrid. No constituye un
dictamen de cumplimiento ni autoriza operaciones sobre personas reales.

## Alcance y evidencia

Base auditada: `23e9b1da5b2ede0159038057fd46906d0bde513e` de `origin/main`,
actualizada por Git el 21/10/2026. La conversación anterior solo permitió recuperar
referencias sin el contenido de las respuestas. Las decisiones anteriores citadas
en documentos se consideran antecedentes, no autorización nueva de actuaciones.

Se revisaron [revisión manual](manual-marker-review.md),
[retención](account-marker-retention-proposal.md),
[asistencia](abandoned-deletion-assistance.md), `firestore.rules`,
`src/services/account-service.js`, `src/stores/auth-store.js`,
`src/pages/SettingsPage.vue`, `src/utils/spark-budget.js`, pruebas y CI.
No se consultaron Auth, Firestore, IAM, facturación ni reglas desplegadas.
El estado del código no demuestra el estado efectivo de producción.

| Aspecto                       | Implementado y verificable en repositorio                                                                                                              | Límite o pendiente                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Identidad del flujo ordinario | Reautenticación por contraseña o Google, comprobación de sesión antes de limpiar y borrar Auth                                                         | No acredita representación, soporte administrativo ni identidad tras desaparecer Auth                             |
| Inicio                        | Transacción crea o conserva `users/{uid}` con `status: deleting` antes de borrar mangas                                                                | `updatedAt` es inicio; no hay `completedAt`, expediente ni confirmación operativa final persistida                |
| Limpieza                      | Lecturas servidor, lotes de 400, máximo 5 lotes por intento; después de consulta vacía se intenta `deleteUser`                                         | Solo recorre `mangas`, no inventario global ni subcolecciones desconocidas; requiere cliente abierto y reintentos |
| Fallos                        | Conserva marcador ante interrupción, cuota o fallo Auth; no borra Auth antes de agotar mangas                                                          | No trabajador de fondo ni servicio de asistencia implementado; silencio del usuario no prueba finalización        |
| Barrera                       | Propietario exacto por UID; `getAfter` protege creación/actualización de mangas incluso en lote; marcador no se puede actualizar ni borrar por cliente | No comprueba revocación, edad del marcador, autoridad administrativa ni ausencia actual en Auth                   |
| Lecturas y borrados           | Propietario con token aceptado puede leer marcador/mangas y borrar mangas; terceros/anónimos denegados                                                 | No es revocación inmediata ni bloqueo jurídico acreditado                                                         |
| Datos                         | Marcador limitado a `createdAt`, `updatedAt`, `status`; ruta contiene UID                                                                              | UID vinculable sigue siendo dato personal; no anonimización                                                       |
| Revisión a 30 días            | Documentada; regresión existente de edades 29/30/90                                                                                                    | No calendario, motor de revisión, acta, doble aprobación ni herramienta de retirada                               |
| Dispositivos                  | Tras éxito, store limpia borradores del navegador actual y ajustes                                                                                     | No demuestra borrado de descargas, otros dispositivos, copias o registros del proveedor                           |
| Spark                         | Sin cambios de dependencias, reglas, aplicación o configuración en ML-11                                                                               | La comprobación estática no certifica plan remoto ni cuotas reales                                                |

El checklist de reglas (identidad, autoridad, create/update, tipos, campos y límites)
no detecta en este alcance un bypass del marcador por otro cliente. La valoración
estructurada está en [auditoría de reglas](ml-11-rules-audit.json). Se mantiene un
riesgo de privacidad conocido: un token aceptado todavía puede leer datos pendientes.
Las herramientas Admin omiten las reglas: ninguna prueba de cliente demuestra
que un operador administrativo esté autorizado.

## Evaluación jurídico-técnica y fuentes

La conclusión técnica es que el marcador evita recreación de mangas mientras
permanece. Su necesidad durante 30 días, su base jurídica y su proporcionalidad
**no quedan demostradas** por esa propiedad ni por aceptar esta propuesta.

Fuentes oficiales consultadas el 21/10/2026 (sin citas literales):

- [RGPD, arts. 5, 6, 12, 13, 17, 19, 24, 25 y 32](https://eur-lex.europa.eu/legal-content/ES/ALL/?uri=CELEX%3A32016R0679): marco para minimización, licitud, transparencia, derechos y seguridad. La página completa de EUR-Lex presentó una verificación de navegador durante esta revisión; contrastar el texto oficial y sus correcciones en la revisión jurídica.
- [CEPD: gestión de derechos](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_es): responder en un mes desde recepción; posible ampliación de dos meses con información dentro del primero; motivar la no actuación e informar de reclamación y acciones judiciales. **Un mes no equivale a 30 días**. El reloj de derechos se lleva por separado del marcador y no se reinicia por abandono, cuota o falta de personal.
- [AEPD: supresión](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-supresion-al-olvido) y [verificación de identidad](https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/3-identificacion-con-dni/FAQ-0108-para-el-ejercicio-de-estos-derechos-es-necesario-facilitar-la-copia-del-dni): no pedir DNI por defecto; resolver dudas razonables mediante información necesaria y proporcionada.
- [LOPDGDD, art. 32](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673#a3-4): el bloqueo legal reserva datos para responsabilidades y limita su uso y visualización; su duración depende de prescripción. No convierte 30 días en plazo legal ni justifica conservar una biblioteca completa.
- [Firebase: sesiones](https://firebase.google.com/docs/auth/admin/manage-sessions), [eliminación y subcolecciones](https://firebase.google.com/docs/firestore/manage-data/delete-data), [cuotas y TTL](https://firebase.google.com/docs/firestore/quotas): retirar un padre no elimina descendientes; los ID tokens y la revocación exigen análisis propio; TTL requiere facturación para sus borrados. No se adopta TTL, cron, Functions, extensiones ni Blaze.

Se debe encargar a asesoría jurídica que determine: responsable del tratamiento y
encargados; base jurídica concreta de marcador y expedientes por finalidad; análisis
de necesidad frente a alternativas menos intrusivas; aplicación y medios de bloqueo
del art. 32 LOPDGDD; prescripciones pertinentes por categoría, sin elegir un plazo
genérico; excepciones de supresión; transparencia, contratos y transferencias del
proveedor; comunicaciones a destinatarios cuando proceda y necesidad de DPD/EIPD.
No se ha acreditado que el marcador actual satisfaga bloqueo legal: sigue siendo
operativo, es visible al propietario autenticado y carece de reserva jurídica separada.

El margen de 24 horas del diseño previo es una cautela propuesta, no garantía de
extinción de todas las credenciales. Los ensayos inyectan un contexto autenticado;
no simulan ni certifican vencimiento o revocación de tokens reales. Una retirada
administrativa sintética demuestra que, sin marcador, ese contexto vuelve a escribir.
La revisión favorable solo puede recomendar una actuación futura, nunca ejecutarla.

## Procedimiento y aceptación

El [procedimiento propuesto](ml-11-operating-procedure.md) concreta los relojes,
responsabilidades, expediente, excepciones y decisiones. Complementa los tres
documentos anteriores y precisa que sus plazos adicionales siguen sin aprobarse.

| Criterio           | Evidencia exigida para aceptar ML-11                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin automatismo    | Reglas idénticas a base; edades 29/30/90 no desbloquean ni retiran; no ejecutor de retirada                                                       |
| Privacidad         | Terceros/anónimos sin acceso; sin campos extra en marcador; datos y credenciales reales ausentes del diff                                         |
| Riesgos visibles   | Ensayo de lectura/borrado con token aceptado, escritura tras retirada sintética y descendientes que sobreviven al padre                           |
| Flujo              | Regresiones de interrupción, fallo Auth, cuota, sesión distinta y reanudación; Auth no se elimina prematuramente                                  |
| Revisión propuesta | Casos sintéticos de umbral exacto, fecha ausente, identidad/autoridad, fallo de inventario y excepciones; resultado máximo `proponer`, sin borrar |
| Documentación      | Enlaces locales construyen y no presentan propuesta como política legal aprobada                                                                  |
| Activación futura  | D1–D7 aceptadas expresamente, responsables designados y revisión jurídica documentada; autorización por caso aparte                               |

Resultados de ejecución se registran en [evidencia ML-11](ml-11-test-evidence.md).
Un resultado verde verifica esos comportamientos en pruebas, no cumplimiento RGPD,
configuración desplegada, coste cero real ni finalización de una cuenta.
