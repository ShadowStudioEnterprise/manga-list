# Nextcloud ML-11: alojamiento y coste

Evaluación del 21/10/2026. Propuesta para N4 de la
[definición de implementación](nextcloud-implementation-proposal.md), pendiente
de aceptación. No se ha contratado, desplegado ni contactado con proveedores.
Firebase Spark sigue siendo gratuito y separado; este presupuesto corresponde
exclusivamente al archivo privado externo de expedientes.

## Recomendación

Para mantener el diseño N3 de auditoría, elegir como candidata de ensayo una
instalación Linux controlada en un VPS europeo de 8 GB de RAM, con registro bajo
custodia separada y copia cifrada externa. Reservar **30–50 €/mes con IVA para
infraestructura**, más mantenimiento y trabajo inicial. Es una estimación propia,
no una oferta cerrada ni una autorización de gasto. OVHcloud VPS-2 es una candidata
con precio público verificable; falta cerrar modalidad mensual, región y coste
final. No se ha demostrado todavía que cumpla los controles ML-11.

Un Nextcloud administrado de IONOS es más económico como archivo ordinario y
reduce el mantenimiento del sistema. Mantenerlo como alternativa, condicionada a
confirmar y ensayar los controles exigidos. No equiparar almacenamiento y soporte
incluidos con auditoría independiente o bloqueo ante fallo del registro.

Actualmente no activar casos reales: D3 mantiene pendiente el revisor
independiente y siguen abiertos custodia, matriz de conservación, revisión
jurídica y pruebas. El precio de un servidor no resuelve esas dependencias.

## Supuestos para comparar

- Entre 2 y 5 cuentas individuales; los roles pendientes no se presumen cubiertos.
- Expedientes documentales ligeros, hasta 10 GB de contenido activo inicial como
  hipótesis de dimensionamiento, sin bibliotecas de MangaList, vídeo ni copias de
  documentación de identidad por defecto. Medir crecimiento y registros antes de
  ampliar; conservar solo lo autorizado en D5.
- Sin Collabora, IA, correo alojado ni alta disponibilidad. Acceso privado y MFA.
- VPS propuesto: 4 vCPU, 8 GB RAM y unos 75–80 GB SSD para aplicación, base,
  sistema y margen. Es un punto de partida a probar, no capacidad garantizada.
- Comparación de caja con IVA español del 21 %, sin suponer deducibilidad ni
  resolver situaciones fiscales particulares. Precios y disponibilidad deben
  confirmarse al contratar; los importes anuales son cálculos, no ofertas anuales.

## Precios publicados y encaje

| Alternativa                          | Referencia pública sin IVA                            | Equivalente con 21 % de IVA                                        | Evaluación para ML-11                                                                                                                               |
| ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| IONOS Nextcloud, 500 GB / 5 usuarios | 6 €/mes                                               | 7,26 €/mes; 87,12 €/año                                            | La referencia más sencilla para un archivo pequeño. Capacidades de auditoría y control de acceso directo pendientes.                                |
| IONOS Nextcloud, 1 TB / 10 usuarios  | 1 €/mes los primeros 3 meses; después 9 €/mes         | 101,64 € el primer año bajo esa promoción; después 130,68 €/año    | No elegirlo por la promoción: más capacidad de la prevista. Confirmar condiciones en el pedido.                                                     |
| OVHcloud VPS-2, gama 2027            | Desde 7,21 €/mes, 4 vCPU / 8 GB / 75 GB               | Desde 8,72 €/mes; cálculo anual sobre base sin redondear: 104,69 € | Solo servidor autogestionado. Compatible en principio con preparar el diseño, sin garantía de controles ni servicio Nextcloud administrado.         |
| Hetzner CX33, Alemania/Finlandia     | Tarifa publicada de 8,49 €/mes, sin IPv4              | 10,27 €/mes, sin IPv4                                              | Referencia secundaria; la portada consultada indica indisponibilidad de la gama económica. No basar la compra en este precio.                       |
| Hetzner Storage Share NX11           | Precio no recuperable en la página pública consultada | Sin cálculo fiable                                                 | Alternativa administrada, 1 TB y copias anunciadas. Falta precio confirmado y contraste de controles. No reutilizar tarifas antiguas de buscadores. |
| Equipo propio                        | Sin alquiler adicional si ya existe equipo adecuado   | Electricidad, copias, conexión y tiempo por calcular               | Útil para ensayos ficticios; actualmente no se ha identificado equipo ni responsable de continuidad para operación real.                            |

Fuentes: [planes IONOS](https://www.ionos.es/soluciones-oficina/hosting-nextcloud-administrado),
[VPS OVHcloud](https://www.ovhcloud.com/es-es/vps/),
[tarifa Hetzner desde junio de 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/),
[disponibilidad de Cloud](https://www.hetzner.com/cloud/) y
[Storage Share](https://www.hetzner.com/storage/storage-share/).

**Condición importante de OVHcloud:** el enlace del precio «desde» conduce a un
[configurador con `pricing=upfront12`](https://www.ovhcloud.com/es-es/vps/configurator/?brick=VPS%2BModel%2B2&planCode=vps-2027-model2&pricing=upfront12&storage=75__SSD__NVMe&vcore=4__vCore).
No se ha completado el configurador: no presentar 7,21 € como tarifa mensual sin
compromiso. Confirmar pago adelantado, renovación, región UE, disponibilidad y
precio sin compromiso antes de aceptar un presupuesto. La gama se llama «2027»
en la oferta consultada; no significa que se esté presupuestando otro año.

IONOS anuncia cancelación mensual y mantenimiento de Nextcloud; las aplicaciones
añadidas siguen requiriendo atención del cliente. La compra de dominio y la copia
independiente no se presumen incluidas. Hetzner administra Storage Share, pero sus
[condiciones](https://www.hetzner.com/legal/storage-share/) dejan las aplicaciones
adicionales y su mantenimiento bajo responsabilidad del usuario. Ninguna de estas
ofertas demuestra por sí sola las condiciones N2/N3.

## Presupuesto de la candidata con VPS

Estos intervalos son **reservas de planificación propias**, no tarifas publicadas
de un paquete. Se amplían respecto al precio «desde» para no depender de una
promoción o de pagar un año anticipadamente.

| Partida mensual                      | Reserva sin IVA | Alcance y condición                                                                                                      |
| ------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Servidor de Nextcloud                | 8–12 €          | Linux, base y caché en el mismo VPS; sin administración del sistema por el proveedor.                                    |
| Receptor del registro separado       | 4–7 €           | Máquina pequeña o servicio equivalente; credenciales y administración separadas del operador. No acredita inmutabilidad. |
| Copia cifrada fuera del servidor     | 4–8 €           | Proveedor/cuenta y ubicación a seleccionar; capacidad y conservación según D5. No presumir almacenamiento inmutable.     |
| Dominio, renovación prorrateada      | 1–2 €           | Puede reducirse con un subdominio existente autorizado; no se modifica DNS.                                              |
| Alertas técnicas y margen de tráfico | 0–3 €           | Sin contenido de expedientes en avisos; revisar cuotas y facturación por exceso.                                         |
| **Subtotal estimado**                | **17–32 €**     | **20,57–38,72 € con IVA**, antes de contingencia.                                                                        |

Con una contingencia del 25 %: 25,71–48,40 €/mes con IVA. Redondear como reserva a
**30–50 €/mes; 360–600 €/año**, exclusivamente infraestructura. No es un límite
técnico que impida sobrecostes: configurar avisos y revisión de facturas si se
autoriza contratar. Una máquina temporal para restauración, ampliación del
registro o retenciones mayores pueden exigir revisar el presupuesto.

El segundo servidor solo separa el fallo del host. Si comparte una cuenta de
administrador con el primero, persiste el riesgo de pérdida o manipulación común.
La custodia y accesos separados deben probarse; la independencia de persona no se
obtiene alquilando otra máquina. Valorar otra ubicación/proveedor para las copias.

OVHcloud anuncia IPv4 y copia diaria incluidas en la oferta general. La copia
del proveedor no sustituye la copia consistente y el ensayo de restauración de
Nextcloud, ni el registro bajo custodia separada. El
[procedimiento oficial de copia](https://docs.nextcloud.com/server/stable/admin_manual/maintenance/backup.html)
incluye base de datos, datos y configuración, además de aplicaciones/tema cuando
corresponda. Los objetivos de N4 de pérdida máxima de 24 horas y recuperación en
una jornada siguen sin demostrar; no se heredan del SLA de la máquina.

## Coste de servicio y trabajo inicial

La reserva anterior **no es el precio total de un servicio mantenido**. Separar:

- Operación habitual: revisar avisos, actualizaciones ensayadas, copias, registros,
  usuarios, facturas y pruebas de restauración. Para comparar ofertas, usar como
  hipótesis 2–4 horas/mes, pendiente de medir. A una valoración ilustrativa de
  40 €/hora supone 80–160 €/mes antes de impuestos. No es una cotización de un
  profesional; las incidencias y guardias se presupuestan aparte. El trabajo propio
  puede no generar factura, pero sigue consumiendo tiempo.
- Puesta en marcha: instalación endurecida, MFA, permisos, custodia, copias,
  restauración y documentación. Solicitar importe y entregables separados del
  alquiler. El control de auditoría propuesto exige diseño, desarrollo/mantenimiento
  y pruebas todavía pendientes; el prototipo sintético no es un producto listo.
  No se dispone de un presupuesto cerrado de esa partida.
- Revisión técnica independiente y asesoramiento jurídico: alcance, honorarios
  y personas pendientes. No están incluidos en ninguna tarifa de alojamiento.

Ejemplo de coste recurrente si se factura ese mantenimiento con 21 % de IVA:
30–50 € de infraestructura más 96,80–193,60 € de trabajo = **126,80–243,60 €/mes**,
o **1.521,60–2.923,20 €/año**. Es una simulación económica basada en las hipótesis
anteriores; excluye puesta en marcha, desarrollo de auditoría, asesoría, revisión
independiente y reparaciones extraordinarias. No representa precio de proveedor.

Para comparar propuestas, sumar infraestructura, mantenimiento, implantación,
controles de auditoría, revisión/asesoría y extraordinarios del primer año.
Mientras las partidas iniciales estén abiertas no hay un coste total cerrado.

El equipo propio tampoco es gratuito: consumo mensual = vatios medios / 1.000 ×
24 × días × precio del kWh, más amortización, discos, copia externa, alimentación
de respaldo y administración. No atribuir ahorro sin medir el equipo y su tarifa.

## Condiciones para seleccionar y contratar

Confirmar por documentación o presupuesto, sin remitir expedientes de ejemplo
reales: región de datos y copias, accesos de soporte, subencargados, exportación
completa, salida del servicio, renovación y recuperación; contrato de encargo,
seguridad y posibles transferencias para revisión jurídica. El alojamiento en la
UE y la publicidad «RGPD» no validan legalmente el tratamiento. Marco de consulta:
[RGPD, artículos 28, 32 y capítulo V](https://www.boe.es/doue/2016/119/L00001-00088.pdf).

En un plan administrado, además, exigir evidencia de exportación de auditoría,
eventos de acceso y denegación, plazos de logs y copias, restauración de permisos,
MFA, revocación y posibilidad de impedir vías que eviten la mediación. Si falta
capacidad para N3, no habilitarlo para ML-11 con el diseño actual; cualquier
alternativa requiere revisión y aceptación expresa del cambio. No declarar que
el proveedor carece de esas capacidades solo porque su página no las detalla.

## Decisiones de N4 aún pendientes

1. Aceptar para planificación el intervalo de 30–50 €/mes de infraestructura y
   separar trabajo inicial, mantenimiento y revisión/asesoría. No autoriza gasto.
2. Priorizar VPS europeo de 8 GB para la candidata, manteniendo IONOS administrado
   como alternativa condicionada a demostrar N3. Confirmar precio mensual y región
   en presupuesto, evitando compromiso anual durante el ensayo.
3. Designar administración/custodia y revisor independiente conforme a D3/N2;
   contratar infraestructura no permite al operador aprobarse a sí mismo.
4. Autorizar por separado cualquier contratación, ensayo remoto o activación.
   No hay aceptación implícita por pedir esta evaluación.

No se modifica el funcionamiento de MangaList ni se habilita borrado automático
de marcadores. Esta evaluación añade una propuesta económica; N1–N5 siguen
pendientes y no cambia la aceptación condicionada de D1–D7.
