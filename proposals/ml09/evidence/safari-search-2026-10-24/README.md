# ML-09: búsqueda tras recarga durante cuota

La primera sesión Safari del 24/10/2026 perdió la búsqueda al recargar durante la
pausa de cuota. El store solo la conservaba en memoria. Esta corrección guarda la
búsqueda aplicada de hasta 512 unidades UTF-16 en sessionStorage, por pestaña y
proyecto, ligada al UID autenticado. Restaura la selección antes de abrir la
suscripción, incluso cuando esta falla inmediatamente por cuota. Salir o cambiar
de cuenta borra la selección; el reinicio interno de la misma cuenta la conserva.
No persiste obras, filtros ni confirmaciones del servidor.

La utilidad valida versión, dueño, tipo y tamaño; un valor corrupto, ajeno,
sobredimensionado o vacío se retira. El almacenamiento bloqueado mantiene la
búsqueda en memoria y no bloquea cierre de sesión ni sincronización. Las consultas
de más de 512 unidades funcionan en memoria pero no se restauran al recargar.

## Código y pruebas

- Store: `src/stores/manga-store.js`; utilidad: `src/utils/library-search.js`.
- Cuatro regresiones unitarias nuevas: persistencia por cuenta/proyecto/pestaña,
  límites/corrupción/limpieza, almacenamiento denegado y store nuevo con error
  síncrono de cuota, cambio de cuenta y salida. Suite final: **138 aprobadas**.
- Caso E2E ML-09 ampliado: búsqueda aplicada antes de cuota, recarga bloqueada y
  búsqueda conservada después de Reintentar. **Chromium y Firefox aprobados**;
  reloj adelantado solo en esos E2E, conservando los controles de cero targets
  durante pausa y uno al recuperar. Ese reloj no prueba el tiempo real de Safari.
- Formato, ESLint, Spark y documentación/contratos comprobados. No cambia el
  esquema de Firestore, reglas, dependencias ni servicios de sincronización.

El E2E espera que el input aplique su debounce de 120 ms comprobando el segundo
campo ligado al mismo modelo antes de interrumpirlo. No afirma conservar texto
que todavía no se haya aplicado a la búsqueda. Los intentos previos quedan
documentados como fallidos/interrumpidos: dependencias enlazadas fuera de la lista
de Vite; selector de campo móvil oculto en escritorio; recarga antes del debounce.
Un control de Spark agotó su plazo en la primera suite paralela; la repetición
completa sin tareas pesadas concurrentes pasó sin ampliar plazos. Esos intentos
no se cuentan como pases.

## Safari real

Safari 18.6 (20621.3.11.11.3), macOS 15.7.9 (24G830), automatizado mediante
SafariDriver, sin simulador. Laboratorio nuevo de Auth/Firestore demo, 500 obras
sintéticas, aplicación solo en 127.0.0.1:9414. El laboratorio anterior se detuvo
antes de arrancar los runners aislados. La biblioteca real y Firebase remoto no
intervienen. La señal resource-exhausted es sintética.

El observador fetch + XHR se instala antes del arranque en el HTML auxiliar
ignorado. Se usa el mismo código de aplicación y se conserva el reloj nativo.
La búsqueda se aplica desde el campo visible; después se inyecta cuota, se recarga
y se prueba un reintento anticipado. La nueva selección permanece visible y en el
store con cero targets. Se prepara el capítulo 2 en el emulador para comprobar la
posterior recuperación de un cambio concurrente.

**Punto 1 aprobado en Safari real.** La búsqueda se conserva tras la recarga,
durante la pausa y después del único reintento válido. Espera real observada de
915330 ms (15 min 15,330 s), sin adelantar reloj ni borrar almacenamiento. No se
abre ningún target al vencer; un clic abre exactamente uno y confirma las 500
obras, capítulo 2, sin errores ni pendientes. La búsqueda sigue visible y filtra
una coincidencia.

La descarga JSON por interfaz se compara con las 500 obras del emulador y todos
los campos previstos: aprobada, SHA-256
8de3b6f3295ee88605966751f16d55c01a0956b8835312495ee8bf444660c224.
El archivo y el comprobante original están en `raw-evidence.zip`.

Cerrar sesión desde el menú de usuario deja la ruta login y la clave de búsqueda
ausente. Un nuevo login confirma otra vez las 500 obras con búsqueda vacía. Ese
login legítimamente abre otra suscripción; el contador acumulado pasa de uno a
dos después de salir y entrar, no durante la recuperación de cuota. El protocolo
puede incluir un resumeToken opaco de cursor, que no es un token de autenticación.
La sesión SafariDriver, el servidor de aplicación y los emuladores del ensayo se
cierran al terminar.

`runtime.json` identifica el árbol probado mediante SHA-256. El auxiliar original
del kit conserva su revisión de preparación anterior, que no identifica el
runtime de esta corrección; las huellas de runtime son la evidencia de los bytes
de la aplicación probada. Los registros nativos utilizan UTC, y las fechas del
informe son Europe/Madrid.

## Verificación del registro

Desde esta carpeta, con Node 24:

```sh
node verify-search.mjs
```

Audita observaciones conservadas; no abre Safari ni repite una prueba física.
`verification.json` registra el pase. Los JSONL y capturas están visibles en esta
carpeta. `raw-evidence.zip` conserva la exportación, su comprobante y una copia
original del registro JSONL; `manifest.json` contiene sus hashes. Los logs
publicados sustituyen la ruta local por `<workspace>` y retiran colores ANSI.
Los originales locales se conservan por separado.
Las capturas muestran únicamente la interfaz de MangaList y datos demo. Material
generado con asistencia de Codex, a partir de sesiones reales automatizadas y
salidas locales. No se incluyen credenciales, perfiles ni tokens de autenticación. Los datos
sintéticos y las huellas no acreditan cuota global ni Safari/iOS, redes móviles o
suspensión completa del sistema. ML-09 sigue abierta hasta la aceptación y las
validaciones operativas restantes. No se fusiona ni despliega.
