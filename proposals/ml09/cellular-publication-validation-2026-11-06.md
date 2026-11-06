# Validación de la entrega celular

Comprobaciones locales de publicación realizadas el 6 de noviembre de 2026:

- Pasarela: 19 pruebas aprobadas con upstreams simulados en loopback.
- Guardián: 2 pruebas aprobadas de cierre del proceso simulado por plazo absoluto y desaparición del propietario.
- Verificador offline: 69 archivos coinciden con su manifest original; SHA-256 del ZIP correcto; 500 obras únicas y todos los campos coinciden con la instantánea demo. Controles parcial y alterado rechazados.
- `unzip -tq`: archivo sin errores de compresión.
- Los 12 archivos del registro de fuentes coinciden en tamaño y SHA-256 con `git show` del candidato `28d876d394dc3e5bf458303abd181f10ecb33b3b` obtenido de origin.
- Auditoría offline del repositorio con los nuevos archivos preparados: 617 archivos rastreados, cero hallazgos; no es una comprobación de servicios remotos.
- Formato comprobado para los tres documentos de seguimiento e índice modificados. La evidencia se excluye del formateador para conservar sus hashes y finales de línea originales. Sus espacios históricos también se conservan.

Estas verificaciones comprueban la entrega y sus instrumentos; no repiten la prueba física ni certifican nuevamente la aplicación actual de `main`. No se ejecutaron builds, despliegues ni acciones de Firebase remoto. Los errores históricos, el cierre de sesión y los límites de atribución siguen en el informe original. La decisión de no investigar el cierre de sesión está en el seguimiento del propietario. ML-09 permanece abierta.
