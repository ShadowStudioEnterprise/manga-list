# Procedencia de los iconos de MangaList

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
