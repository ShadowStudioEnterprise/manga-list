# ML-15 y ML-17 — Cierre administrativo y excepción de accesibilidad

Fecha: 11 de noviembre de 2026 · Referencia de código: `b6ee55a`

## Decisión

ML-15 se cierra administrativamente para MangaList 1.0. Los PR #35 y #38 integraron
la implementación de autenticación y la confirmación explícita antes de abrir
Google. La aceptación de OAuth real y de recuperación alojada para el candidato
vigente queda `BLOCKED` hasta su validación manual autorizada en producción.

En ML-17 se registra el aplazamiento aceptado de las pruebas con lectores de
pantalla. La excepción queda `BLOCKED` y pasa a la matriz ML-21.

## Evidencia y alcance

- ML-15: las pruebas locales cubren credenciales, sesión, aislamiento y
  recuperación emulada. El informe del 27/10 conserva pases parciales históricos
  de Google OAuth y recuperación real. El informe del 07/11 verifica en Safari
  nativo la apertura tras el consentimiento con un proveedor sintético.
  [Matriz histórica](ml-15-auth-2026-10-27.md) · [Validación del PR #38](ml-15-google-popup-consent-2026-11-07.md).
- ML-17: las regresiones automatizadas cubren parte de la accesibilidad y la
  navegación por teclado. La validación humana con NVDA o Narrador, VoiceOver y
  TalkBack sigue pendiente, al igual que las demás filas manuales que indica el
  informe. [Auditoría y matriz humana](ml-17-accessibility.md).

## Seguimiento

| Área                 | Estado  | Evidencia necesaria para cambiar el estado                                                                                                         |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google OAuth         | BLOCKED | Ensayo autorizado sobre la revisión servida, incluido Safari normal, consentimiento del popup, éxito y cancelación, y acceso a la cuenta esperada. |
| Recuperación alojada | BLOCKED | Entrega real del correo y apertura de la página alojada, cambio de contraseña, conservación de la biblioteca y rechazo de enlace usado o caducado. |
| Lectores de pantalla | BLOCKED | Sesiones asistidas con la matriz ML-17, con evidencia saneada de anuncios, navegación y foco por dispositivo y lector.                             |

El titular conserva los pendientes en [ML-21](../operations/ml-21-acceptance-matrix-2026-11-11.md).
La fecha y la revisión de cada ensayo se registrarán junto con su resultado.
