# Seguridad y límites de soporte

El trabajo del [PR #2](https://github.com/ShadowStudioEnterprise/manga-list/pull/2) sigue en
revisión. Sus tests no certifican la versión publicada ni el estado remoto de reglas/IAM.
No se declara aquí un plazo de respuesta ni una lista de releases con soporte operativo:
ambos requieren responsable y decisión del titular.

## Comunicar un hallazgo

El repositorio todavía no designa un canal privado de seguridad. El titular debe indicar un
canal antes de compartir detalles sensibles. Si GitHub ofrece «Report a vulnerability» en
la pestaña Security de este repositorio, puede prepararse allí un informe privado; esta guía
no habilita esa función ni confirma su disponibilidad. No publiques una explotación, un UID,
correo real, biblioteca, exportación, contraseña, token o clave privada en una issue pública.

Para un informe reproducible utiliza la revisión copiada desde Ajustes, el flujo afectado,
el resultado esperado/observado y una prueba mínima con emuladores y cuentas sintéticas.
Omite identificadores y contenidos reales de capturas, trazas y logs. Los artefactos de tests
también pueden contener campos de formularios: revisa los datos antes de compartirlos.
No ejecutes una explotación sobre producción para confirmar un hallazgo sin autorización.

## Controles y alcance

Las reglas de propietario y la barrera de borrado son controles de acceso de servidor;
los presupuestos de peticiones son admisión local y pueden eludirse. No existe una garantía
global contra abuso o cuota agotada. La pausa local no certifica recuperación de cuota.
Los checks del repositorio no impiden a un administrador usar otras herramientas o cambiar
el plan externamente. El inventario sigue limitado a Auth, Firestore Standard y Hosting
estático, siempre Spark sin Blaze, facturación ni servicios que requieran pago.

El borrado sin cliente no tiene finalización garantizada. No se desbloquea ni elimina un
marcador como remedio informal; responsable de asistencia y retención siguen pendientes.
Los borradores de pestaña no tienen cifrado adicional y no son una copia de seguridad.
Exportaciones y hashes de compilación no son firmas ni prueba confiable de origen.

Una corrección se reproduce localmente, se prueba y se presenta en una rama/PR. No autoriza
un despliegue de emergencia, cambios de IAM o modificación de cuentas/datos. La recuperación
sigue el [procedimiento](docs/reports/operations/releases-and-recovery.md), preservando reglas y marcadores.
Consulta la [especificación](docs/reports/project/specification-v1.md) y la [política Spark](docs/reports/security/spark-only.md)
para distinguir contratos implementados de aceptación y controles remotos pendientes.
