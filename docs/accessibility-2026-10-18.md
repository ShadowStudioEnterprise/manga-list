# Revisión local de accesibilidad y pantallas pequeñas

Continuación H3 sobre `42a11f9`. Se trabaja en la rama Spark y el PR en borrador, sin
publicación, cambios remotos ni datos de producción. Fecha: 18/10/2026.

## Cambios comprobables

- Acceso, registro y recuperación de contraseña tienen un encabezado principal visible,
  también cuando se oculta el texto de presentación en móvil. Fuentes utiliza el nivel
  siguiente al título de la página, sin cambiar su apariencia.
- «Saltar al contenido» es el primer enlace de teclado de ambos layouts. Activa el foco
  en el contenido y evita modificar la ruta hash. En acceso salta también la presentación;
  en la biblioteca salta cabecera y navegación.
- El contorno de teclado usa un color sólido y prevalece sobre `.no-outline` de Quasar.
  El enlace de salto aparece al recibir foco, con fondo y contorno propios. El estado de
  sincronización y las etiquetas de navegación usan el color de texto secundario de la app.
- La navegación lateral está identificada como región de navegación. Su contenedor de
  botones, enlaces, títulos y separadores no declara una lista cuyos hijos tengan roles
  incompatibles. Los controles conservan sus roles y nombres; no se eliminan reglas de axe.

Las pruebas iniciales reprodujeron un encabezado ausente en móvil, contraste 4,27:1 del
estado sobre el fondo claro, el contorno anulado y estructura de lista incompatible en
la navegación de escritorio. Los criterios de referencia son
[redistribución](https://www.w3.org/WAI/WCAG21/Understanding/reflow),
[contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) y
[foco visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html).
No se presenta esto como certificación de cumplimiento WCAG.

## Pruebas y evidencia

`@axe-core/playwright` 4.14.0 y su motor axe se añaden solo como dependencias de desarrollo,
con integridad en el lockfile. No forman parte de la app publicada ni añaden un servicio.
Se conservan las versiones existentes del resto del árbol y sus dependencias opcionales
para otros sistemas; no se mezclan actualizaciones de bibliotecas con esta revisión.

La suite de Chromium utiliza únicamente Auth/Firestore emulados con ID `demo-mangalist`.
Abortar y registrar peticiones fuera de los destinos locales sigue siendo obligatorio;
ninguna excepción permite producción. La revisión de axe usa etiquetas A/AA de WCAG
2.0/2.1/2.2 y buenas prácticas, sin exclusiones de componentes ni desactivación de reglas.

Se comprueban cinco estados a 320 × 740 píxeles CSS: acceso, biblioteca vacía, biblioteca
con un nombre largo, formulario con fuente e importación/exportación. Se comprueba ancho
del documento y elementos que sobresalgan del área principal, además de nombres/roles,
encabezados, relaciones ARIA y contraste calculable por axe. La biblioteca se comprueba
también a 768 y 1280 píxeles, montando cada página con su ancho inicial.

Otra prueba utiliza Tab, Enter, Espacio y Escape: salto al contenido, registro por teclado,
mostrar contraseña con foco visible, apertura del editor de capítulo, foco inicial del
campo, cierre con Escape y retorno al botón de origen, y navegación lateral móvil hasta
importación/exportación. La obra de esa prueba se prepara con el ayudante habitual; no
se afirma que todo el flujo de alta y edición de obra esté probado solo con teclado.

Los informes JSON completos de axe incluyen resultados `incomplete` que requieren juicio
humano. Se guarda una captura de importación/exportación a 320 píxeles, además de capturas
y trazas cuando falla una prueba. CI conserva `test-results/` durante siete días mediante
la acción oficial `upload-artifact` 7.0.2 fijada por SHA, incluso cuando falla la suite.
Solo se incluyen datos sintéticos de los emuladores. No se publican credenciales de Firebase.

## Alcance pendiente

Las pruebas no cubren todos los estados de menús, validaciones, diálogos, colores, tamaños
de texto ni todas las combinaciones de filtros. Axe no sustituye lectura real con lector
de pantalla, revisión de orden de lectura, zoom/texto al 200 %, contraste manual sobre
fondos complejos, alto contraste del sistema, destreza motora ni pruebas de dispositivos.
No prueban instalación PWA en iOS/Android, Safari o Firefox.

La matriz de anchos comprueba layouts iniciales, no certifica redimensionamiento continuo.
Un ensayo con cambios de ancho en caliente generó un aviso de ResizeObserver de Quasar/Vite;
no se ha añadido un filtro que ignore errores del navegador. Ese comportamiento y el
redimensionamiento con zoom real quedan pendientes de revisión específica. La suite
mantiene su rechazo de errores no controlados en las páginas que prueba.

Los controles Spark, los límites de cuotas y la falta de finalización automática de borrado
sin cliente mantienen su alcance anterior. Ninguna revisión de accesibilidad cambia el plan,
los presupuestos ni las reglas remotas. No se fusiona ni se despliega este trabajo.
