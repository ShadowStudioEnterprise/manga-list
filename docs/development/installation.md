# Instalación y desarrollo

Usa Node.js `22.22.x`, `24.x` o `26.x` y npm, como exige el repositorio.

```sh
npm ci
npm ci --prefix src-pwa
npm run check:spark
```

## Portal de documentación

No necesita `.env`, Firebase CLI ni credenciales para compilarse o servirse localmente.

```sh
npm run docs:dev
npm run docs:build
npm run docs:preview
```

Abre la dirección que muestre VitePress (desarrollo normalmente en el puerto 5173).
La salida está en `docs/.vitepress/dist`; esa carpeta y la caché quedan fuera de Git.
La compilación comprueba enlaces internos. Mantén activada esa validación y prueba
también la búsqueda local, navegación y rutas cargadas directamente.

El repositorio mantiene VitePress 1.6.4 con un override de Vite 6.4.4 limitado a
esa dependencia. Evita las dependencias vulnerables de Vite 5/esbuild que detecta
`npm audit`, sin alterar el Vite de Quasar. Es un ajuste de compatibilidad del
repositorio: al actualizar VitePress, revisa si sigue siendo necesario y repite
compilación, desarrollo, búsqueda y auditoría.

## Aplicación

Copia `.env.example` a `.env` y completa los valores de la aplicación web Firebase.
En PowerShell:

```powershell
Copy-Item .env.example .env
npm run dev
```

No sobrescribas un `.env` existente. Para pruebas de datos, utiliza el proyecto demo
y los emuladores según el [arranque Firebase](/reports/development/firebase-startup).

## Calidad

```sh
npm run lint:check
npm test
npm run docs:build
```

Las pruebas de reglas requieren Firebase CLI y Java 21 o superior:

```sh
firebase emulators:exec --project demo-mangalist --only firestore "npm run test:rules"
```

Los recorridos de navegador se ejecutan con `npm run test:e2e`. Consulta la
[matriz de navegadores](/reports/quality/browser-coverage-2026-10-18) y los
[límites de las auditorías de accesibilidad](/reports/quality/accessibility-2026-10-18).
