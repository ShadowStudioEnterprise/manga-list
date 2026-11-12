# ML-15 y ML-17 — Cierre administrativo y excepción de accesibilidad

Fecha: 11 de noviembre de 2026 · Referencia de código: `b6ee55a`

## Decisión

ML-15 se cierra administrativamente para MangaList 1.0. Los PR #35 y #38 integraron
la implementación de autenticación y la confirmación explícita antes de abrir
Google. El 12/11/2026 a las 13:51 UTC (14:51 en Europe/Madrid), el titular
validó ambos flujos en Google Chrome sobre la revisión servida por
`mangalist-61bb8.web.app`. El SHA servido no consta en el registro. El titular
custodia la evidencia localmente, sin correos reales, UID ni tokens en el repositorio.

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

| Área                 | Estado  | Resultado o evidencia pendiente                                                                                              |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Google OAuth         | PASS    | Inicio de sesión con Google real, acceso a biblioteca y cierre de sesión sin errores de dominio ni redirección.              |
| Recuperación alojada | PASS    | Recepción del correo real de Firebase Authentication, apertura de la página de acción alojada y restablecimiento completado. |
| Lectores de pantalla | BLOCKED | Sesiones asistidas con la matriz ML-17, con evidencia saneada de anuncios, navegación y foco por dispositivo y lector.       |

El titular conserva los pendientes en [ML-21](../operations/ml-21-acceptance-matrix-2026-11-11.md).
Los pases corresponden a los recorridos observados en Chrome sobre la revisión servida.
El acta no acredita cancelación de OAuth ni uso de enlaces de recuperación
usados o caducados en esa revisión.
