# ML-17 · Auditoría de accesibilidad de MangaList

Base `dc8bfab`, con alcance en SPA/PWA y comprobaciones de regresión del portal.
Las pruebas usan emuladores y datos sintéticos. La referencia es
[WCAG 2.2 AA del W3C](https://www.w3.org/TR/WCAG22/).

## Hallazgos y regresiones

| Hallazgo                                                                         | Reproducción y corrección                                                                                                                                                                                                                                                   | Criterios relacionados |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| La ruta desconocida de la aplicación quedaba en blanco                           | Abrir `/#/ruta-inexistente` sin sesión. El componente Quasar exigía un layout ausente. La página usa un landmark principal nativo con encabezado y enlace de vuelta alcanzable con Tab y Enter.                                                                             | 1.3.1, 2.1.1           |
| El fallo de acceso y el resultado de recuperación dependían de avisos temporales | Rechazar credenciales, cortar el transporte o solicitar un enlace. El acceso expone el error junto a sus controles en un alert persistente. La recuperación expone su aviso genérico en un status y los fallos en un alert. Las regiones existen antes de la actualización. | 3.3.1, 4.1.3           |
| El botón del menú móvil carecía de estado programático                           | Abrir navegación con teclado a 320 px, seguir un enlace y comprobar el estado expandido antes, durante y después.                                                                                                                                                           | 4.1.2                  |

Al recuperar la 404, Axe midió un contraste de 4,27:1 en el texto de ayuda sobre
`#f6f6fb`. Se usa gris 8 para superar el mínimo de 4,5:1 del criterio 1.4.3.
En la cabecera oscura de acceso, el anillo índigo tenía 2,24:1 frente al fondo base.
El foco de esos enlaces usa blanco para mantener contraste con el fondo (1.4.11).

`npm run test:e2e` incluye Chromium y Firefox. Los casos de biblioteca comprueban orden
de foco, salto al contenido, Escape y retorno al control del capítulo, alta, filtros,
importación/exportación y vistas a 320, 768 y 1280 px. Axe amplía el recorrido a 404,
alta y error de recuperación. El caso de recuperación comprueba foco, descripción
accesible y estado inválido del campo. Se conservan los JSON de Axe, incluidos sus
elementos que requieren revisión humana.

El portal conserva sus pruebas de navegación, contraste, 404 y secciones desplegables
mediante `node scripts/check-docs-portal.mjs`, más `npm run test:landing`. Su línea base
incluye [ML-01](ml-01-postdeploy-2026-10-27.md) y la [portada pública](public-landing.md).
Las pruebas automatizadas cubren criterios concretos. La aceptación WCAG exige
completar la siguiente matriz sobre el candidato identificable.

## Matriz de validación humana

| Entorno y estado                                 | Recorrido y resultado esperado                                                                                                                                                 | Estado                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Windows con NVDA y Firefox, o Narrador y Edge    | Landmarks, orden y nombres. En login fallido, recuperación y validación de campo, se anuncia el mensaje pertinente una vez y puede releerse.                                   | BLOCKED · falta sesión asistida registrada    |
| macOS Safari y iOS Safari/PWA con VoiceOver      | Rotor y navegación por encabezados. Formulario, diálogo de capítulo, error de importación y vuelta al foco. Registro, recuperación y gestores de contraseñas siguen operables. | BLOCKED · falta dispositivo y sesión asistida |
| Android físico con Chrome/PWA y TalkBack         | Explorar y accionar controles, comprobar estados del menú y diálogo, recuperar sincronización y oír el aviso de actualización. Registrar orientación y tamaño del texto.       | BLOCKED · falta dispositivo con TalkBack      |
| Teclado y zoom del navegador al 200 % y 400 %    | Verificar orden lógico, foco visible y sin ocultación por cabecera, diálogos y mensajes. Recorrer login, biblioteca, Ajustes y portada del portal con y sin menú.              | Pendiente de revisión humana                  |
| Contraste manual y colores forzados              | Medir texto, bordes de controles y anillos de foco sobre gradientes, estados activos y deshabilitados. Confirmar interpretación con iconos, texto y colores de alto contraste. | Pendiente de revisión humana                  |
| Táctil, teclado virtual y rotación               | Comprobar tamaño/espaciado de objetivos, contenido a 320 px CSS, scroll y confirmaciones de importación/borrado con datos ficticios.                                           | Pendiente de revisión humana                  |
| Sin conexión, pausa de cuota y actualización PWA | Verificar que se anuncia el estado confirmado y que reintentar, cancelar o cerrar clientes no roba el foco ni pierde cambios pendientes.                                       | Pendiente de revisión humana                  |

Para cada fila, registrar revisión, navegador, sistema, tecnología de apoyo y versión,
ancho/zoom, pasos, resultado observado, evidencia saneada y PASS/FAIL/BLOCKED.
La [evidencia Android de ML-16](ml-16-android-2026-10-27.md) corresponde a otro alcance
y revisión. La emulación visual y la inspección del árbol accesible no sustituyen la
escucha con un lector nativo.
