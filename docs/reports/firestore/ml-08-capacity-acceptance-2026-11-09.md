# ML-08 — Aceptación de capacidad operativa en Firebase Spark

Fecha: 9 de noviembre de 2026 · Referencia de código: `origin/main` en `8978ca9`

## Decisión

El titular del proyecto fija para MangaList 1.0 una capacidad operativa en dos niveles, sustituyendo la política provisional de ML-08 por una definitiva y condicionada. Esta decisión no certifica disponibilidad garantizada: las cuotas de Spark son compartidas por todo el proyecto y ninguna medida contemplada elimina el abuso de un usuario autenticado (ver `ml-09-risk-acceptance-2026-11-08.md`).

## Capacidad aprobada

Una cuenta activa es la que abre su biblioteca al menos una vez al día. Los límites se refieren a bibliotecas ordinarias de hasta 500 obras; los demás tramos y sus excepciones de la política vigente no cambian y no se recortan datos existentes.

| Nivel | Cuentas activas por día | Semáforo | Lecturas diarias previstas |
|---|---|---|---|
| Objetivo | hasta 36 | Verde (hasta 30.000) | unas 29.700 con el perfil esperado |
| Techo | hasta 50 | Ámbar (30.001 a 40.000) | entre 33.050 y 39.300 según el perfil |

- Perfil esperado, tomado de la propuesta de capacidad y pendiente de validación: un dispositivo por cuenta, 20 cambios transaccionales y un duplicado vacío al día, una reconexión de listener cada diez cuentas, una exportación cada veinte y una recuperación cada diez.
- Las cifras se derivan del modelo `scripts/model-ml08-capacity.mjs` con 5.000 lecturas y 1.000 escrituras diarias auxiliares incluidas en el presupuesto.
- Los techos de lecturas, escrituras, borrados, almacenamiento y transferencia se comprueban por separado: reserva administrativa del 20 % sobre las cuotas de Spark (40.000 lecturas, 16.000 escrituras y 16.000 borrados al día; 0,8 GiB almacenados; 8 GiB al mes de transferencia). Esa reserva no se usa para trabajo opcional.
- Con el perfil optimista, el techo de 50 cuentas deja un margen de 6.950 lecturas para cargas adicionales (500 por carga completa de una biblioteca de 500 obras). Con el perfil esperado el margen es de unas 700 lecturas. Con el perfil conservador (dos dispositivos, tres intentos, una reconexión, una exportación y una recuperación por cuenta) solo caben 11 cuentas activas.

## Reglas de operación

- Hasta el objetivo: operación normal.
- Entre el objetivo y el techo: se revisa el consumo real antes de admitir más cuentas activas.
- Por encima del techo, o con cualquier recurso en rojo (más de 40.000 lecturas o exceso de otro recurso): revisión inmediata por el titular antes de seguir admitiendo cuentas. No hay bloqueos automáticos.
- Restauraciones de copias, borrados masivos y bibliotecas de más de 500 obras se tratan como excepciones coordinadas, con plan específico.

## Validación pendiente

Las cifras son supuestos del modelo, no telemetría. Durante una ventana de 31 días el titular anotará, a partir del uso diario que muestra la consola de Firestore, el pico semanal de lecturas, escrituras y borrados, y lo comparará con el semáforo. Si el uso real supera el perfil esperado, el objetivo se reduce antes de ampliar la cohorte.

## Riesgos residuales

- Abuso autenticado aceptado en ML-09: puede agotar la cuota compartida y causar indisponibilidad temporal hasta su reinicio (hacia la medianoche del huso del Pacífico), sin coste.
- Sin mediciones de consumo facturable, bytes ni frecuencias reales. Hosting y Authentication tienen cuotas propias no modeladas aquí.
- Pausas y reintentos del cliente son locales y no coordinan a todos los dispositivos.
- Siguen pendientes los ensayos de red celular, suspensión en Android, Archivos en iOS y recuperación tras reinicio real (ML-16, ML-20).

## Condiciones de revisión

Se reabre esta decisión ante cualquiera de estas circunstancias:

- Consumo en ámbar durante varios días seguidos, o cualquier día en rojo.
- Crecimiento notable de cuentas o campaña de difusión de la landing pública.
- Cambios en consultas, rangos, SDK, reglas de Firestore o política Spark.
- Resultados de la ventana de 31 días que difieran del perfil esperado.

## Seguimiento

Responsable: titular del proyecto. Esta aceptación se revisa junto con la de ML-09 en su revisión de 9 de noviembre de 2026, o antes si ocurre alguna condición anterior.

## Aprobación

Titular del proyecto: aprobado el 9 de noviembre de 2026.
