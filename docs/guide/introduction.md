# Introducción

MangaList es una aplicación privada para gestionar bibliotecas de manga, manhwa y
manhua. Cada cuenta conserva sus obras en Firestore y accede con correo/contraseña
o Google mediante Firebase Authentication.

## Funcionalidades

- Registrar obras, favoritos, géneros y estados de lectura/publicación.
- Guardar el capítulo como texto, incluidos capítulos especiales.
- Mantener varias fuentes y elegir una principal.
- Buscar, combinar filtros y ordenar la biblioteca.
- Importar JSON, CSV y TXT con previsualización; exportar JSON y CSV.
- Instalar la PWA, recuperar borradores opcionales y recibir avisos de actualización.

La sincronización requiere conexión. Los borradores de pestaña no equivalen a una
copia de seguridad ni garantizan disponibilidad tras cerrar la sesión del navegador.

## Recorrido de la documentación

Los [diagramas técnicos](/architecture/diagrams) explican el
[acceso](/architecture/diagrams#autenticacion),
la [sincronización](/architecture/diagrams#sincronizacion-entre-pestanas-y-dispositivos),
la [importación](/architecture/diagrams#importacion-recuperable),
la [exportación](/architecture/diagrams#exportacion-y-copia-dividida) y
la [eliminación de cuentas](/architecture/diagrams#eliminacion-ordinaria-de-cuentas).

Empieza por la [arquitectura](/architecture/overview) y la
[instalación](/development/installation). Consulta la
[especificación v1](/reports/project/specification-v1) para contratos y pruebas relacionados.
Los informes describen la rama y sus evidencias fechadas; no certifican por sí solos
la versión actualmente publicada en [la aplicación](https://mangalist-61bb8.web.app).

El portal es estático y público: no necesita iniciar sesión ni consulta las bibliotecas.
