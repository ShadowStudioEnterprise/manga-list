# ML-08: copia dividida y recuperación reanudable

Implementación para revisión en el PR borrador #7, posterior al
[ensayo de recuperabilidad](../firestore/ml-08-recovery-2026-10-21.md).
No está desplegada. La [auditoría de capacidad](../firestore/ml-08-capacity-2026-10-21.md),
la reserva propuesta del 20 % y los límites operacionales siguen pendientes de decisión.

## Recorrido

En **Ajustes → Importar y exportar**, «Preparar copia dividida» obtiene una sola
instantánea confirmada del servidor y conserva una versión inmutable en memoria.
Si cambia la cuenta, la biblioteca o su confirmación durante la preparación, se cancela.
Cada descarga reutiliza esos mismos bytes; no vuelve a consultar Firestore.
Hay que guardar el manifiesto y cada parte mediante sus botones individuales.
«Descarga solicitada» no acredita que el navegador haya guardado el archivo.

Cada parte contiene registros completos, hasta 4 MiB en UTF-8 incluyendo cabecera
y separadores. No corta notas ni descarta campos. El manifiesto registra un UUID
de copia, nombres, orden, número de registros, bytes exactos y SHA-256 por parte.
El tamaño técnico de transporte no es un límite operacional nuevo por cuenta.
La importación normal conserva su límite de 5 MiB por archivo y sus formatos.
Reconoce el formato dividido y remite al recorrido específico para evitar importar
una parte aislada accidentalmente.

Para recuperar, se seleccionan juntos el manifiesto y todas las partes, con sus
nombres originales. Antes de habilitar la primera escritura se verifican el juego
completo, nombres únicos, tamaños, hashes, identidad y orden de partes, totales,
procedencia declarada y validez de las obras usando el importador real. Cada parte
se vuelve a leer y verificar antes de procesarla. La biblioteca destino debe estar
vacía o contener únicamente IDs de esa misma recuperación parcial.

Los hashes detectan corrupción o mezcla accidental con el manifiesto original;
no son firma digital ni prueba de autenticidad. Quien cambia a la vez manifiesto
y partes puede producir otra copia válida. La procedencia guardada es metadato del
exportador, no una certificación emitida por Firebase.

## Pausa y reanudación

Se reutilizan los IDs y las transacciones idempotentes de importación existentes:
cuenta destino + formato + bytes exactos de la parte + posición de fila. Las obras
ya presentes se omiten; una transacción que encuentra un ID existente no lo sobrescribe.
Se conservan obras de igual nombre cuando son registros distintos de la copia.
No se fusiona automáticamente una biblioteca ajena a estos IDs.

La comprobación se repite entre lotes, pero no es un bloqueo global de la cuenta.
Si otro dispositivo añade una obra incompatible mientras hay operaciones en vuelo,
estas pueden terminar antes de la siguiente pausa; no se revierte lo ya confirmado.
Se recomienda recuperar en un destino dedicado sin ediciones simultáneas.

Los lotes tienen hasta ocho obras y se acotan al margen de admisiones de lectura
y escritura de la pestaña. No cambian los límites existentes de 60 lecturas y
120 escrituras por minuto, tres intentos de transacción ni la pausa de 15 minutos
por errores de cuota. No son contadores globales de documentos facturables.
Las otras operaciones, pestañas, dispositivos y reintentos pueden consumir cuota
adicional. Una pausa local de un minuto no demuestra que la cuota diaria se haya recuperado.

La continuación es manual, con cuenta confirmada y sin operaciones pendientes.
«Pausar recuperación» deja terminar el lote iniciado. Salir o cambiar de cuenta
detiene nuevos lotes; las operaciones ya enviadas pueden terminar en la cuenta
original. Para reanudar tras recargar hay que elegir los mismos archivos, sin
regenerarlos, reformatearlos ni repartirlos de nuevo. No se guardan archivos ni
biblioteca en almacenamiento persistente del navegador.

La pantalla declara completada la recuperación cuando todas las transacciones
terminaron y sus IDs están visibles en una biblioteca confirmada del servidor.
La espera final inspecciona el estado local del listener durante hasta 15 segundos;
no abre consultas extra. Si falta confirmación se pausa y permite continuar.

## Alcance y capacidad

Se recuperan campos funcionales normalizados. Los IDs de documentos y las fechas
de creación/actualización son nuevos. No se recuperan cuentas de Authentication,
permisos, historial, configuración ni documentos de usuario. No equivale a una
restauración nativa de Firestore o una copia gestionada del servicio.

El máximo técnico existente de carga sigue siendo 10000 obras. No se aumentan
reglas, índices, cuotas ni servicios. La preparación conserva las cadenas de todos
los registros y un archivo unido cada vez: reduce copias simultáneas, pero continúa
siendo O(tamaño de biblioteca) en memoria. No se acredita memoria segura en teléfonos
físicos ni Safari. La comprobación de archivos también conserva las referencias
a todos los archivos y los IDs; importa una parte analizada cada vez.

Una recuperación nueva consume como mínimo una lectura transaccional y una escritura
por obra, más entrega del listener, consultas auxiliares y reintentos. Se debe
reservar margen antes de programar recuperaciones simultáneas. Dividir archivos
no reduce esos documentos ni hace sostenible 50 × 10000 obras en Spark.
Las cuotas y la facturación se deben interpretar conforme a la documentación
oficial de [uso y límites](https://firebase.google.com/docs/firestore/quotas) y
[facturación](https://firebase.google.com/docs/firestore/pricing), consultada el 21/10/2026.

## Verificación reproducible

- `node --experimental-vm-modules --test tests/multipart-backup.test.js tests/multipart-panel.test.js`:
  packing UTF-8 real, copia de 1000 obras mayor que 5 MiB, archivos ausentes/repetidos/
  alterados, mezcla de identidades, alteración posterior a comprobación, biblioteca
  incompatible, presupuesto agotado, recarga, pérdida de confirmación, duplicados
  de nombre, ediciones conservadas, pausa y cambio de cuenta durante un lote.
- `npm run test:e2e`: incluye `multipart-backup.spec.js` en Chromium y Firefox,
  con Auth/Firestore demo aislados, descargas reales y verificación de documentos.
  Completa y repite una recuperación de 70 obras; la copia de 1000 comprueba dos
  partes reales, verificación completa y recuperación parcial con pausa y recarga.
  La recuperación completa de 1000 se prueba con escrituras simuladas en la prueba
  unitaria; no se presenta como una recuperación completa en emulador.
  La prueba adelanta solo `Date.now` entre continuaciones manuales: los temporizadores
  y respuestas SDK siguen siendo reales. Comprueba el limitador, no tiempo real ni
  cuota facturable. La evidencia `ml08-multipart.json` y captura quedan en el artefacto
  de navegadores; no deben confundirse con mediciones de producción.
- CI conserva las comprobaciones de reglas, dependencias, lint, documentos, modelos,
  SPA/PWA y actualización PWA. No contiene publicación ni credenciales de producción.
  La integración mantiene la comprobación automática de contraste a 320 px y la
  importación normal selecciona su propio campo de archivo en la prueba existente.

Pendiente de aceptación: revisar el formato/experiencia de copia, aprobar por separado
la política de capacidad y validar dispositivos físicos. Fusionar y desplegar son
acciones distintas que no se han realizado.
