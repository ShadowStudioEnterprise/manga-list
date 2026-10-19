# Lecturas de transacciones y presupuesto local — 19/10/2026

Continuación técnica del PR #4 desde `a91cf026c24d7016e977ad1c4234b08179d78f49`.
Solo datos sintéticos en emulador Standard. No se modifica configuración remota,
reglas, esquema, cuotas, dependencias, capacidad provisional ni política de marcador.
Se mantiene Spark sin facturación y sin despliegue.

## Problema observado

El incremento de capítulo y la edición con control de conflicto ejecutaban
`transaction.get` sin tomar admisión de lectura. La importación idempotente tomaba
una admisión antes de la transacción, aunque el SDK puede repetir su callback.
Por ello el límite local de 60 admisiones de lectura/minuto no incluía todas estas
lecturas y reintentos. No era un contador de cuota global, y sigue sin serlo.

El ensayo introduce una escritura real desde otro cliente después del primer
`get`, antes del commit. El SDK real detecta el cambio de versión y reintenta;
no se simula el reintento ni se modifica el número máximo de tres intentos.
Se cuenta cada llamada real a `transaction.get` y cada admisión local aceptada,
excluyendo siembra, escritura concurrente y lectura de comprobación.

| Operación con una colisión   | Intentos / lecturas SDK | Admisiones antes | Admisiones después |
| ---------------------------- | ----------------------- | ---------------- | ------------------ |
| Incrementar capítulo         | 2 / 2                   | 0                | 2                  |
| Editar con valores esperados | 2 / 2                   | 0                | 2                  |
| Importar fila idempotente    | 2 / 2                   | 1                | 2                  |

Las mediciones antes/después están en
[antes](measurements/transaction-budget-before-2026-10-19.json) y
[después](measurements/transaction-budget-after-2026-10-19.json).
La regresión nueva falla contra `a91cf02` porque las admisiones no cubren las
lecturas. También confirma que un incremento con una sola admisión restante
completaba dos lecturas, en lugar de detener el segundo intento.

## Cambio y comportamiento bajo agotamiento

Tomar una admisión `read` inmediatamente antes de cada `transaction.get`, dentro
del callback de las tres rutas. Se mantiene una admisión `write` por operación
lógica, los tres intentos máximos y la atomicidad de Firestore. No se sustituyen
transacciones por escrituras directas ni se elimina la detección de conflictos.
El contador de recursos local conserva los intentos fallidos; no se altera el
estado de la biblioteca ni se publican efectos de un callback aún no confirmado.

Con 59 admisiones de lectura previamente consumidas, la primera lectura se permite.
Si otro cliente cambia el documento, el segundo intento realiza la comprobación
de presupuesto y recibe `app/request-budget` antes de ejecutar otro `get`.
El SDK propaga ese error de aplicación sin seguir reintentando. Las tres rutas
se ensayan con reglas reales: dos callbacks, una llamada SDK `get`, una admisión,
ninguna escritura propia confirmada y conservación de lo escrito por el otro cliente.

La interfaz existente muestra el límite local y permite reintentar después de la
ventana. Tres regresiones locales comprueban las tres rutas sin presupuesto:
cero lecturas y escrituras SDK, rechazo a los 59999 ms y recuperación a los 60000 ms.
No se añade reintento automático de aplicación. En importación se conserva el ID
estable; volver a intentar no sobrescribe una fila creada por otro cliente.

## Validación local de la continuación

- 81 regresiones locales y las 20 pruebas de Firestore pasan, incluidas las nuevas
  comprobaciones de presupuesto por intento y conservación de escrituras concurrentes.
- Cinco recorridos de navegador pasan (4,6 minutos): edición concurrente e importación
  con aislamiento en Chromium y Firefox; biblioteca de 10000 en Chromium. Se recorren
  las 417 páginas, se conservan búsquedas/filtros/orden sin listeners adicionales y
  se exportan todos los registros. La evidencia descriptiva de esa muestra está en
  [medición de 10000 obras](measurements/transaction-budget-browser-10000-2026-10-19.json);
  no es una comparación controlada de rendimiento con la primera revisión.
- Pasan formato/lint y comprobación Spark local. La validación completa de navegador,
  compilaciones demo y PWA se ejecuta de nuevo en CI para el commit actualizado;
  la CI de `a91cf02` corresponde a la revisión anterior.

## Límites y coste

Esta corrección cierra una omisión del control local; no reduce las dos lecturas
necesarias para resolver la colisión cuando hay presupuesto. Bajo agotamiento,
evita la siguiente lectura de aplicación y deja pendiente la operación del usuario.
Las ediciones, incrementos e importaciones pueden alcanzar el límite antes que
en la versión anterior. No se amplía el presupuesto para ocultar ese efecto.

Una admisión no equivale a lectura facturada: no mide comprobaciones de reglas,
reintentos internos de transporte, documentos de consultas ni actualizaciones
recibidas por listeners. El límite de escrituras sigue siendo por operación lógica,
no por intentos de commit. No es protección de servidor ni cuota diaria compartida.
Los resultados del emulador no prueban ahorro facturado, disponibilidad Spark ni
una frecuencia real de contención. Se requiere una mezcla de uso aprobada antes
de fijar capacidad definitiva o prometer disponibilidad.

## Reproducción

Con dependencias instaladas, Java 21+ y CLI Firebase 15.32.1:

```sh
npm test
node scripts/test-firestore-local.mjs
npm run test:e2e
npm run lint:check
node scripts/check-spark.mjs
```

Las pruebas adicionales están en `tests/transaction-budget.test.js` y
`tests/firestore/transaction-budget.test.js`. La segunda exige explícitamente
`127.0.0.1:8188` y usa `demo-mangalist-transactions`.

Fuente oficial consultada el 19/10/2026:
[transacciones, reintentos y atomicidad](https://firebase.google.com/docs/firestore/manage-data/transactions).
