# Política propuesta — NO VIGENTE

Textos para revisar si se aprueba Apache-2.0. No modifican la política actual ni
conceden ahora derechos de uso o contribución. No se aplican retroactivamente a
aportaciones existentes. Sustituir marcadores y comprobar enlaces al activarlos.

## Texto propuesto para README, después de aprobar

> El código original y la documentación técnica original identificados en el
> inventario de alcance de MangaList se ofrecen bajo Apache License 2.0.
> Consulta el archivo LICENSE de la raíz y los avisos de terceros de la distribución.
> Se permiten uso comercial, modificaciones y redistribución con las condiciones
> de la licencia, incluida la conservación de avisos y la indicación de cambios.
> Las dependencias y otros materiales de terceros conservan sus propias licencias.
>
> La licencia del código no concede derechos sobre el nombre o logotipo como
> marca ni supone respaldo oficial. Las bibliotecas privadas, datos personales,
> notas y copias de seguridad de usuarios quedan fuera de su alcance. El código
> no autoriza acceso al Firebase de MangaList ni a datos de otras cuentas.
> Enlaces y títulos no otorgan derechos sobre las obras o los sitios enlazados.
> Para autoalojamiento, utiliza infraestructura y datos propios autorizados y una
> identidad gráfica cuyos derechos puedas acreditar.

## Texto propuesto para CONTRIBUTING, después de aprobar

> Al presentar intencionadamente una contribución para incluirla en MangaList,
> ofrécela bajo Apache-2.0, conforme a su sección 5, salvo acuerdo explícito
> separado con el titular. Esto no transfiere tu copyright ni autoriza al proyecto
> a relicenciar unilateralmente aportaciones ajenas bajo condiciones incompatibles.
>
> Confirma en el PR que tienes derecho a aportar el material, incluyendo las
> autorizaciones de tu empleador cuando correspondan. Declara archivos de terceros,
> procedencia, versión, modificaciones, licencia, copyright y avisos aplicables;
> conserva sus textos y no les atribuyas la licencia general del proyecto.
> Declara también material generado con asistencia y su procedencia conocida;
> la asistencia automatizada no acredita por sí sola derechos ni originalidad.
> No aportes secretos, datos reales de usuarios, respaldos ni contenido de obras
> ajenas sin autorización. Usa ejemplos sintéticos y enlaces seguros.
>
> Mantén Spark sin Blaze/facturación y las comprobaciones de CONTRIBUTING. Cada
> contribución se revisa en rama y PR. No presupone autorización de fusión,
> despliegue, cambios IAM, permisos remotos ni acceso a datos de producción.

No introducir automáticamente un CLA ni cesión de copyright. Se propone una
declaración expresa en PR para procedencia y licencia de entrada. Si se adopta
DCO, decidirlo aparte y describir su certificación; un Signed-off-by no equivale
a cesión ni resuelve derechos ajenos. Las aportaciones anteriores deben aclararse
individualmente antes de relicenciarlas; una nueva política no subsana el pasado.

## Mientras siga pendiente la decisión

Conservar los avisos vigentes de README/CONTRIBUTING. Los interesados pueden
proponer cambios para revisión, pero no se debe presumir permiso general sobre
material recibido ni incorporar aportaciones sin acordar derechos suficientes.
Si se elige código visible sin licencia general, preparar un acuerdo específico
de aportaciones antes de integrarlas; no usar la cláusula Apache anterior.

## Metadatos, después de aprobación separada

Propuesta para ambos package.json: campo `license: "Apache-2.0"` solo cuando su
alcance quede efectivamente cubierto. Mantener `private: true` para evitar publicar
paquetes accidentalmente. Revisar lockfile raíz si cambia su metadato de licencia,
cabeceras y documentación para que coincidan, sin reescribir licencias ajenas.
No modificar nada de esto en el presente PR.
