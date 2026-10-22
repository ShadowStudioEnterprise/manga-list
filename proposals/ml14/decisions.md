# Decisiones pendientes y evidencia ML-14

**Estado actualizado:** Apache-2.0 elegida por el usuario, con titular indicado
Francisco Navarrete Lopez. Implementada para sus aportaciones originales en la
rama de este PR, sin fusión ni despliegue. Véase [el alcance](../../LICENSE-SCOPE.md).
Las decisiones siguientes se conservan como lista inicial de revisión: la opción
de licencia y el nombre ya están resueltos; no se presume saneada la titularidad
de material ajeno ni se autoriza la reutilización de assets pendientes.

## Decisiones que debe confirmar el titular

1. Objetivo: permitir derivados comerciales/cerrados (Apache/MIT), exigir
   reciprocidad al distribuir (GPLv3), o conservar código visible sin permiso general.
2. Opción exacta: recomendación Apache-2.0; si se elige GPL, decidir
   `GPL-3.0-only` frente a `GPL-3.0-or-later` expresamente.
3. Identidad jurídica titular y años correctos, derechos laborales/contractuales,
   autorización de coautores y procedencia de código, plantillas y documentación.
4. Alcance por archivos: originales, documentación, ejemplos; inventario de
   exclusiones de terceros. No afirmar propiedad por ser el autor de commits.
5. Iconos Quasar: acreditar procedencia y permiso para cada familia de archivos,
   o autorizar una tarea posterior para reemplazarlos por material original.
6. Licencia de entrada de contribuciones futuras y aclaración de aportaciones
   anteriores. No aplicar retrospectivamente la nueva política.
7. Paquete completo de licencias y atribuciones de los bundles realmente
   distribuidos (app, worker, portal, fuentes y herramientas si se entregan).
8. Aprobación expresa de activación para una revisión concreta, separada de la
   aprobación de este estudio. La publicación del servicio requeriría su propia
   autorización y queda fuera de ML-14.

## Secuencia futura tras decidir

Confirmar titularidad y assets; completar avisos; revisar el candidato final;
obtener aprobación expresa del titular identificando licencia y alcance; solo
entonces preparar el cambio efectivo de LICENSE/NOTICE, README/CONTRIBUTING y
metadatos. Volver a verificar main y el inventario si han cambiado dependencias.
No activar por el mero paso de este PR de borrador a revisión o por fusionar un estudio.

## Comprobaciones de esta propuesta

- Base remota y API comprobadas: `118c3acade42f446e150440ed2ae7a01887a7bdd`.
- Auditoría estática de archivos versionados, historial de licencias/assets y autores.
- Inventario de ambos lockfiles con versiones, licencias declaradas y SHA-256;
  assets con hashes; 32 paquetes directos instalados coincidentes con el lockfile.
- Fuentes oficiales contrastadas; texto Apache canónico descargado para muestra.
- Cambios limitados a `proposals/ml14/` y entrada documental en CHANGELOG.
- Ningún cambio de aplicación, configuración, reglas, workflows, paquetes o iconos.
- Sin acceso a producción/datos, cambios de permisos, facturación o despliegues.

El portal VitePress compila correctamente; avisa de chunks mayores de 500 kB,
sin bloquear la compilación. El control Spark local pasa; no certifica estado
remoto. Formato/lint, enlaces de los borradores y límites del diff se comprueban
antes del commit y se anotan en la entrega del PR. No se añaden pruebas de comportamiento para texto.
El inventario no sustituye revisión jurídica ni auditoría de un artefacto distribuido.
