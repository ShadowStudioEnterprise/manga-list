# ML-16 — fusión y publicación completadas

25/10/2026, Europe/Madrid. Autorización del usuario: «sube todos los cambios, fusiona y despliega».

- Código y cierre de validación subidos. El informe versionado es proposals/ml16-safari-validation-2026-10-25.md; se excluyen credenciales, identidades de cuenta y herramientas/artefactos privados locales.
- PR #23 fusionada en la rama de #22 como ed2b29c4e516309b2dd0aa43c70b8aee0513577d.
- verify PASS de rama y PR: ejecuciones 40153124504 y 40153127395. GitHub impidió inicialmente fusionar #22 mientras verify seguía en curso; se esperó al éxito sin omitir la protección.
- PR #22 fusionada en main como e15b9fd2a8ae7c10949713f3c8924754285aa2c2. Su árbol coincide con ed2b29c. Checkout limpio.
- Despliegue exclusivamente hosting:app, con hooks originales Spark/build/check:release aprobados.
- Publicación: 25/10/2026 **03:39:24 CET**, equivalente a 02:39:24 UTC; release 1792895964085000, versión 2be8ccc8c569aeed.
- Build e15b9fd, dirty=false, compilado 02:39:07.498 UTC. build-info.json, build-evidence.json y sw.js públicos HTTP 200 y SHA-256 idénticos al build desplegado.
- Reglas efectivas sin cambios antes/después; facturación desactivada/sin cuenta y Firestore Standard confirmados por el hook remoto posterior.
- Safari nativo abre el login público después de publicar. Es una comprobación de apertura, no una repetición de OAuth/offline en e15b9fd.

No se desplegaron docs ni reglas, ni se modificaron datos de biblioteca, IAM o facturación. Los ensayos completos anteriores conservan su revisión y límites. La nueva revisión añade el informe a la fuente validada; las pruebas históricas no se renombran como ensayos de este SHA.

Evidencias en merge-publication-evidence/: publication-record.json, published-verification.json, prepublish/postpublish-readonly.json, logs de hooks y despliegue, y safari-public-login.txt/png.

[Aplicación](https://mangalist-61bb8.web.app) · [PR #22](https://github.com/ShadowStudioEnterprise/manga-list/pull/22) · [PR #23](https://github.com/ShadowStudioEnterprise/manga-list/pull/23) · [CI de integración](https://github.com/ShadowStudioEnterprise/manga-list/actions/runs/40153127395).
