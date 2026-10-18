# Importación recuperable sin servicios adicionales

Revisión H5 posterior a `ab34313`, dentro del PR #2. Utiliza exclusivamente
Firestore Standard en Spark, el SDK existente y Web Crypto del navegador.
No introduce Functions, Storage, Run, tablas auxiliares ni credenciales nuevas.

## Comportamiento

Antes de guardar se mantiene la previsualización de registros nuevos, duplicados y errores.
Cada fila válida recibe un identificador estable con este formato:

```text
import-v1-<SHA-256 de versión, UID, formato y texto del archivo>-<posición de la fila>
```

Cambiar solamente el nombre del archivo no cambia la identidad si el formato detectado
y el texto siguen siendo iguales. Filas diferentes tienen IDs distintos aunque repitan
el título. Las fuentes normalizadas pueden recibir IDs aleatorios al parsear; estos no
intervienen en la identidad de la operación. Otra cuenta obtiene una identidad distinta.

La importación crea ese documento dentro de `users/{uid}/mangas` mediante transacción:
lee su existencia y lo crea solo si falta. Si ya existe, confirma la operación sin alterar
sus datos. Así se conserva una edición posterior y dos clientes concurrentes convergen
en el mismo documento para esa fila. Las altas manuales conservan sus IDs aleatorios.
No se añaden campos al esquema ni se cambian las reglas de propietario o borrado.

Una respuesta perdida puede mostrar un fallo aunque el servidor haya guardado la obra.
Reintentar esa fila usa el mismo ID y comprueba el servidor antes de escribir. La transacción
tiene un máximo de tres intentos; agotarlos produce un fallo recuperable, no un bucle propio.

## Recarga, cierre y privacidad

Para continuar hay que volver a entrar con la misma cuenta y seleccionar el mismo archivo
y formato. Los IDs ya presentes se marcan como importados, incluso si la obra cambió de
nombre. El usuario revisa y confirma las filas restantes; las selecciones anteriores no
se conservan. Las filas que aún no aparecen en la biblioteca también están protegidas
por la comprobación transaccional del ID al confirmar.

No se guardan el archivo, la vista previa ni las selecciones en localStorage, IndexedDB
o un nuevo registro remoto. La identidad persistente es el ID de las obras guardadas.
El archivo y su contenido solo se usan en memoria hasta salir o reiniciar la vista.
El digest es metadato de la operación, no una promesa de anonimización; permanece en la
ruta privada de la obra y desaparece cuando se elimina esta.

Una lectura/hash que termine después de elegir otro archivo, reiniciar o cambiar de
cuenta no puede reemplazar la vista previa actual. La confirmación se vincula al UID
con el que se preparó, y se comprueba la cuenta entre chunks. Las solicitudes ya enviadas
antes de un cambio de sesión pueden terminar; las reglas siguen aislando al propietario.

Cerrar la app detiene el trabajo del cliente: no hay importación durable en segundo plano
ni garantía de finalización si nadie vuelve. El navegador no puede volver a seleccionar
un archivo local por sí mismo. No se necesita autorizar almacenamiento persistente adicional.

## Presupuestos y fallos

Cada fila admitida consume un permiso local de escritura y uno de lectura; actualmente,
el presupuesto de 60 lecturas por minuto limita también las admisiones de importación por
pestaña. Las transacciones pueden repetir lecturas hasta tres veces y las reglas pueden
añadir lecturas del marcador: no equivale a un límite de 60 lecturas facturables globales.
Una fila ya guardada requiere lectura para confirmarse, aunque no se vuelva a crear.

Se mantiene la concurrencia de ocho. Al agotar cuota o presupuesto se detienen los chunks
siguientes; los ya enviados pueden concluir. No se borran éxitos ni se reinicia el archivo.
Las transacciones requieren conexión: no se promete una importación offline ni escritura
en cola que continúe después de abandonar la vista. Si Web Crypto no está disponible,
la preparación falla con un mensaje; no se recurre a IDs aleatorios para importar.

## Límites explícitos

- El mismo contenido semántico con espacios, orden, codificación textual o formato distinto
  puede recibir otro digest. Solo se garantiza reutilizar identidad para el mismo texto
  decodificado, formato, UID y namespace `v1`.
- No hay una tabla inmutable de operaciones. Si se borra una obra y se confirma de nuevo
  esa fila del archivo, puede recrearse. El marcador de eliminación de cuenta impide
  recreaciones durante y después del borrado de cuenta, según las reglas existentes.
- Las importaciones de versiones anteriores con IDs aleatorios no se pueden identificar
  como estas operaciones. La detección habitual por título sigue avisando de duplicados,
  pero no certifica identidad ni permite prometer recuperación de operaciones antiguas.
- Una fila confirmada no actualiza ni sobrescribe una obra editada. Para actualizarla se
  usa el editor; para un duplicado deliberado se usa el alta manual o una fila distinta.
- Cambiar el algoritmo, mapeo de posiciones o namespace exige revisar compatibilidad de
  identidades antes de publicar, porque podría dejar de reconocer operaciones anteriores.
- Los IDs no son una defensa contra un cliente modificado ni contra un administrador.
  No se garantiza evitar todo duplicado, gasto excesivo o cuota agotada fuera de este flujo.

## Pruebas

Regresiones: identidad estable entre vistas nuevas, separación por cuenta/archivo/fila,
fuentes aleatorias, reconocimiento por ID tras renombrar, respuesta de commit perdida,
servicio reiniciado sin estado local, preservación de ediciones y lecturas tardías ignoradas.

El emulador Standard prueba un commit real seguido de respuesta perdida, recuperación
desde otro cliente, dos importaciones concurrentes de la misma fila, aislamiento de cuentas
y bloqueo de nuevas importaciones después del marcador de borrado.
El navegador prueba recarga, reselección de un archivo renombrado con el mismo contenido
y desactivación de filas ya importadas. Ninguna prueba utiliza producción.
