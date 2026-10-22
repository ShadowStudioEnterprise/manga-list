# Registro de cambios

Solo se registran como publicadas las versiones cuya publicación haya sido confirmada.
Los sellos de compilación, resultados CI y commits de una rama no constituyen una release.
Los despliegues históricos mencionados en el roadmap no se reconstruyen aquí sin evidencia.

## Sin publicar — propuesta ML-14

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
