# ML-04 / ML-05: entrega para revisión

23/10/2026, Europe/Madrid. Base main a6627d0; ramas y PR #15/#16 comprobados como integrados antes de elegirla. Rama aislada codex/ml04-ml05-contracts-audit. Sin fusión ni despliegue, sin Firebase remoto ni datos reales, solo Spark.

## Resultado

Tres referencias internas documentan servicios, lecturas Firestore, cursores/listeners, pestañas, Pinia, errores, Auth, importación recuperable, exportación e integridad. Auditoría de las 73 páginas, con correcciones de cifras 501/1001 frente a 5001, estados de PR y una prueba ML-06 renombrada. Se preservan informes históricos y se distingue código, emuladores y registros de publicación.

Nuevo docs:check valida 25 huellas de código, 57 referencias de commits, 697 destinos locales y un inventario de 159 URLs externas. CI descarga historia completa y ejecuta ese control tras construir docs. Su prueba de regresión acepta un repositorio ficticio coherente y rechaza deriva de código, páginas sin revisar y referencias/rutas/assets/anclas rotos.

## Evidencia local

| Comprobación                        | Resultado                                                          |
| ----------------------------------- | ------------------------------------------------------------------ |
| npm run docs:build                  | Correcto; aviso de bundle >500 kB conservado                       |
| npm run docs:check                  | Correcto, cero fallos                                              |
| npm run lint y lint:check           | Ejecutados; logs finales adjuntos                                  |
| npm run check:spark                 | Correcto; sin certificación remota                                 |
| Pruebas unitarias dirigidas         | 75 correctas, cero fallos                                          |
| Regresión del auditor               | 1 correcta, cero fallos; fixture sin Firebase/red                  |
| Portal Chromium/Firefox             | Correcto; 75 HTML, 617 enlaces internos                            |
| Accesibilidad automatizada          | 38 análisis sin infracciones detectadas                            |
| Nuevas páginas                      | Cinco, móvil/escritorio y claro/oscuro; sin desbordamiento         |
| JavaScript / red externa del portal | Cero errores / cero solicitudes                                    |
| Enlaces públicos HEAD               | 65 respuestas 200, 2 respuestas 202 EUR-Lex, 92 destinos excluidos |

Se corrigió contraste 2,72:1 de la etiqueta de lenguaje de bloques de comandos del portal usando el color secundario del tema. Sin cambios de aplicación, reglas, configuración Firebase, dependencias o lockfiles.

Los primeros intentos locales por dependencias incompletas/permisos del sandbox se resolvieron antes de registrar los resultados correctos. La prueba ampliada encontró el contraste anterior y se repitió después de corregirlo. No se presentan intentos fallidos como validación.

Los JSON/logs de evidence son observaciones locales y públicas mínimas, sin bibliotecas ni credenciales. Las dependencias se reutilizaron desde una instalación de lockfile idéntico; CI utiliza npm ci. No se ejecutaron nuevos emuladores en esta entrega local; sus resultados anteriores están etiquetados como históricos. La CI del PR debe consultarse por su SHA y estado reales.

## Reproducción

Clon completo, Node según .nvmrc: npm ci, npm run docs:build, npm run docs:check, npm run lint:check, npm run check:spark, node --test tests/docs-integrity.test.js. Los comandos completos de la selección de 75 pruebas están en docs/maintenance/documentation-audit.md. Para navegador, instalar Chromium/Firefox de Playwright y ejecutar node scripts/check-docs-portal.mjs. Todo ese recorrido es local, sin credenciales Firebase. La comprobación opcional de enlaces públicos usa node scripts/check-docs-public-links.mjs y excluye app/console/API de proyectos.

## Pendientes

Dos páginas EUR-Lex responden 202; sus contenidos/anclas no se certifican. HEAD no prueba contenido, autenticación ni estado desplegado. URLs de Hosting/consolas y datos reales no se consultan. No se certifican cuotas facturables, capacidad definitiva, OAuth/correo real, Safari/dispositivos físicos, accesibilidad humana ni activación de procedimientos ML-11/12. Fusión y publicación requieren instrucciones separadas.
