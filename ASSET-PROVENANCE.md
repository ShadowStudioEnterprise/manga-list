# Procedencia de los iconos de MangaList

## Portal ML-02

`docs/public/mangalist.svg` es una copia sin modificaciones del icono original
`public/icons/mangalist.svg`, con la misma licencia Apache-2.0. La portada en
`docs/.vitepress/theme/HomePortal.vue` y sus estilos se han creado para MangaList
con asistencia de Codex. La ilustración usa HTML/CSS y títulos ficticios; no
incorpora cubiertas, imágenes ni trazados de terceros. La tipografía usa Inter
distribuida por el tema VitePress (avisos incluidos por el generador legal existente)
y fuentes del sistema, sin proveedores externos ni nuevas dependencias.

## Iconos originales

Copyright 2026 Francisco Navarrete Lopez. Apache License 2.0.

El 22/10/2026 se sustituyeron en esta rama los 16 assets gráficos heredados por
un diseño geométrico original de libro abierto con marcador, creado en esta tarea
con asistencia de Codex. La fuente es `public/icons/mangalist.svg`; no se importan
logotipos, imágenes, fuentes ni trazados de terceros para realizar este diseño.
Esto documenta su creación, sin afirmar registro o exclusividad de marca.

Los PNG e ICO se derivan localmente de ese SVG; el SVG monocromo de Safari usa su
silueta de libro. Los 16 archivos anteriores no se incluyen en las nuevas salidas.
La evidencia histórica de coincidencia con Quasar queda conservada en el estudio
ML-14 y no describe los nuevos archivos.

Regeneración: con las dependencias y Chromium de Playwright instalados, ejecutar
`node scripts/generate-icons.mjs`. No contacta con servicios externos. Los hashes
y dimensiones están en `docs/measurements/ml14-original-icons.json`. Los bytes PNG
pueden cambiar con la versión del rasterizador; el SVG es la fuente editable.

La licencia del código y de estos gráficos originales no concede por sí sola
derechos de marca sobre nombres de terceros ni sobre obras enlazadas. Roboto y
Material Icons usados por la interfaz mantienen sus propias licencias, recogidas
en los avisos de terceros. Ninguna sustitución local implica un despliegue.

## ML-P06: capturas auténticas de interfaz

Capturas de la revisión de navegador del 16/10/2026, copiadas sin modificar.
Muestran exclusivamente obras sintéticas con títulos «AUDITORÍA» y controles
reales de MangaList. Inspección visual: sin correos, UID, credenciales, consola
administrativa ni datos de bibliotecas personales. No se incluyen logs ni datos
de cuentas. No certifican la versión actualmente publicada. No contienen portadas
de terceros; el icono visible documenta la interfaz histórica y no se reutiliza
como marca actual. El logotipo del sitio conserva el recurso original vigente.

| Recurso público                               | Evidencia original              | SHA-256                                                            |
| --------------------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `docs/public/screenshots/library-desktop.jpg` | `15-biblioteca-final.jpg`       | `2970ab3e0ab82aca711872a7bd67603065a2b63430bc098619bb16bf2ad3fda5` |
| `docs/public/screenshots/library-mobile.jpg`  | `14-biblioteca-final-320px.jpg` | `e301ce27bbd800ccdbba6ab255f66c1a920eb3ed502e4849b0e136e825d8d913` |
| `docs/public/screenshots/import-preview.jpg`  | `06-preview-csv.jpg`            | `81eccf32d94447d0e2f558ca6f28a6c608e3937ab12cefbad00fa666ec7e8dc7` |
