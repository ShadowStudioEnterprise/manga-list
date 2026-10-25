# Registro de cambios

Solo se registran como publicadas las versiones cuya publicación haya sido confirmada.
Los sellos de compilación, resultados CI y commits de una rama no constituyen una release.
Los despliegues históricos mencionados en el roadmap no se reconstruyen aquí sin evidencia.

## Sin publicar — candidata ML-09

- Búsqueda de biblioteca restaurada tras recargar, incluida la pausa de cuota:
  selección de hasta 512 caracteres en sessionStorage por pestaña, proyecto y
  cuenta, borrada al salir o cambiar de usuario. Sin persistir obras ni filtros.

- Congelación nativa: escucha retirada y aviso; recuperación manual con transporte
  local reiniciado, sin cancelar escrituras pendientes ni abrir reconexiones en bucle.

- Pausa local de cuota persistente por proyecto y compartida entre pestañas del
  mismo origen; un error en cualquier operación detiene los listeners activos.
- Plazo de un minuto sin confirmación de biblioteca, backoff de reconexión manual
  y protección ante fallos síncronos, conservando búsqueda/filtros del mismo dueño.
- Importación detenida al primer bloque con errores y causa visible; exportación
  simultánea por cuenta rechazada antes de leer; admisión por intento del marcador.
- Actualización transitiva de serialize-javascript a 7.1.4 en ambos lockfiles
  y fast-uri a 3.1.9 en PWA para corregir los avisos de auditoría, sin cambiar
  dependencias directas de la aplicación.
- Sin cambios de esquema, reglas o configuración remota. Presupuestos
  locales separados de cuota global; aceptación operativa y publicación pendientes.

## Sin publicar — seguimiento ML-16

- Aviso de actualización también en pestañas sin controlador cuando existe un worker
  esperando por otro cliente. Regresión con ambos tipos de cliente, sin forzar activación.
- Guía de recuperación alineada con el contrato vigente: consulta acotada a 5001
  e importación recuperable v1. No publicado.

## Sin publicar — candidata de release ML-16

- Actualización de serialize-javascript 7.1.2 a 7.1.4 en ambos lockfiles y de
  fast-uri 3.1.8 a 3.1.9 en el lockfile PWA para resolver los avisos conocidos
  detectados al preparar la release. Sin cambios de código de aplicación,
  reglas, contratos ni configuración Hosting. Pendiente de revisión y
  autorización separada para publicar; no se ha desplegado.

## Sin publicar — ML-P06 landing pública

- Portada responsive Ink/Paper/Violet con beneficios, capturas auténticas de
  pruebas, FAQ accesible y CTA a la Beta. Portal técnico conservado en `/project/`.
- HTML pre-renderizado, metadatos SEO/sociales y pruebas locales Chromium/Firefox
  a 320, 390, 768 y 1440 px, con temas claro y oscuro, integradas en CI.
- Sin cambios en la Beta o Firebase; sin fusión ni despliegue.

## Sin publicar — propuesta ML-02

- Portada del portal con hero personalizado, ilustración de biblioteca ficticia,
  accesos a las seis secciones e informes y enlaces a la guía y a la aplicación.
- Identidad índigo, fondos cálidos, modo oscuro, tipografía y focos visibles;
  navegación agrupada, sidebar de inicio y controles del portal en español.
- Verificación local reproducible de enlaces y anclas compilados, búsqueda,
  teclado, navegación móvil, contraste y tamaños de 320 a 1440 px mediante
  `node scripts/check-docs-portal.mjs`, después de `npm run docs:build`.
- Sin cambios en Firebase, reglas, facturación o datos. Sin fusión ni despliegue.

## Sin publicar — propuesta ML-14

- Enlaces a textos legales absolutos dentro de su sitio: conservan `/legal/`
  después de la redirección de URLs limpias del portal. Prueba con ambas URLs
  canónicas, sin modificar las licencias, los destinos o las reglas de Hosting.
- Sustitución de los 16 assets gráficos heredados por iconos originales derivados
  de SVG, con procedencia y hashes. Textos legales completos en las compilaciones
  SPA/PWA/portal, enlace «Licencias de software» y consulta offline en PWA.
  Sin fusión ni publicación de cambios en producción.
- Auditoría local aislada de SPA, PWA y portal: inventario de módulos/artefactos,
  44 textos legales adicionales y 12 coincidencias exactas de assets con plantillas
  Quasar. Documentada la necesidad de resolver derechos gráficos y entregar avisos
  en futuras distribuciones; sin cambios en compilación o publicación del proyecto.
- Elección de Apache-2.0 por el titular Francisco Navarrete Lopez: aplicación en
  esta rama a sus aportaciones originales mediante LICENSE, NOTICE, alcance,
  metadatos y política de contribuciones. Assets de `public/`, marcas, datos de
  usuarios y materiales de terceros quedan separados. Sin fusión ni despliegue.
- Estudio de licencia, inventario de dependencias/assets y borradores no vigentes
  conservados como antecedente en [proposals/ml14](proposals/ml14/README.md).
  Textos de terceros recopilados sin afirmar que sustituyen la auditoría de cada
  distribución. Continúan pendientes la procedencia/autorización de assets y la
  revisión de componentes transitivos de los artefactos que se distribuyan.

## Sin publicar — propuesta ML-07

- Rangos de biblioteca acotados a 5001; reducen relecturas de división y
  conservan búsqueda/filtros/orden globales y exportación independiente completa.
- Coordinación de pestañas por proyecto/cuenta en memoria, relevo al cerrar el
  propietario, estado conservador ante suspensión y pausa compartida tras cuota.
- Propuesta de reglas y contrato de release: límite list de 1001 a 5001, sin
  cambiar esquema ni permisos de propietario. Requiere revisión y autorización
  separada para publicar reglas antes del cliente; ningún cambio remoto realizado.
- Matriz antes/después 100–10000, pruebas de emuladores y pestañas. Véase
  [informe ML-07](docs/reports/firestore/ml-07-sync-2026-10-20.md).

## Documentación técnica — portal VitePress

- Portal en español con navegación, búsqueda local y guías de arquitectura,
  Firestore, seguridad, desarrollo y operaciones.
- 29 informes organizados por tema en `docs/reports/`, con índice, menú lateral,
  referencias actualizadas y redirecciones desde sus rutas anteriores.
- Destinos de Hosting independientes para la PWA (`app`) y el portal (`docs`),
  con comprobación remota de Spark en ambos y compilación de la documentación en CI.
- Corrección de la llamada a Google Cloud CLI en Windows y pruebas negativas de
  destinos, hooks y redirecciones. Override de Vite limitado a VitePress para
  resolver las vulnerabilidades detectadas en sus dependencias.

## Sin publicar — cursores Firestore para MangaList 1.0

- Consultas reales con `startAfter`, `endAt`, orden por ID y límite 501; rangos vivos
  que se dividen al crecer, con protección local de 10000 obras y 64 rangos.
- Búsqueda, filtros, orden y contadores completos; exportación JSON/CSV paginada
  desde servidor, sin usar la página visual ni devolver resultados parciales por fallo.
- Pruebas de cursores, emulador y navegador hasta 10000 obras; presupuesto real de
  admisión, rechazo de 10001, pausa por cuota simulada y recuperación explícita tras
  una ráfaga. Véase [verificación del límite](docs/reports/firestore/verification-10000-2026-10-19.md).
- Propuestas de retención del marcador y asistencia manual, sin aplicar políticas.
- Sin cambios de reglas, índices, configuración remota, cuentas o datos de producción.
  Sin fusión ni despliegue por este trabajo. Véase [diseño y coste](docs/reports/firestore/firestore-cursors-v1.md).

## Trabajo integrado en main — PR #2 (sin publicación certificada aquí)

Trabajo acumulado en `development/spark-guardrails-2026-10-18`, desde `eb7a38b`.
Estado comprobado: [PR #2 integrado](https://github.com/ShadowStudioEnterprise/manga-list/pull/2)
el 18/10/2026, commit `9a43953`. Esta sesión no lo fusionó ni certifica un despliegue.

- Política Spark exclusiva, inventario y comprobaciones de compatibilidad locales y de
  evidencia remota de solo lectura; CI sin despliegue ni credenciales de producción.
- [Entradas del control Spark](docs/reports/security/spark-guard-entrypoints.md): argumentos estrictos,
  siete alias npm protegidos y entrada directa de CI; escaneo de publicación de canales y clones.
- Arranque con validación temprana de emuladores: proyecto demo y desarrollo obligatorio,
  bandera estricta, apps existentes coherentes y conexiones locales en orden sin fallback.
- Consultas y admisión acotadas, pausa por cuota, rechazo de bibliotecas parciales y borrado
  reautenticado, acotado y reanudable con barrera de escritura y Auth al final.
- Importación con identidad recuperable v1; exportación comprobada contra servidor en JSON v2
  y CSV con procedencia; estado explícito de sincronización y cambios pendientes.
- Borradores opcionales por cuenta en sessionStorage y actualización PWA pasiva, con prueba
  del worker compilado y dos pestañas.
- Correcciones de dependencias y auditoría de ambos árboles, con límites del override gRPC
  documentados; cero avisos conocidos no implica ausencia de vulnerabilidades.
- Presentación por páginas de 24 tarjetas y mediciones con 100/1000 obras sintéticas;
  conserva el límite de 1000 y no reduce las lecturas iniciales del listener.
- Revisión de accesibilidad, teclado, historial y cambios de ancho en Chromium/Firefox.
  Barra de altura mínima común de 68 píxeles; captura explícita de errores ResizeObserver.
- Recuperación de contraseña probada en ambos motores con códigos emulados: rechazo de
  códigos inválidos/reutilizados y contraseña anterior; biblioteca conservada tras recuperar.
  No valida la entrega ni la página de acción reales.
- Identificación de compilación, inventario de hashes y procedimiento de recuperación
  compatible con los contratos de borrado y consulta, sin ejecutar restauraciones.
- Especificación v1, guía de contribución, límites de comunicación de seguridad y este registro.

La evidencia está en [verificación de la rama](docs/reports/security/verification-spark-2026-10-18.md) y en
los enlaces CI del PR. La aceptación operativa, licencia, canal privado de seguridad,
asistencia de borrados, retención y protección de main/IAM siguen pendientes del titular.
Los presupuestos locales no garantizan evitar cuotas agotadas; un borrado no continúa si
desaparece el cliente. No se habilitan Blaze, facturación o servicios de pago.

Para una publicación futura autorizada, registra versión elegida, fecha real, revisión y
evidencia en el [registro de release](docs/reports/operations/release-record-template.md), sin atribuirle una
restauración de Auth o de datos eliminados.
