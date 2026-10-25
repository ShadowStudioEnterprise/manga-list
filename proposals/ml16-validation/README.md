# ML-16 — informes y evidencias de Safari nativo

Documentación de los ensayos del 24–25/10/2026, Europe/Madrid. Safari 18.6, macOS 15.7.9. Los registros conservan su fecha, revisión y limitaciones; los documentos históricos no describen necesariamente el estado final.

## Estado final y orden de lectura

1. [Fusión y publicación de main e15b9fd](reports/PUBLICACION-MAIN-e15b9fd.md): operación completada, Hosting y reglas verificados.
2. [Matriz consolidada de la validación](reports/MATRIZ-CONSOLIDADA-FINAL.md): estado anterior a la autorización de fusionar; la situación de PR se actualiza en el registro de publicación.
3. [OAuth y arranque offline instalado](reports/CIERRE-OAUTH-OFFLINE-INSTALADA.md): PASS guiado y limitación de captura automática.
4. [CI y flujos con emuladores](reports/AMPLIACION-CI-Y-SAFARI.md): alcance de cada revisión.
5. [Actualización entre releases públicas](reports/CIERRE-ACTUALIZACION-PUBLICA.md).

El resto de [informes](reports/) conserva la preparación y el seguimiento. Los nombres de archivos de evidencias mencionados en esos informes se encuentran dentro del paquete descargable. Las rutas locales se han omitido en las copias públicas.

## Paquete de registros y capturas

[Descargar evidencias saneadas](ML16-evidencias-publicables-2026-10-25.zip?raw=true): 302 archivos seleccionados, incluidos informes, matrices, registros de red/proceso, CI, publicación y capturas revisables. Tamaño ZIP: 8 528 721 bytes.

SHA-256: b0dfe271192d674d9e06ea1a764b7a3283f313d36055f56c830f765e740201aa.

[MANIFEST.json](MANIFEST.json) contiene el inventario con hashes de las copias publicadas y el detalle de 36 exclusiones. Dentro del ZIP, SHA256SUMS cubre los archivos de evidencia. Los informes legibles de esta carpeta tienen el formato Markdown normalizado y pueden diferir del formato de las copias del ZIP.

Se han omitido identidades de cuenta, rutas personales y posibles tokens en 39 archivos de texto. No se publican credenciales, logs de autenticación, configuración auxiliar ni capturas sin texto emparejado revisable o con identidades de cuenta visibles. Los ZIP de artefactos CI no se duplican dentro del ZIP; se incluyen sus metadatos, hashes y registros, y los originales de esas ejecuciones ya estaban en GitHub Actions. Los originales locales permanecen sin modificar. Estos archivos son copias para revisión, no originales forenses inalterados.

## Límites

El renderizado durante el corte offline consta por observación del usuario y registros de red/proceso; no existe captura automática de ese intervalo. La demo remota estaba vacía. Los ensayos con emuladores no se presentan como escrituras de producción. La última publicación solo tuvo comprobación de apertura en Safari y verificación de artefactos; no se reatribuyen los ensayos previos al SHA del merge.

Esta entrega añade documentación y evidencias al repositorio. No despliega Firebase ni modifica reglas, IAM, facturación o bibliotecas.
