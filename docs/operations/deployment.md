# Despliegues

El proyecto `mangalist-61bb8` conserva dos sitios estáticos con destinos separados:

| Destino | Sitio                     | Archivos               |
| ------- | ------------------------- | ---------------------- |
| `app`   | `mangalist-61bb8.web.app` | `dist/pwa`             |
| `docs`  | `mangalist-docs.web.app`  | `docs/.vitepress/dist` |

El sitio adicional ya existe. La asociación se versiona en `.firebaserc`.
El [procedimiento oficial de múltiples sitios](https://firebase.google.com/docs/hosting/multisites)
explica cómo seleccionar un destino concreto.

## Publicar documentación

Necesitas Firebase CLI y Google Cloud CLI autenticados, con los permisos
correspondientes. Comprueba el contenido y el uso compartido de Hosting en Spark:

```sh
npm run check:spark
npm run docs:build
npm run docs:preview
npm run check:spark:remote
npm run deploy:docs
```

`deploy:docs` selecciona exclusivamente `hosting:docs` y fija el proyecto.
Su hook vuelve a comprobar Spark y compila la documentación antes de subir archivos.
No compila la PWA ni publica reglas de Firestore. Las URLs limpias se habilitan en
VitePress y Hosting; no se añade el rewrite SPA de la aplicación al portal.

Si falta una herramienta, falla la autenticación o no se puede certificar Spark,
detén la publicación y resuelve el requisito. No retires el hook para continuar.
En entornos con una CA instalada en Windows, Node permite usar los certificados
del sistema mediante `NODE_OPTIONS=--use-system-ca`; no desactives TLS.

## Publicar la aplicación

`npm run deploy:hosting` selecciona únicamente `hosting:app`. Conserva sus hooks
de comprobación remota, compilación PWA y validación del artefacto de release,
así como cabeceras, caché y rewrite originales. Requiere fuente limpia y el
[procedimiento de versiones y recuperación](/reports/operations/releases-and-recovery).

Un comando genérico con `--only hosting` seleccionaría ambos sitios; usa los
scripts específicos. CI compila y valida la documentación, pero no publica.

## Verificar y recuperar

Después de publicar, abre la portada, una ruta interna directamente y una ruta
inexistente; comprueba navegación, búsqueda y respuesta 404. Verifica también que
la aplicación sigue disponible. Registra fecha y revisión de la publicación.

Si necesitas recuperar el portal, selecciona una versión anterior del sitio
`mangalist-docs` desde Firebase Hosting. Verifica el sitio elegido antes de actuar.
Un rollback de Hosting no restaura datos ni Authentication y comparte las cuotas
del proyecto. La recuperación de la PWA tiene sus propios contratos de compatibilidad.
