# ML-09: seguimiento celular del 6 de noviembre de 2026

El ensayo del candidato `28d876d394dc3e5bf458303abd181f10ecb33b3b` comprobó acceso celular guiado en Safari del iPhone 11 (iOS 27.0.1 declarado), pérdida física de red, escritura pendiente, error de confirmación al minuto y recuperación explícita con cambio concurrente. El JSON entregado coincide byte por byte con la exportación capturada en Safari: 500 obras únicas y todos sus campos iguales al emulador demo. No se inspeccionó independientemente la interfaz de Archivos ni el mecanismo de transferencia.

[Informe completo y límites](evidence/iphone-cellular-2026-11-06/INFORME-CELULAR-2026-11-06.md), [manifest de 69 archivos](evidence/iphone-cellular-2026-11-06/manifest-sha256.json) y [archivo sellado](evidence/iphone-cellular-2026-11-06/ML09-celular-evidencias-2026-11-06.zip).

## Decisión del propietario

El 6 de noviembre el propietario indicó: «descarta investigar y sube los cambios e informes». Se descarta investigar el cierre de sesión observado antes de exportar. La incidencia y la limitación de la sonda (conservaba el último estado tras perder autenticación) permanecen registradas; no se consideran corregidas ni se atribuyen a una causa demostrada. Esta decisión posterior complementa los informes sellados sin modificar sus bytes.

La autorización actual permite subir los cambios e informes. No autoriza fusionar, desplegar, modificar Firebase remoto, datos reales, billing o servicios de pago, ni marcar ML-09 completada. La autorización histórica del 26 de octubre no amplía este alcance.

## Pasarela y reproducción

**Corrección posterior a la revisión del PR #37:** usar la [pasarela mantenida](cellular-relay/README.md), que separa la clave de entrada del secreto de sesión. CI ejecuta sus 22 pruebas y el verificador celular. Las fuentes selladas descritas debajo conservan el defecto histórico y no deben reutilizarse para abrir otro laboratorio.

Las fuentes finales están en [relay/relay.mjs](evidence/iphone-cellular-2026-11-06/relay/relay.mjs). Incluyen cierre absoluto de conexiones, entrada mediante POST, cookie protegida, comprobación de origen, rutas acotadas y adaptación de Request para Safari. La opción de respuestas finitas de Listen cambia el transporte del laboratorio; no representa acceso directo a Firestore de producción ni un cambio del candidato.

Los instrumentos históricos están sellados junto con los intentos fallidos y el handoff original de Windows. Algunos dependen de rutas y herramientas locales de esa sesión: no son un CLI portable. No ejecutar los lanzadores archivados para verificar la evidencia. La pasarela no arranca al importarse; las pruebas siguientes usan servidores simulados en loopback y un proceso simulado de túnel, sin proveedor externo:

```sh
node --test proposals/ml09/evidence/iphone-cellular-2026-11-06/relay/relay.test.mjs proposals/ml09/evidence/iphone-cellular-2026-11-06/tunnel-guardian.test.mjs
node proposals/ml09/evidence/iphone-cellular-2026-11-06/verify-offline.mjs
```

El verificador offline comprueba hashes y compara las 500 obras con la instantánea capturada; no repite el ensayo físico. No se incluyen contraseñas, cookies, entradas privadas ni enlaces de acceso. El túnel y los servicios demo se cerraron al finalizar.

## Pendientes conservados

ML-09 sigue abierta: suspensión completa de Android; consumo agregado representativo, almacenamiento, transferencia, índices y causa de errores agregados de reglas; recuperación tras reinicio global de cuota durante una incidencia real sin provocar agotamiento. Si se exige inspección independiente del guardado y recuperación en la interfaz nativa de Archivos de iOS, este ensayo no cubre ese requisito adicional. La observación celular queda limitada al dispositivo, la sesión y el transporte documentados.
