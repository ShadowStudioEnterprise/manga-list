## Cambio

Describe el problema y el comportamiento resultante.

Si cambia un contrato, referencia los requisitos `ML-*` de `docs/specification-v1.md`
y explica su compatibilidad con reglas, marcadores y clientes anteriores.

## Validación

- [ ] `npm run lint:check`
- [ ] `npm run check:spark`
- [ ] Regresiones relevantes (`npm test`) si cambia comportamiento.
- [ ] Pruebas de reglas o E2E cuando el cambio afecta a Firebase o a los flujos de usuario.
- [ ] Compilación SPA/PWA cuando corresponda.
- [ ] Auditoría de ambos árboles si cambian dependencias o lockfiles.
- [ ] Especificación y `CHANGELOG.md` actualizados cuando cambia un contrato o comportamiento.

Indica qué se ejecutó, resultados y límites. Los checks de CI no certifican producción.

## Configuración

Indica si requiere cambios en `.env`, reglas de Firestore o Firebase Console.
No incluyas credenciales ni datos de usuarios.

Solo Spark, sin Blaze, facturación ni servicios que requieran pago. No añadas despliegue
automático. Un PR o una marca de esta plantilla no autoriza fusionar, publicar, restaurar,
cambiar IAM/consola o modificar cuentas/datos remotos: requiere autorización expresa.
