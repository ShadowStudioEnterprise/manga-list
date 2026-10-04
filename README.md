# MangaList

MangaList es una aplicación web/PWA privada para guardar mangas, manhwas, manhuas y otras
lecturas, recordar el último capítulo leído y volver rápidamente a la fuente correcta.

Cada cuenta utiliza su propia biblioteca en Cloud Firestore y recibe actualizaciones en tiempo
real entre dispositivos. No hay perfiles públicos ni funciones sociales.

[Abrir la aplicación](https://mangalist-61bb8.web.app)

## Funciones incluidas

- Registro e inicio de sesión con correo y contraseña.
- Acceso con Google, sesión persistente, cierre de sesión y recuperación de contraseña.
- Rutas privadas y biblioteca aislada por usuario.
- Crear, editar y eliminar obras con confirmación.
- Capítulos almacenados como texto (`24`, `24.5`, `001`, `45 Extra`, etc.).
- Incremento/decremento transaccional de capítulos numéricos y editor manual para los demás.
- Varias fuentes por obra, una fuente principal y apertura segura en una pestaña nueva.
- Búsqueda instantánea, filtros combinables, favoritos, contadores y orden persistente.
- Importación JSON, CSV y TXT con previsualización de válidos, duplicados y errores.
- Exportación completa a JSON y simplificada a CSV.
- Bookmarklet `+ MangaList` con precompletado de título, URL y detección básica de capítulo.
- PWA instalable con manifest, iconos y service worker generado por Workbox.
- Eliminación de cuenta con reautenticación y borrado previo de la biblioteca.

## Stack

- Vue 3 y Composition API (JavaScript).
- Quasar Framework y Vue Router.
- Pinia.
- Firebase Authentication.
- Cloud Firestore.
- Quasar CLI con Vite y modo PWA.

## Requisitos

- Node.js `22.22.x`, `24.x` o `26.x`.
- npm.
- Un proyecto Firebase con una aplicación web registrada.
- Firebase CLI para desplegar reglas o ejecutar las pruebas con el emulador.
- Java 21 o superior para el emulador de Firestore.

## Instalación

```bash
npm ci
npm ci --prefix src-pwa
Copy-Item .env.example .env
```

En macOS/Linux, el segundo comando es `cp .env.example .env`.

Completa `.env` con la configuración de la aplicación web de Firebase:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Quasar carga las variables `VITE_FIREBASE_` mediante `build.env.clientPrefix` en
`quasar.config.js`. Reinicia el servidor de desarrollo después de cambiar `.env`.

No hay credenciales reales en el repositorio. Quasar incorpora estas variables al cliente durante
la compilación; la seguridad de los datos no depende de ocultar la API key, sino de Authentication
y de las reglas de Firestore.

## Configuración de Firebase Console

1. Crea o selecciona un proyecto en Firebase Console.
2. En **Configuración del proyecto > Tus apps**, registra una aplicación web y copia sus seis
   valores al archivo `.env`.
3. En **Authentication > Sign-in method**, activa:
   - Email/Password.
   - Google y su correo de soporte.
4. En **Authentication > Settings > Authorized domains**, añade cada dominio de despliegue.
   `localhost` debe estar autorizado para desarrollo local.
5. Crea **Cloud Firestore**. Elige la región con cuidado: después no se puede cambiar.
6. Publica [firestore.rules](./firestore.rules) antes de abrir la aplicación al público.

El proyecto incluye [firebase.json](./firebase.json), por lo que las reglas pueden desplegarse así:

```bash
npm install --global firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

No uses reglas temporales abiertas. Las incluidas solo permiten a un usuario autenticado leer o
escribir bajo su propio UID y también validan el esquema, tamaños, timestamps y un máximo de
una fuente principal por obra.

## Modelo de datos

Cada obra vive en:

```text
users/{uid}/mangas/{mangaId}
```

Ejemplo simplificado:

```js
{
  schemaVersion: 1,
  name: 'Nano Machine',
  normalizedName: 'nano-machine',
  chapter: '276',
  type: 'manhwa',
  genres: ['Acción', 'Artes marciales'],
  readingStatus: 'following',
  publicationStatus: 'publishing',
  sources: [
    {
      id: 'uuid',
      name: 'Fuente principal',
      url: 'https://example.com',
      isPrimary: true,
    },
  ],
  notes: '',
  favorite: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}
```

El listener de Firestore se abre únicamente para el UID autenticado y se limpia al cambiar de
cuenta, cerrar sesión o desmontar el layout privado.

## Desarrollo y compilación

```bash
# Desarrollo SPA
npm run dev

# Formatear y corregir lint
npm run lint

# Comprobar formato y lint sin modificar archivos
npm run lint:check

# Producción SPA
npm run build

# Producción PWA
npm run build:pwa
```

Los resultados se generan en `dist/spa` y `dist/pwa`. Para probar el service worker utiliza un
servidor HTTP; abrir `index.html` mediante `file://` no funciona. En producción la PWA necesita
HTTPS, salvo en `localhost`.

## Publicación en Firebase Hosting

La PWA se publica en [mangalist-61bb8.web.app](https://mangalist-61bb8.web.app).
El sitio `mangalist-61bb8` y la carpeta `dist/pwa` están definidos en `firebase.json`.

```bash
# Requiere Firebase CLI, sesión iniciada y .env configurado
npm run deploy:hosting
```

El despliegue compila primero la PWA mediante el hook `predeploy` y publica únicamente Hosting.
Para publicar cambios de reglas se mantiene el comando independiente
`firebase deploy --only firestore:rules --project mangalist-61bb8`.

El HTML, el manifest y el service worker se revalidan para recibir actualizaciones. Los recursos
con hash en el nombre usan caché de larga duración. Los archivos ocultos y los mapas de código
no se publican. La navegación conserva las rutas hash, por ejemplo `/#/library` y `/#/add`.

Los dominios `mangalist-61bb8.web.app` y `mangalist-61bb8.firebaseapp.com` deben estar autorizados
en Firebase Authentication. Si se añade un dominio propio, autorízalo también.
Consulta la [configuración oficial de Hosting](https://firebase.google.com/docs/hosting/full-config)
para personalizar cabeceras, redirecciones o dominios.

## Pruebas automatizadas

```bash
# Regresiones de configuración, edición, autenticación e importación
npm test

# Reglas y transacciones contra Firestore local (requiere Firebase CLI y Java)
firebase emulators:exec --project demo-mangalist --only firestore "npm run test:rules"
```

Las pruebas de reglas usan el proyecto de demostración `demo-mangalist` y rechazan conexiones
a hosts externos. Si el emulador ya está arrancado, ejecuta `npm run test:rules`; por defecto
conecta a `127.0.0.1:8188`, el puerto definido en `firebase.json`. No requieren credenciales de
Firebase ni acceden a datos de producción. Se comprueban el aislamiento por usuario, los límites
del esquema, las fuentes principales y los conflictos entre ediciones concurrentes.

Para ejecutar los flujos completos en Chromium:

```bash
# Una vez, después de npm install
npx playwright install chromium

# Arranca emuladores, servidor de prueba y navegador; los cierra al terminar
npm run test:e2e
```

La suite usa Authentication en `127.0.0.1:9199`, Firestore en `127.0.0.1:8188` y la aplicación
en `127.0.0.1:9100`. Estos puertos deben estar libres. El servidor se inicia con una configuración
ficticia `demo-mangalist` que sustituye los valores de `.env`; el navegador bloquea peticiones
externas. `QCLI_FIREBASE_EMULATORS=true` solo conecta a los emuladores durante desarrollo y exige
un proyecto con prefijo `demo-`. En producción esta opción no activa los emuladores.

Se prueban el bookmarklet durante recuperación y registro, la persistencia e inicio de sesión,
las ediciones entre dos pestañas, conflictos, importación/exportación, aislamiento entre cuentas
y edición/borrado en móvil. Las capturas y trazas quedan en `test-results/` cuando falla una prueba.
El acceso OAuth con una cuenta real de Google requiere una comprobación manual independiente.

Referencias: [servidor de pruebas de Playwright](https://playwright.dev/docs/test-webserver),
[emulador de Authentication](https://firebase.google.com/docs/emulator-suite/connect_auth) y
[emulador de Firestore](https://firebase.google.com/docs/emulator-suite/connect_firestore).

## Importación y exportación

La ruta privada `/settings/import-export` nunca escribe un archivo directamente: primero muestra
una previsualización y permite seleccionar registros.

### JSON

```json
[
  {
    "name": "Nano Machine",
    "chapter": "276",
    "type": "manhwa",
    "genres": ["Acción"],
    "readingStatus": "following",
    "publicationStatus": "publishing",
    "url": "https://example.com"
  }
]
```

También se aceptan objetos con una lista en `mangas`, `items`, `records` o `data`.

### CSV

```csv
name,url,chapter,type,status
Nano Machine,https://example.com,276,manhwa,following
Solo Leveling,https://example.com,200,manhwa,completed
```

El importador reconoce nombres habituales de columnas en español e inglés, celdas entrecomilladas
y saltos de línea dentro de celdas. La exportación CSV conserva además `sources` como JSON para
permitir un round-trip de varias URLs.

Las filas con más o menos celdas que la cabecera se marcan como errores. Las fuentes declaradas
con una URL vacía o inválida también se muestran como errores, sin descartarlas silenciosamente.

### TXT

```text
Nano Machine | 276 | https://example.com
Solo Leveling | 200 | https://example.com
```

Una línea TXT debe tener dos o tres partes. Los registros erróneos no se pueden seleccionar. Los
duplicados no vienen seleccionados por defecto, pero el usuario puede importarlos expresamente.
Tras una importación completa se limpia la previsualización. Si hay fallos parciales, los registros
ya importados quedan bloqueados para que un reintento no vuelva a crearlos.

## Bookmarklet

En **Ajustes > Marcador + MangaList** hay un botón arrastrable y una acción para copiar su código.
Al ejecutarlo desde otra web abre:

```text
https://tu-dominio.example/#/add?title=...&url=...
```

La ruta `/add` muestra siempre el formulario antes de guardar. Solo intenta detectar capítulos
claros en patrones como `/chapter-276`, `/chapter/276` o `/capitulo-276`; no hace scraping ni
sobrescribe silenciosamente datos.

Como el router usa modo `hash`, conserva `#/add` al personalizar manualmente el bookmarklet.
El destino y sus parámetros se conservan al iniciar sesión, registrarse o pasar por recuperación
de contraseña.

## Estructura principal

```text
src/
├── boot/firebase.js
├── components/
│   ├── import/ImportPreview.vue
│   └── manga/
├── constants/manga-options.js
├── layouts/
├── pages/
├── router/
├── services/
├── stores/
└── utils/
```

- `services/` concentra Firebase, importación y exportación.
- `stores/` mantiene sesión, biblioteca y preferencias locales.
- `utils/` contiene normalización, capítulos, validación, errores y bookmarklet.
- Las vistas y componentes no construyen rutas Firestore directamente.

## Seguridad y operaciones sensibles

- Las URLs solo aceptan protocolos HTTP/HTTPS.
- Los mensajes mostrados al usuario no exponen códigos internos de Firebase.
- El incremento de capítulos utiliza una transacción para evitar perder actualizaciones.
- El formulario guarda solo los campos modificados y comprueba su valor anterior dentro de una
  transacción. Conserva cambios remotos en otros campos; si el mismo campo cambió en otro
  dispositivo, avisa y permite cargar la versión actual con confirmación antes de descartar el
  borrador local. El editor manual de capítulos también detecta estos conflictos.
- El borrado de cuenta reautentica primero, elimina obras en lotes y finalmente elimina Firebase
  Authentication. Si la sesión es antigua o la contraseña no es válida, la operación se detiene.
- Si más adelante se añaden subcolecciones, el borrado debe migrarse a una Cloud Function/Admin
  SDK o a la extensión oficial **Delete User Data** para hacerlo recursivo.

## Fuera del MVP

No se incluyen perfiles públicos, seguidores, comentarios, reseñas, puntuaciones comunitarias,
scraping/crawling, actualización automática del último capítulo, recomendaciones, portadas o
metadatos externos, API pública, pagos, planes premium ni anuncios.

## Publicar el código en GitHub

El repositorio contiene el código, los lockfiles, las reglas de Firestore, la configuración de
Hosting y las pruebas. `.env.example` es una plantilla vacía. `.env`, credenciales locales,
dependencias, compilaciones, logs y resultados de pruebas están excluidos de Git.

La configuración `.firebaserc` y el identificador del sitio en `firebase.json` apuntan al proyecto
de MangaList. Si haces un fork para otra aplicación, cambia estos identificadores y el proyecto
del script `deploy:hosting` antes de desplegar.

Para subir este repositorio, crea un repositorio vacío en GitHub y configura su URL:

```bash
# Sustituye TU_USUARIO por el propietario del repositorio
git remote add origin https://github.com/TU_USUARIO/manga-list.git
git push -u origin HEAD
```

El workflow `.github/workflows/ci.yml` comprueba formato, lint, regresiones, reglas de Firestore,
flujos E2E y compilaciones SPA/PWA en cada push y pull request. Usa un proyecto de demostración;
no necesita secretos de Firebase ni publica cambios en Hosting. El despliegue sigue siendo
manual mediante `npm run deploy:hosting` desde un entorno configurado.

El workflow solo solicita lectura del repositorio y fija las acciones a revisiones concretas.
Puedes consultar la [documentación de GitHub Actions](https://docs.github.com/actions) y la
[guía de Playwright para CI](https://playwright.dev/docs/ci-intro) para adaptarlo.

## Siguientes mejoras recomendadas

- Ampliar la cobertura de normalización y casos de importación.
- Ampliar los tests E2E a otros navegadores y al flujo de recuperación de contraseña completo.
- Firebase App Check, límites por cuenta y alertas de presupuesto antes de abrir el registro a gran escala.
- Cloud Function/Admin para borrado recursivo al crecer el modelo.
- Portadas y metadatos externos opcionales.
- Extensión de navegador reutilizando la ruta `/add` y los parsers aislados.
- División adicional del bundle del SDK Firebase si el tamaño inicial se vuelve relevante.
