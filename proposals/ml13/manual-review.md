# ML-13: paquete de revisión manual

Preparado el 23/10/2026 para el [PR borrador #18](https://github.com/ShadowStudioEnterprise/manga-list/pull/18).
Estado: preparado, sin revisión humana realizada ni decisiones aceptadas.
La preparación de este paquete no concede acceso, no habilita un canal de soporte
y no autoriza fusión, publicación o remediación remota.

## Cómo iniciar la revisión

1. El titular designa una persona revisora técnica y otra responsable de privacidad
   o contraste independiente. Registrar sus identidades solo en el acta restringida.
   Si faltan responsables, dejar la revisión pendiente; no suponer nombramientos.
2. Copiar [la plantilla vacía](manual-review-acta.md) fuera del repositorio
   antes de completarla. Confirmar acceso restringido del destino; una carpeta
   denominada «private» no acredita permisos ni cifrado. No subir el acta cumplimentada
   a GitHub, VitePress, Actions o un chat público.
3. Anotar en el acta el SHA exacto de cabeza del PR, la base y la fecha de la revisión.
   Si cambia la cabeza, revisar el nuevo diff y su CI antes de firmar. El candidato
   técnico anterior fue `7448cff4289eaf251dd33120487411a3dd316a43`, con CI correcta de
   [push](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39880786300)
   y [pull_request](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/39880800769).
   Esas ejecuciones no certifican los commits posteriores de este paquete.
4. Revisar primero el bloque A, que solo requiere repositorio y evidencias sintéticas.
   El bloque B se entrega a una persona con acceso de lectura ya autorizado. No se
   ejecuta desde esta preparación ni se concede un rol para desbloquearlo.
5. Completar cada resultado como conforme, hallazgo, no comprobable o no aplica
   justificado. «No comprobable» nunca equivale a conforme. Toda conclusión debe
   citar evidencia mínima y fecha; no copiar secretos o identidades en el resumen.

## Bloque A: revisión del PR y de la superficie pública

| ID  | Qué revisar                              | Evidencia de partida                                                                   | Criterio de aceptación                                                                                                                                  |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Base, cabeza, CI y alcance del diff      | PR #18; historial; comparación con main                                                | SHA anotado, CI de esa cabeza comprobada, sin cambios de aplicación/rules/Hosting ni acciones remotas añadidas                                          |
| A02 | Aislamiento entre usuarios y claims      | firestore.rules; tests/firestore/security.test.js; rules-audit.json                    | Propiedad de ruta, create/update coherentes, terceros y claims admin denegados; no confundir emulador con rules desplegadas                             |
| A03 | Secretos y variables cliente             | .env.example; quasar.config.js; src/boot/firebase.js; scripts/security-audit.mjs       | Ninguna variable prefijada contiene secretos; lector entiende que config web y API key Firebase no son autorización; alcance heurístico declarado       |
| A04 | Permisos y terceros de CI                | .github/workflows/ci.yml; ambos lockfiles; evidencia npm                               | contents:read, SHA completos, credenciales no persistidas, demo, retención 7 días; dependencias/scripts revisados sin asumir seguridad por audit limpio |
| A05 | Páginas, búsqueda y descargas del portal | docs/security/public-inventory.md; build local; evidence/public-sample.json            | Revisar páginas fuera del sidebar, JSON copiados, búsqueda, assets y legal; no publicar UID/email/casos/códigos reales                                  |
| A06 | Tratamiento de datos y atribuciones      | Matriz de redacciones de docs/security/iam-audit.md; avisos ML-14; plantillas accounts | Conservar atribuciones legales; ejemplos de usuario sintéticos trazables; actas reales fuera del repositorio                                            |
| A07 | Cabeceras y riesgo residual              | firebase.json; seis respuestas HTTP de la muestra                                      | Reconocer falta de CSP/protección contra enmarcado; decidir seguimiento con responsable y criterio de ensayo; no afirmar corrección desplegada          |
| A08 | Divulgación y soporte                    | SECURITY.md; procedimientos ML-11/12                                                   | No inventar canal, SLA o responsables; confirmar límites de retención, identidad y doble control; las propuestas no figuran activadas                   |

Las evidencias fechadas están en [evidence/validation.json](evidence/validation.json),
[evidence/public-sample.json](evidence/public-sample.json) y
[rules-audit.json](rules-audit.json). La matriz de riesgos está en
[docs/security/iam-audit.md](../../docs/security/iam-audit.md).
En el diff de GitHub los documentos son públicos, aunque todavía no se hayan
publicado en Hosting. Un archivo fuera de docs también es visible en el repositorio.

## Bloque B: comprobaciones externas de lectura, pendientes

Antes de abrir una consola: contrastar proyecto y alcance autorizado, confirmar
cuenta y permiso de lectura existentes y cerrar herramientas de escritura. Si no
hay autorización o acceso suficiente, registrar no comprobable. No solicitar
Owner/Editor como atajo, iniciar sesión con una cuenta ajena ni extraer tokens.
No abrir listas de usuarios o documentos de Firestore para comprobar configuración.

| ID  | Vista / objeto a revisar manualmente                                          | Resultado mínimo que puede conservarse sin datos reales                                                                        |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| B01 | GCP IAM: roles directos, heredados, condiciones, grupos y acceso público      | Cobertura de herencia/grupos, recuento de excepciones y referencia restringida; no publicar miembros ni emails                 |
| B02 | Cuentas de servicio: claves de usuario, impersonación, federación y finalidad | Existencia de claves y exceso de alcance por función; no revelar claves ni retirar service agents                              |
| B03 | Comparación de permisos Firebase y GCP                                        | Si ambas vistas y roles personalizados se cubrieron o qué acceso faltó; no certificar IAM completo desde una sola vista        |
| B04 | API keys: restricciones de APIs y aplicación                                  | Restricciones esperadas contrastadas; registrar estado sin valor de la clave, sin pruebas contra APIs alternativas             |
| B05 | Auth: proveedores, dominios y configuración de acciones/contraseña            | Coincidencia con diseño email/Google, pendientes de aceptación real; sin correos, enlaces de recuperación o usuarios           |
| B06 | Firestore: edición y release/ruleset efectivos                                | Comparación de fuente aprobada y reglas efectivas por metadatos autorizados; sin datos ni despliegue                           |
| B07 | Hosting app/docs: versión, dominios, cabeceras, descargas y caché             | Separación de sitios y alcance de la muestra; no confundir artefacto local con versión publicada                               |
| B08 | GitHub: main, entornos, forks, token por defecto y requisitos de revisión     | Excepciones y cobertura del control de rama; no cambiar ajustes                                                                |
| B09 | GitHub Apps/OAuth/PAT y secrets por nivel                                     | Propietario funcional, permisos, alcance, caducidad y necesidad contrastados en privado; nunca valores de secretos o tokens    |
| B10 | Proton/Nextcloud u otro soporte propuesto                                     | Aclarar si existe servicio real y si hay permiso para revisarlo; no crear cuentas/carpetas ni dar por activadas las propuestas |
| B11 | Plan y facturación                                                            | Estado Spark y desvinculación de billing comprobables con lectura autorizada, o no comprobable; no habilitar nada              |
| B12 | Canal privado, custodio, revisor y responsables de incidentes                 | Disponibilidad verificada y responsable designado en acta privada; no publicar datos de contacto sin decisión del titular      |

La [tabla de roles candidatos](../../docs/security/iam-audit.md#roles-mínimos-propuestos-sin-concesiones)
es una referencia de diseño, no una orden de concesión. Incluso un rol viewer
puede revelar datos personales. Registrar el exceso de alcance y no usarlo para
consultar información que la tarea excluye.

## Decisión individual de los riesgos

Completar R1–R10 en el acta; no aceptar en bloque por CI correcta.

| Riesgo                  | Contraste mínimo | Decisión humana pendiente                                                                                      |
| ----------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| R1 IAM efectivo         | B01–B03, B06     | Cobertura de lectura y exceso; mantener abierto si no comprobable                                              |
| R2 Cabeceras            | A07, B07         | Responsable y siguiente paso de hardening, con ensayo OAuth/PWA antes de proponer despliegue                   |
| R3 Variables/API keys   | A03, B04         | Aceptar identificadores públicos solo con revisión de uso; restricciones externas pendientes si no se observan |
| R4 Auth                 | A02, B05         | Separar configuración observada de aceptación OAuth/recuperación no realizada                                  |
| R5 Canal y responsables | A08, B12         | Designación y canal verificado; ningún SLA asumido                                                             |
| R6 Dependencias         | A04              | Revisión de procedencia/scripts, fecha de advisories y seguimiento del riesgo residual                         |
| R7 Tokens/terceros      | B08–B10          | Alcance/expiración/necesidad; mantener pendiente lo no visible                                                 |
| R8 CI                   | A01, A04         | Confirmar privilegios y evidencia del SHA revisado                                                             |
| R9 Documentos públicos  | A05–A06, B07     | Aprobar redacciones/conservación y excluir expedientes reales; no afirmar retirada de cachés sin evidencia     |
| R10 Rules/cuota         | A02, B06, B11    | Conservar límites ML-10/11/12 y riesgo de cuota; no certificar revocación ni capacidad definitiva              |

Para aceptar un riesgo residual debe constar motivo, evidencia, responsable de
seguimiento y fecha de próxima revisión. No aceptar por silencio ni convertir un
permiso ausente en excepción aprobada. Una remediación se propone por separado;
la firma de esta acta no la ejecuta ni autoriza.

## Cierre y condiciones de parada

- Si se detecta secreto o dato personal real, detener la difusión de esa evidencia,
  usar el canal restringido y registrar solo tipo/ubicación. No pegar el valor en
  comentarios ni abrir un issue público. No rotar, borrar historial o desplegar
  desde esta revisión; aplicar el procedimiento de incidente con autorización.
- Si cambian cabeza, base o alcance durante la revisión, contrastar el diff y
  actualizar el acta. Una CI de otro SHA no sirve como aprobación del candidato.
- El resultado «revisión documental conforme con pendientes externos» permite
  registrar calidad y alcance del PR; no cierra IAM real ni activa ML-11/12.
- «Revisión operativa completa» requiere evidencia externa de todos los puntos
  aplicables, resolución o aceptación expresa de riesgos residuales, y contraste
  independiente. No se puede declarar mientras B01–B12 estén pendientes.
- Registrar cambios requeridos si hay evidencia insuficiente, conclusión engañosa
  o dato sensible. Un no aplica necesita motivo y revisor, no una casilla vacía.
- Fusión y publicación requieren instrucciones expresas separadas del usuario.
  El PR se mantiene en borrador y esta tarea no modifica permisos ni producción.

## Acta y resumen publicable

La plantilla contiene todos los puntos A/B y riesgos, inicialmente pendientes.
Guardar la copia completada en almacenamiento con acceso restringido aprobado;
solo referencias opacas conectan el acta con evidencia mínima. No adjuntar HAR,
capturas, listados de miembros, bibliotecas ni nombres de casos reales al PR.
El titular debe validar custodia, acceso y retención; no se inventa un plazo.

El resumen publicable solo incluirá SHA revisado, fecha, recuentos por resultado,
riesgos todavía abiertos y alcance de la decisión. No llevará nombres de
revisores, emails, UID, enlaces al acta privada o referencias de soporte.
Antes de publicarlo, contrastar redacciones y evitar que los recuentos o descripciones
identifiquen indirectamente a una persona. Ninguna sección de esta plantilla
constituye por sí sola un dictamen legal o aceptación de seguridad.
