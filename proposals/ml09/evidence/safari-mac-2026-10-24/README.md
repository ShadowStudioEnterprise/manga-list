# Safari Mac: evidencia del 24/10/2026

Revisión probada: **6712945f9c0afa26ec6082e3b112b4fbf4c14211**. Safari real 18.6
(20621.3.11.11.3), macOS 15.7.9 (24G830). Sesiones automatizadas mediante
SafariDriver contra Auth/Firestore demo en localhost, con 500 obras sintéticas.
Los commits que incorporan esta evidencia no cambian el runtime probado.

## Resultado vigente

- **Listeners aprobados:** una apertura entre dos pestañas, retirada del mismo target
  al recibir cuota sintética, cero aperturas durante pausa/recarga y exactamente una
  tras un clic válido en Reintentar. Estable durante más de un minuto. Espera real
  medida de 931779 ms; sin adelantar el reloj ni borrar almacenamiento.
- Recuperación tras escritura pendiente, dos pestañas y segundo plano aprobados.
  Dos exportaciones de 500 IDs únicos contrastadas con todos los campos previstos
  de los documentos del emulador (capítulos 3 y 5).
- **Safari Mac no aprobado en conjunto:** la búsqueda se pierde al recargar durante
  la pausa de cuota y sigue vacía después de recuperar. No corregido en esta entrega.
- Reejecución de Node: 134 pruebas del candidato y 10 del kit aprobadas.
  Observador: cinco controles aprobados.

[Informe general](SAFARI-2026-10-24.md) y
[medición de listeners](SAFARI-LISTENERS-2026-10-24.md). Las notas históricas de
medición inconclusa corresponden al auxiliar XHR original. La captura nueva
observa fetch y XHR desde antes del login/arranque y resuelve ese punto.

## Archivos y reproducción de las comprobaciones

Los JSONL, capturas y logs están visibles en esta carpeta. **raw-evidence.zip**
conserva los JSON descargados y comprobantes originales, además de copias de los
JSONL y logs. Los hashes SHA-256 y la lista de miembros constan en
[source-manifest.json](source-manifest.json). Los nombres JSON citados por los
informes están dentro de ese archivo ZIP y se pueden extraer en esta carpeta.
Las copias de scripts e informes visibles se han formateado para el repositorio;
los miembros del ZIP conservan sus bytes originales.

Con Node 24, desde esta carpeta:

```sh
node --test safari-listen-observer.test.mjs
node verificar-listeners-safari.mjs
```

El segundo comando audita el JSONL observado, no abre Safari ni repite la prueba
física, y escribe verificacion-listeners-safari.json. Para una nueva ejecución se
necesitan el laboratorio demo del kit ML-09 y SafariDriver con automatización
remota activada. Instalar safari-listen-observer.js mediante execute/sync antes
del login; para observar desde antes del arranque, insertar su IIFE (sin el return
exterior de WebDriver) delante de los módulos del HTML servido en una ruta local
ignorada, como describe el informe. El observador no cambia la respuesta de
Firestore ni solicita permisos remotos.

No se incluyen credenciales sintéticas, fixture-local.json, herramientas ni
node_modules. Se restauró el capítulo del ensayo de 6 a 5 y se retiró el HTML
auxiliar al terminar. El laboratorio original sigue activo. La plantilla local
RESULTADOS.md quedó con su hash original para permitir futuros arranques.

## Alcance y procedencia

Material generado con asistencia automatizada de Codex a partir de sesiones reales
de Safari y salidas locales; datos sintéticos del laboratorio del propietario.
No se aportan obras ni bibliotecas reales. Las capturas muestran la interfaz de
MangaList y datos demo. La prueba cubre 500 obras en un rango: no garantiza un
listener para bibliotecas que requieren varios rangos. Targets observados no son
lecturas facturadas ni una medición de consumo global.

ML-09 sigue abierta: falta resolver la búsqueda y completar aceptación humana,
Safari/iOS, perfiles móviles, suspensión completa de Android y recuperación
operativa tras reinicio real de cuota. No hay fusión, despliegue ni cambios remotos.
