# Pasarela celular: corrección posterior al ensayo

Esta carpeta contiene la versión mantenida de los instrumentos de transporte, corregida tras la revisión del PR #37. La clave de entrada y el secreto aleatorio de sesión son independientes: conocer una entrada consumida no permite construir una cookie válida. Se conserva la caducidad absoluta sin renovación automática, el acceso por loopback, las rutas acotadas y la restricción al proyecto demo.

```sh
node --test proposals/ml09/cellular-relay/relay.test.mjs proposals/ml09/cellular-relay/tunnel-guardian.test.mjs
node scripts/check-ml09-cellular-evidence.mjs
```

CI ejecuta estas comprobaciones antes de instalar dependencias. Las 22 pruebas utilizan upstreams y un proceso de túnel simulados; no exponen servicios externos. El verificador lee los 69 archivos originales, el ZIP y las 500 obras, y compara 12 hashes de fuentes con el candidato histórico mediante Git. Requiere ese commit disponible en el clon; CI descarga el historial completo.

`relay.mjs` exporta `createLabRelay` sin arrancar servidores al importarse. `tunnel-guardian.mjs` es un ejecutable que recibe una configuración local privada; no es una orden para abrir un túnel. Cualquier nuevo ensayo externo requiere su autorización y configuración demo. Esta corrección solo se verifica con pruebas de laboratorio y no repite ni amplía la aceptación física de Safari/iPhone.

Los [archivos sellados del ensayo](../evidence/iphone-cellular-2026-11-06/manifest-sha256.json) conservan sus bytes y el fallo histórico. Sus lanzadores apuntan a la pasarela anterior: no deben reutilizarse para abrir otro laboratorio. Para una integración futura se debe usar la implementación de esta carpeta y revisar la configuración de transporte por separado.

Los overrides de dependencias corrigen `minimatch` con 11.0.5 en ambos lockfiles y `glob` con 14.0.2 en el lockfile PWA, sin reducir el nivel de auditoría. Referencias: [aviso de minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) y [aviso de glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4).

Validación local de la corrección: 22 pruebas aprobadas, verificador celular aprobado, `lint:check` completo aprobado y auditoría offline sin hallazgos. `npm audit --package-lock-only --audit-level=low` devuelve cero vulnerabilidades para ambos lockfiles. El lint local reutiliza las dependencias existentes; la instalación limpia y la compatibilidad completa de los nuevos overrides deben confirmarse en CI. Los resultados físicos y los informes sellados no cambian.

ML-09 sigue abierta. No se modifica el candidato ensayado, Firebase remoto, datos reales, billing ni servicios de pago. No se fusiona ni despliega.
