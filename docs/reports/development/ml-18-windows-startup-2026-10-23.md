# ML-18: arranque de desarrollo en Windows — 23/10/2026

## Alcance y resultado

Base remota comprobada por fetch y API: `120efac60414fe914341f74b74096657a6bc17b4`.
Rama independiente `codex/ml18-windows-startup`. Mejora limitada al desarrollo SPA:
precompilar juntos Firebase App/Auth/Firestore y vue-i18n. No modifica negocio,
SDK, lockfiles, producción, Firebase remoto, permisos, datos reales ni plan Spark.
Entrega para PR borrador; sin fusión ni despliegue.

El diagnóstico reproduce respuestas 504 del optimizador en cinco de seis arranques
fríos de la base. El candidato pasa ocho fríos y ocho calientes, y seis recorridos
adicionales con emuladores. Es una corrección medida del descubrimiento tardío de
dependencias. **No cierra toda la incidencia histórica de pausas de desarrollo**:
la variabilidad del equipo y una pausa aislada de 23,46 s siguen sin causa demostrada.

## Entorno y método

Windows `win32`, versión de kernel `10.0.26200`, registro DisplayVersion 25H2,
Ryzen 9 3900X, 24 procesadores lógicos, 31,92 GiB RAM; Node 24.18.0, npm 11.16.0,
Chromium headless 153.0.8010.12. Build 26200 corresponde a
[Windows 11 25H2](https://learn.microsoft.com/en-us/windows/release-health/windows11-release-information).
El campo ProductName del registro conserva «Windows 10 Home»; se declara la
discrepancia y se usa el número de build, sin presentar ensayos Linux como Windows.

Instalación nueva desde el lockfile con `npm ci --offline --no-audit --no-fund`.
El primer intento restringido no tenía todos los paquetes en caché; la instalación
con la caché normal terminó correctamente (533 paquetes). Se conservan los avisos
de mantenimiento de vue-i18n 10 transitivo y de scripts de instalación de npm.
Versiones reales: Quasar 2.35.1, app-vite 3.8.1, Vite 8.2.4 y sass-embedded 1.103.1.
VitePress usa su Vite 6 separado; no se cambian dependencias para este diagnóstico.

El script `scripts/measure-startup.mjs` lanza directamente el CLI instalado de Quasar,
sin incluir el coste del envoltorio npm. Usa puerto fijo 9118, navegador ya iniciado,
contexto nuevo sin service worker por muestra, sin caché HTTP previa de navegador.
No aumenta los timeouts del producto ni de los E2E existentes.

- Frío de herramientas: elimina únicamente `.quasar` y `node_modules/.q-cache/dev-spa`
  de este checkout antes del par. No vacía caché del SO, disco, antivirus o npm ni
  reinstala dependencias en cada muestra; no equivale a reiniciar Windows.
- Caliente: proceso nuevo con esas cachés conservadas tras el frío anterior.
  Una traza confirma «Hash is consistent. Skipping» en Vite.
- `httpMs`: desde spawn hasta completar la primera respuesta HTTP 200, sondeo 100 ms.
- `initialPageMs`: desde navegar hasta encabezado de acceso visible, input y fuentes.
- `spawnToPageMs`: desde spawn hasta esa página; incluye HTTP y navegación.
- `firstRouteMs`: pulsar Crear cuenta hasta encabezado de Registro visible.
- Modo autenticado: registro sintético en Auth local, Biblioteca vacía, menú Ajustes
  y enlace Importar/Exportar. Mide las primeras visitas, sin importación ni exportación.
- Conserva todas las muestras, incluidos fallos y recargas automáticas. Cualquier
  HTTP >=400, pageerror o intento externo invalida la muestra y devuelve salida 1.

Datos y muestras individuales: [JSON completo](../../measurements/ml18-startup-2026-10-23.json).
Los logs, capturas y JSON sin resumir se generan en `test-results/startup/<etiqueta>/`;
las trazas seleccionadas y validaciones de esta entrega están en `proposals/ml18/evidence/`.
Los hashes de configuración, lockfile y script se registran en las series posteriores
a su incorporación al diagnóstico. Las primeras series no tenían aún esos campos.
La plantilla inicial de `metadata.definition` decía «no login/data operations»
también para la cohorte autenticada: ese texto era incorrecto; `authenticated: true`
y `registrationToLibraryMs` registran el alta sintética local. Se conservan los
registros originales con una aclaración en el JSON; el script final corrige la plantilla.

## Comparación antes/después

Medianas en milisegundos. Las cifras de la base incluyen el tiempo hasta render
después de posibles recargas por 504: **no son ejecuciones válidas sin errores**.
Por eso se publican también los fallos y no se presenta solo una mejora porcentual.

| Serie                        | Caché    |   n | HTTP | Página inicial | Spawn → página | Primera ruta | Fallos |
| ---------------------------- | -------- | --: | ---: | -------------: | -------------: | -----------: | -----: |
| Base inicial                 | Fría     |   3 | 2164 |           4310 |           6459 |           72 |      2 |
| Candidato inicial            | Fría     |   5 | 2026 |           1963 |           3998 |           76 |      0 |
| Base inicial                 | Caliente |   3 | 2370 |           2033 |           4328 |          121 |      0 |
| Candidato inicial            | Caliente |   5 | 2026 |           1638 |           3657 |           81 |      0 |
| Base repetida tras candidato | Fría     |   3 | 1906 |           3944 |           5850 |          128 |      3 |
| Candidato final              | Fría     |   3 | 2578 |           2453 |           5031 |          130 |      0 |
| Base repetida tras candidato | Caliente |   3 | 2203 |           2617 |           4820 |          128 |      0 |
| Candidato final              | Caliente |   3 | 2147 |           2622 |           4793 |          120 |      0 |

En la primera serie, spawn → página fría baja un 38,1 %; en la repetición final,
un 14,0 %. Son observaciones locales, sin aislamiento estadístico de carga del SO.
En caliente la repetición prácticamente empata: no se demuestra aceleración estable.
La primera ruta ya era rápida y tampoco demuestra mejora consistente.
Rangos del candidato: frío inicial 3,90–4,08 s; frío final 4,28–5,41 s.
La base repetida caliente conserva un máximo de 23,46 s, con peticiones de varios
módulos/fuentes alrededor de 10 s; no se oculta como outlier ni se adjudica a Sass.

Otro trabajo local comenzó a ejecutar E2E/emuladores durante la parte final.
Un intento adicional de comparación autenticada fue rechazado por puertos ocupados
por ese otro checkout; no se terminaron sus procesos ni se reutilizó su servidor.
Esto limita la interpretación de tiempos y deja sin comparación antes/después las
rutas autenticadas. La configuración candidata sí pasó tres pares completos:

| Primera visita con emuladores   | Frío, mediana | Caliente, mediana |
| ------------------------------- | ------------: | ----------------: |
| Acceso desde spawn              |       3885 ms |           3671 ms |
| Ajustes desde menú              |        141 ms |            132 ms |
| Importar/Exportar desde Ajustes |        233 ms |            134 ms |

Biblioteca vacía y datos de registro sintéticos, no bibliotecas reales ni prueba de
capacidad, Safari, producción, PWA o tiempo de arranque tras reiniciar el equipo.

## Evidencia y decisión

El [seguimiento histórico](../firestore/verification-cursors-2026-10-18.md)
documentó estilos de 12–36 s y ensayos retirados de warmup. Se revisaron también
el historial de configuración, scripts, ambos contextos Vite, plugins, cachés y
el PR histórico #3. No hay base para culpar a Firestore remoto, cuotas o billing.

Quasar configura `optimizeDeps.entries: ['index.html']`; ese archivo es una plantilla
con `quasar:entry-point`, sin script estático. La traza de la base dice «Scan completed
in 79.02ms: no dependencies found»; después aparecen Vue, Quasar/router/Pinia/Firebase
y finalmente i18n en tandas. En una traza, la carga de módulos tarda unos 10 s.
Los 504 medidos afectan a `firebase_firestore.js` optimizado, no a la API Firestore.
Se infiere que la invalidación durante esas tandas contribuye al fallo observado;
no se identifica así la causa de todas las pausas del SO.

La [documentación de Vite](https://vite.dev/config/dep-optimization-options) explica
el escaneo de entradas y `optimizeDeps.include`, y que los cambios en chunks comunes
pueden provocar recargas. Se añade include solo en SPA de desarrollo, conservando
entries, exclusiones, descubrimiento automático, HMR y cacheado. No se fuerza borrar
cachés en `npm run dev`. Una primera pasada explícita puede seguir repitiendo el
optimizer al descubrir Quasar; el cambio reduce descubrimiento tardío crítico,
no promete una única precompilación para cualquier cambio futuro.

Se descartó escanear la entrada generada `.quasar/dev-spa/client-entry.js`: la traza
no encontró dependencias al iniciar. También se descartó el identificador profundo
de i18n en include: el alias de Quasar lo resolvía incorrectamente y fallaba al arrancar.
El candidato usa el identificador público `vue-i18n`. No se añaden warmups masivos,
exclusiones de antivirus ni cambios de compilador Sass: el actual ya es embedded
y no se reprodujeron los 12–36 s históricos de estilos. Véanse las recomendaciones
de [rendimiento Vite](https://v8.vite.dev/guide/performance) y la
[configuración Quasar](https://quasar.dev/quasar-cli-vite/handling-vite/).

## Reproducción Windows

En un checkout aislado de la revisión elegida, sin otros servidores/tareas pesadas,
con Node 24, npm y Chromium Playwright instalado:

```powershell
npm ci
npx playwright install chromium
npm run diagnose:startup -- medicion 5
$env:DEBUG = 'vite:deps*'
npm run diagnose:startup -- traza 1
Remove-Item Env:DEBUG
```

No ejecutar el diagnóstico simultáneamente con otro dev server del mismo checkout:
borra las dos cachés generadas citadas. El puerto 9118 debe estar libre; falla antes
de borrarlas si está ocupado. No elimina `.env`, dependencias ni cachés globales.
Cada proceso iniciado se detiene al finalizar la muestra; en Windows se termina
solo su propio árbol de procesos mediante PID. No necesita consolas Firebase.

Para rutas privadas, con Firebase CLI 15.32.1 y Java 21+ en PATH, puertos 8188/9199
libres y este `firebase.json`:

```powershell
firebase emulators:exec --project demo-mangalist --only auth,firestore "npm run diagnose:startup -- rutas 3 authenticated"
```

En Windows con el shim Oracle, poner primero en PATH el `bin` de la instalación
Java real, como hace el runner E2E existente. No matar emuladores ajenos ni reutilizar
cuentas o servidores existentes. El navegador bloquea toda red salvo servidor local
y los dos puertos de emulador en modo autenticado; no hay fallback cloud.
Comparar base/candidato/base/candidato con el mismo lockfile, script y navegador,
conservar fallos y rangos, registrar carga externa y repetir tras reiniciar Windows
por separado si interesa el frío del sistema operativo.

## Validación y pendientes

`tests/startup-config.test.js` comprueba la conservación del optimizador, HMR y
configuraciones de producción/PWA. El control negativo contra la base falla por
ausencia de los SDK en include; el candidato pasa ambos casos.
Los resultados finales de lint, tests, docs:build, docs:check y check:spark, junto
con el estado de CI del PR, se registran en `proposals/ml18/README.md`.
No equiparar CI Ubuntu con mediciones Windows. ML-18 no certifica resueltas las
pausas generales: queda repetir con el equipo en reposo y perfilar CPU/I/O si vuelven
a aparecer, sin tocar antivirus, seguridad, servicios remotos ni datos reales.
