# Verificación de la rama de desarrollo — 16/10/2026

## Estado y procedencia

Base auditada y HEAD remoto comprobado: `effcef43cef0585fe32f1dbb1dc2d435152ffc7f`.
Rama nueva: `development/audit-2026-10-16`. Entorno: Windows, Node 24.18.0,
Java 23.0.1, Firebase CLI 15.32.1 y Chromium de Playwright.

| Comprobación                   | Resultado local                                        |
| ------------------------------ | ------------------------------------------------------ |
| Formato y ESLint               | Correctos.                                             |
| Regresiones Node               | 21/21 correctas.                                       |
| Integración y reglas Firestore | 9/9 correctas en `demo-mangalist`.                     |
| Navegador Chromium             | 5/5 flujos correctos en una ejecución completa (40 s). |
| Compilación SPA                | Correcta, configuración Firebase demo.                 |
| Compilación PWA                | Correcta, configuración Firebase demo.                 |
| Revisión de espacios del diff  | Correcta.                                              |

## Cobertura incorporada

- Los errores CRUD/conflictos no crean ni borran el estado de fallo del listener.
- Fallo del listener, nueva suscripción, snapshot correcto y callbacks tardíos con el
  mismo UID o con otra cuenta. Reintento con fallo síncrono controlado por las páginas.
- Favorito envía el valor mostrado como precondición de la transacción.
- Auth fija la persistencia local desde el arranque y conserva el resolver de Google;
  abrir otra pestaña y volver al foco no provoca un cierre transitorio por migración.
- La selección de archivos en los tests espera a que termine la carga de biblioteca.
- Borrado de 805 obras en tres lotes simulados, callback de progreso que lanza excepción,
  fallo del segundo lote, fallo de Auth y reintento, fallo al crear el bloqueo, fallo de
  reautenticación, cambio de sesión y fallo de lectura del servidor.
- Servicio real de limpieza sobre 401 obras en el emulador: colección vacía confirmada,
  marcador retenido, reintento vacío seguro y escrituras de otra sesión rechazadas.
- Privacidad y esquema de `users/{uid}`, timestamps, prohibición de quitar el marcador,
  compatibilidad sin documento padre y modelo máximo con documento padre.
- Lote que intenta crear el marcador y una obra simultáneamente: rechazado.
- Tres transacciones de capítulo concurrentes sin perder incrementos ni campos ajenos.
- Flujo de dos pestañas con edición ajena preservada, conflicto local recuperable y
  regreso a biblioteca sin recargar antes de comprobar el banner.
- Flujo de eliminación desde Ajustes con contraseña incorrecta que conserva la obra,
  confirmación válida y rechazo de un nuevo login tras borrar Auth en el emulador.

## Dependencias y avisos pendientes

`npm audit` detectó 14 entradas afectadas en el árbol raíz: 11 altas, 1 moderada y
2 bajas; el subproyecto PWA informó 3: 2 altas y 1 baja. Son conteos de paquetes afectados,
no de vulnerabilidades independientes ni explotaciones demostradas en la app publicada.

El árbol raíz incluye avisos en `@grpc/grpc-js`, `brace-expansion`, `braces`,
`postcss-selector-parser`, `quasar`, `serialize-javascript` y `source-map-js`, con
propagación a otros paquetes. Se guardaron los JSON completos en la evidencia local de
esta tarea. No se cambiaron los lockfiles ni se aplicó `npm audit fix --force`: una de
las propuestas automáticas suponía bajar Firebase a otra versión mayor. El análisis y
la actualización controlada quedan priorizados en el roadmap.

Los builds advierten de un chunk de más de 500 kB. No bloquea la compilación; requiere
medición de carga. Node advierte del uso experimental de VM Modules en el cargador de
tests existente. En este entorno el sandbox restringido no permitió completar el
arranque de emuladores ni ejecutar el auxiliar Sass; ambos se verificaron después con
los permisos de ejecución local necesarios, manteniendo siempre el proyecto demo.

## Límites del resultado

No se ejecutaron pruebas en producción, Google OAuth real, recepción/consumo de correos,
instalación PWA física, Safari/Firefox ni evaluación completa de accesibilidad. No se
borraron las cuentas sintéticas de producción. La CI remota debe revisarse en el PR;
este informe registra resultados locales, no un resultado de CI supuesto.

El borrado sigue dependiendo del cliente y conserva el marcador mínimo. El proceso de
servidor durable y la retirada segura de ese marcador permanecen pendientes. Véanse las
[decisiones técnicas](../project/technical-review-2026-10-16.md) y el [roadmap](../project/roadmap.md).
