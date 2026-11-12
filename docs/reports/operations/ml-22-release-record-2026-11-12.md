# ML-22 — Publicación de MangaList 1.0.0

El titular publicó MangaList 1.0.0 el 12/11/2026 y confirmó el PASS de la
comprobación de humo en producción. Con esta evidencia se cierra ML-22.

- **Revisión compilada y desplegada.** `a30da51f204781a21adc69ace1d163f19bb32868`,
  desde `main` con árbol limpio. Sello de compilación del predeploy
  `2026-11-12T18:46:22.803Z`.
- **Destino.** Firebase Hosting `app`, proyecto `mangalist-61bb8`,
  [aplicación publicada](https://mangalist-61bb8.web.app). El identificador
  interno de la release de Hosting no se aportó.
- **Inventario.** SHA-256 de `dist/pwa/build-evidence.json`:
  `4c8fff2660988bc90c63b1592d536786614310d71539c5ec42d229c90d0a0e38`.
  `npm run check:release` pasó sobre el artefacto conservado tras el despliegue,
  con sello en `dist/pwa/build-info.json`. El hash identifica esa copia local.
- **Compatibilidad.** El artefacto es compatible con las reglas activas
  indicadas para la publicación: consultas con límite de 5001, esquema de
  13 campos con `schemaVersion: 1`, aislamiento por UID y barrera
  `deleting` que impide crear o modificar obras durante el borrado de cuenta.
  El inventario verifica los inputs locales, incluido `firestore.rules`.
  Las reglas activas no se consultaron desde esta sesión.
- **Aceptación y CI.** La
  [matriz ML-21](ml-21-acceptance-matrix-2026-11-11.md) recoge la aprobación
  del titular. Según su confirmación, el ensayo ML-10 y el job obligatorio
  `verify` del [PR #45](https://github.com/ShadowStudioEnterprise/manga-list/pull/45)
  pasaron y se cumplió la condición de ML-21. El acta local del candidato
  separa el CI del PR de los builds y la verificación local del SHA fusionado.
- **Validación posdespliegue.** Comprobación de humo en producción en PASS el
  12/11/2026, según el titular. No se aportaron detalles de cuentas de prueba.
- **Clientes PWA activos.** La activación del worker conserva el ciclo normal
  de cierre de clientes. Se preservan borradores y escrituras pendientes.
  El registro no incluye observaciones por cliente.
- **Spark y Standard.** El comando de despliegue confirmado por el titular
  exige comprobar que la facturación está deshabilitada y sin cuenta vinculada,
  y que Firestore es Standard, antes de publicar.
- **Alcance y ejecución.** El titular ejecutó manualmente la Fase 1 el
  12/11/2026 con `npm run deploy:hosting`, limitado a Hosting `app`.
  No se aportó la hora exacta de publicación.
- **Asistencia y custodia.** El titular es el responsable operativo para 1.0,
  incluidos los borrados interrumpidos. No consta un plazo específico de
  asistencia o retención. La evidencia técnica queda en `dist` y la
  comprobación de humo bajo custodia del titular.

`1.0.0` identifica la publicación de la aplicación. El registro conserva
los manifiestos y lockfiles de la revisión compilada. El campo `version: 1`
de `release-contract.json` identifica el formato del contrato de compatibilidad.
