# ML-11: evidencia de pruebas y límites

Fecha: 21/10/2026. Base: `23e9b1da5b2ede0159038057fd46906d0bde513e`.
Rama: `docs/ml-11-manual-marker-review`. Solo datos sintéticos locales.

## Comprobaciones

| Comprobación                                                                | Resultado                                    |
| --------------------------------------------------------------------------- | -------------------------------------------- |
| Servicio de cuenta y especificación sintética de revisión                   | 13 pruebas correctas, 0 fallos               |
| Suite Firestore completa                                                    | 25 pruebas correctas, 0 fallos; salida 0     |
| Control estático Spark                                                      | Correcto; no certifica estado remoto         |
| ESLint de los dos ficheros de pruebas modificados                           | Correcto                                     |
| Formato y construcción de documentación                                     | Correctos; construcción VitePress finalizada |
| Reglas, código de aplicación, configuración y dependencias respecto de base | Sin cambios                                  |

## Reproducción local

Continuación documental del 21/10/2026: añadidas ficha de activación, matriz para
revisión jurídica y simulación de mesa. Construcción VitePress y formato correctos;
sin cambios adicionales de pruebas o producto, no se repitieron las suites de
emulador. Los 13/25 resultados anteriores conservan su alcance original. La
simulación documental no se contabiliza como prueba automatizada adicional.

La aceptación D1–D7 y la asignación propuesta de operación no acreditan independencia
de revisión; se confirmó mantener D3 y dejar otro revisor pendiente.

Entorno usado: Node 24.18.0, Firebase CLI 15.32.1, Java 23.0.1 y emulador
Firestore 1.22.0. Configurar Java en PATH antes del comando del emulador.

```sh
node --experimental-vm-modules --test tests/account-service.test.js tests/manual-marker-review.test.js
firebase emulators:exec --project demo-mangalist --only firestore "npm run test:rules"
node scripts/check-spark.mjs
npx --no-install eslint tests/manual-marker-review.test.js tests/firestore/security.test.js
npm run docs:build
git diff --check
```

El primer arranque del emulador dentro del aislamiento falló al abrir el puerto del
hub. Se repitió con permiso para ejecutar el servidor local. No se cambiaron reglas,
puertos ni configuración remota. Las suites usan proyectos `demo-*`; algunas usan
IDs demo distintos y producen avisos de proyecto múltiple en el emulador.

## Evidencia específica y sus límites

- `tests/firestore/security.test.js`: regresión existente de marcador de 29/30/90
  días, aislamiento, lote atómico, interrupción y reanudación. ML-11 añade lectura y
  borrado permitidos con contexto aceptado, rechazo de cambios al marcador, reapertura
  de escrituras tras retirar un marcador sintético y supervivencia de una subcolección
  desconocida tras limpieza ordinaria y borrado del padre. Las operaciones con reglas
  desactivadas están limitadas al emulador y preparan/contrastan estos contraejemplos.
- `tests/account-service.test.js`: 10 regresiones con dobles del SDK: reautenticación,
  sesión distinta, fallos de lote/lectura/Auth, concurrencia, límite 2000 y cuota.
  No se ejecuta Auth real ni se acredita revocación por estas pruebas.
- `tests/manual-marker-review.test.js`: 3 ejercicios de especificación exclusivamente
  sintéticos; umbral UTC inclusivo cruzando cambio de hora Madrid, falta/incertidumbre
  de cada condición, fecha de finalización ausente o inválida y margen Auth independiente.
  El resultado máximo es recomendar. No es motor operativo ni está conectado al producto;
  no demuestra que identidad, asesoría o ausencia de datos estén verificadas en un caso.

El inventario desconocido, el fallo de lectura, Auth presente, representación no
acreditada o una excepción obligan a preservar/escalar en el procedimiento. No
se interpreta una prueba verde como autorización. No se probó en esta iteración
un canal de soporte, su desafío, el sistema de auditoría, IAM, borrado en todos los
dispositivos, caducidad/revocación de tokens reales ni configuración desplegada.
Los ensayos del emulador no miden facturación ni garantizan cumplimiento jurídico.
