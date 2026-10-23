# ML-18 — entrega para revisión

Base: main remoto `120efac60414fe914341f74b74096657a6bc17b4`.
Rama: `codex/ml18-windows-startup`. PR borrador, sin fusión ni despliegue.

El informe de alcance, causa inferida, metodología, resultados completos y límites
está en [el diagnóstico Windows](../../docs/reports/development/ml-18-windows-startup-2026-10-23.md).
Las [muestras JSON](../../docs/measurements/ml18-startup-2026-10-23.json) conservan
cohortes iniciales, repetición inversa, candidato final, rutas con emuladores y
experimentos descartados. `evidence/` conserva trazas con ruta de checkout redactada.

Resultado medido: 504 en cinco de seis arranques fríos de la base; cero en ocho
del candidato sin autenticar. Los ocho calientes del candidato y seis recorridos
adicionales con Auth/Firestore locales también pasan. Medianas iniciales frío
6,459 → 3,998 s hasta página; repetición 5,850 → 5,031 s. En caliente no se demuestra
mejora estable. La primera navegación no muestra aceleración consistente.
No cerrar como resueltas las pausas históricas: carga externa no controlada, una
pausa de 23,46 s conservada y comparación autenticada de base sin ejecutar por
puertos ocupados por otra tarea. No se alteraron esos procesos ajenos.

## Validación final

- `npm run lint` y `npm run lint:check`: correctos.
- `npm test`: 121/121, cero fallos; incluye dos regresiones del alcance del optimizador.
- `npm run docs:build`: correcto; conserva aviso de chunk superior a 500 kB.
- `npm run docs:check`: correcto; 76 páginas, 25 huellas, 59 commits, 723 destinos locales.
- `npm run check:spark`: correcto; exclusivamente estático, sin consultar estado remoto.
- Auditorías offline de seguridad: 350 archivos Git y 292 compilados, cero hallazgos.
- `git diff --check`: correcto.
- `npm run build`: SPA con configuración demo correcta; sin despliegue.
- CI del PR: pendiente de consultar tras publicar la rama; no representa tiempos Windows.

La [evidencia de validación](evidence/validation.json) registra comandos y resultados.
Los ensayos de rendimiento no sustituyen estas comprobaciones ni cierran la incidencia
general de pausas de desarrollo.

## Seguridad del alcance

Solo cambia el optimizador de SPA de desarrollo, diagnóstico, regresión y documentación.
Sin cambios de negocio, Firebase remoto, permisos, datos reales, billing/Blaze ni
servicios de pago. No se ejecutó ningún despliegue ni fusión. Los emuladores usaron
proyecto demo y cuentas sintéticas, con el navegador limitado a loopback.

Para continuar el diagnóstico general: repetir sin carga concurrente y perfilar
CPU/I/O si reaparecen pausas, manteniendo los errores como fallos y los tiempos del
producto. Cualquier cambio de seguridad del equipo o servicio remoto queda fuera.
