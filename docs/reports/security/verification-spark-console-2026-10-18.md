# Comprobación de Spark en consola — 18/10/2026

Observación de solo lectura: 18/10/2026, aproximadamente 23:44 Europe/Madrid
(21:44 UTC). Proyecto: `mangalist-61bb8`, nombre MangaList.

| Comprobación          | Resultado observado                                                                                    | Fuente oficial                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Plan Firebase         | Spark, sin costo                                                                                       | [Descripción general](https://console.firebase.google.com/project/mangalist-61bb8/overview)        |
| Facturación vinculada | La consola indica que el proyecto no tiene cuenta de facturación y no está vinculado con ninguna       | [Cuenta vinculada](https://console.cloud.google.com/billing/linkedaccount?project=mangalist-61bb8) |
| Base Firestore        | `(default)`, edición Estándar, Firestore nativo, ubicación `eur3` (Bélgica y Países Bajos), disponible | [Lista de bases](https://console.cloud.google.com/firestore/databases?project=mangalist-61bb8)     |
| Copias programadas    | Inhabilitadas en la base mostrada                                                                      | Misma lista de bases                                                                               |

Se consultaron únicamente pantallas de metadatos. No se abrieron colecciones,
documentos de usuarios ni cuentas de Authentication. No se pulsaron opciones de
vincular facturación, prueba gratuita, actualización de plan, creación de bases,
edición de copias, despliegue o activación de servicios.

Las capturas de facturación y edición se guardaron en `audit-evidence/` del workspace,
fuera del repositorio público. Este registro describe el estado observado, no una
promesa de que otro administrador no pueda cambiarlo posteriormente.

## Sesión del CLI

El usuario autorizó renovar el CLI para consultar el plan. Se inició el acceso
oficial con Firebase CLI 15.34.0. Google mostró un consentimiento con permisos para
administrar Firebase y editar/borrar datos de Google Cloud. La revisión automática
bloqueó ese consentimiento por exceder el alcance de lectura autorizado.

No se concedieron esos permisos ni se completó la renovación. Se usó como alternativa
la sesión web ya existente, sin permisos nuevos. No se leyeron credenciales almacenadas
ni se eludió el rechazo mediante acceso a tokens o APIs manuales.

La sesión del CLI continúa sin renovar. `check:spark:remote` conserva su exigencia de
consultas oficiales frescas y no se sustituye por estas capturas ni se omite su guardia.
Un eventual despliegue sigue necesitando autorización independiente y credenciales
válidas para su comprobación previa; no se realizó ninguno.
