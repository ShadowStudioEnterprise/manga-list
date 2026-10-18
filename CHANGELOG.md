# Registro de cambios

Solo se registran como publicadas las versiones cuya publicación haya sido confirmada.
Los sellos de compilación, resultados CI y commits de una rama no constituyen una release.
Los despliegues históricos mencionados en el roadmap no se reconstruyen aquí sin evidencia.

## Sin publicar — PR #2

Trabajo acumulado en `development/spark-guardrails-2026-10-18`, desde `eb7a38b`.
Estado: [PR en borrador](https://github.com/ShadowStudioEnterprise/manga-list/pull/2),
sin fusión ni despliegue por este trabajo.

- Política Spark exclusiva, inventario y comprobaciones de compatibilidad locales y de
  evidencia remota de solo lectura; CI sin despliegue ni credenciales de producción.
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

La evidencia está en [verificación de la rama](docs/verification-spark-2026-10-18.md) y en
los enlaces CI del PR. La aceptación operativa, licencia, canal privado de seguridad,
asistencia de borrados, retención y protección de main/IAM siguen pendientes del titular.
Los presupuestos locales no garantizan evitar cuotas agotadas; un borrado no continúa si
desaparece el cliente. No se habilitan Blaze, facturación o servicios de pago.

Para una publicación futura autorizada, registra versión elegida, fecha real, revisión y
evidencia en el [registro de release](docs/release-record-template.md), sin atribuirle una
restauración de Auth o de datos eliminados.
