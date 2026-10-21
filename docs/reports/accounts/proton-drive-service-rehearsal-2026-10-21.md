# ML-11: primer ensayo de servicio en Proton Drive

Fecha: 21/10/2026. **Ensayo parcial con archivos ficticios en la cuenta existente
autorizada por el usuario. Procedimiento real sin activar.**

El usuario indicó que ya tenía cuenta y autorizó continuar; después confirmó
«sesión iniciada» tras realizar personalmente el acceso en el navegador. Esto
amplía el alcance anterior de preparación local al ensayo acotado en Proton; no
autoriza cuentas/expedientes Firebase, invitaciones, enlaces públicos, cambios de
seguridad, compras ni activación. No se solicitaron contraseñas o códigos al chat.

## Acciones realizadas y evidencia

Se creó la carpeta `ML11-ENSAYO-SINTETICO-20261021`. Se cargaron cinco archivos,
3.389 bytes de contenido inicial: instrucciones, tres casos ficticios y manifiesto.
No se copió la ficha de conclusión ni el vínculo restringido del paquete anterior:
no se ha creado una falsa revisión independiente bajo la misma cuenta.

| Comprobación                         | Resultado observado                                                              | Límite                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Crear carpeta y cargar archivos      | Interfaz confirmó carpeta creada y 5/5 transferencias terminadas                 | No prueba disponibilidad futura, cuota facturada ni respaldo                          |
| Descargar `SYN-PD-001.json` original | 688 bytes; SHA-256 coincide con el original local                                | Una muestra; no se descargó y contrastó todo el archivo de expedientes                |
| Subir segunda versión ficticia       | Archivo de 730 bytes visible; historial mostró versión actual y anterior         | No se verificó la huella de una descarga de la segunda versión                        |
| Restaurar versión anterior           | Interfaz confirmó restauración conservando otras versiones                       | No prueba recuperación tras perder cuenta, equipo o claves                            |
| Descargar tras restaurar             | 688 bytes y misma SHA-256 que el original                                        | Recuperación de contenido del archivo de muestra, no de permisos ni de toda una copia |
| Consultar compartición               | Carpeta y archivo de muestra: solo propietario visible y enlace público inactivo | No hay prueba desde una segunda identidad ni auditoría externa                        |
| Límite del historial                 | La interfaz indica 10 versiones y hasta 7 días                                   | No cubre por sí solo revisiones de 30/90 días                                         |

Huella de la muestra original y restaurada:

```text
9657814c65190f217b878092b1427655f4a44e0f348cc613846b8cd131ca9651
```

Las descargas se conservaron localmente como evidencia sintética. Las huellas
contrastan bytes, no identidad, autorización jurídica ni custodia independiente.
El indicador de modificación del archivo mostró fechas procedentes del archivo
original: no usarlo como prueba del instante de carga, finalización o revisión.

## Estado PD01–PD09

| ID   | Estado tras el ensayo                                                       | Qué falta                                                                                                             |
| ---- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| PD01 | Parcial: sesión existente accesible tras login del usuario                  | MFA positivo/negativo, recuperación de acceso y datos, cierre/revocación; no se alteró la configuración               |
| PD02 | Parcial: propietario y enlace público inactivo en carpeta y muestra         | Invitación nominal autorizada y contraste desde persona no invitada                                                   |
| PD03 | No ejecutado                                                                | Revisor independiente pendiente; comprobar propiedad separada y denegaciones de escritura cruzada                     |
| PD04 | No ejecutado como prueba de permisos                                        | No se invitaron lectores/editores ni se cambió Access; faltan delegación y revocación                                 |
| PD05 | Parcial: carga, descarga, historial y restauración de una muestra correctos | Exportación completa, permisos restaurados, copia cifrada, destino separado y recuperación tras pérdida               |
| PD06 | No acreditado                                                               | Registro completo de lecturas/denegaciones y controles alternativos P3; no se infiere ausencia universal del producto |
| PD07 | No ejecutado                                                                | Contingencia por indisponibilidad, cuota y pérdida de equipo, sin provocar daño a la cuenta                           |
| PD08 | Mesa local previa conservada; sin nueva prueba de servicio                  | La agenda humana y D3 no se sustituyen por cargar los JSON                                                            |
| PD09 | Parcial: límite de historial observado                                      | Matriz D5, papelera, descargas/copia, retirada de permisos y cierre documentado                                       |

Ningún criterio compuesto PD01–PD09 se declara completado por este ensayo. No se
convierte un historial de versiones en registro completo de lecturas. P3/P4 no
quedan aceptados por comprobar carga y restauración; D3 sigue pendiente.

## Estado final y privacidad

La carpeta se conserva con los cinco archivos ficticios; la muestra vuelve al
contenido original y su versión modificada permanece en el historial del ensayo.
No se envió ninguna invitación ni se activó un enlace público. No se cambiaron
MFA, contraseña, recuperación, plan, sincronización o permisos de terceros. La
pestaña queda disponible para continuar; no se cierra la sesión del usuario.

No se publican en Git/PR dirección de cuenta, enlaces internos de Drive, nombres
de personas, claves o capturas que muestren esos datos. La captura final local
solo muestra carpeta y archivos ficticios; el historial con dirección del
propietario no se exportó como evidencia pública.

La cuenta Proton es real y se utilizó con autorización para estos archivos
sintéticos; eso no significa tratar expedientes reales. Firebase no se abrió ni
modificó. Spark exclusivamente; sin borrado automático, fusión o despliegue.

## Continuación necesaria

1. Formalizar revisor independiente, custodia y suplencia D3; no suplirlo con
   varias cuentas manejadas por el operador.
2. Definir los destinatarios y autorizar específicamente las invitaciones del
   ensayo antes de comprobar permisos entre personas.
3. Probar recuperación y continuidad con alcance acordado; no cambiar credenciales
   o cerrar sesiones de la cuenta para completar una casilla sin intervención del usuario.
4. Resolver P3/P4 y revisión jurídica D5/D7 antes de activar casos reales.

Véanse la [propuesta vigente](proton-drive-implementation-proposal.md) y el
[guion y paquete local](proton-drive-rehearsal-pack.md). Sus estados iniciales se
conservan como antecedentes; este informe registra el avance parcial del servicio.
