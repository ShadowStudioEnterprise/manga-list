# ML-15: confirmación antes de abrir Google

En Safari normal del Mac, la vinculación mostró bloqueo de ventana con
«Bloquear y notificar» y funcionó con una excepción temporal del sitio. Ese
resultado no demuestra por sí solo la causa del bloqueo.

La vinculación esperaba la reautenticación por contraseña antes de pedir el
popup. Ahora confirma la identidad, borra la contraseña del formulario y pide
consentimiento mediante «Abrir ventana de Google». Ese botón solicita la ventana
sin otra espera de red previa. La cancelación o cambio de cuenta descarta la
acción preparada; es de un solo uso, vive solo en memoria y caduca a los cinco
minutos. Se conserva la comprobación de cuenta actual y el rechazo de conflictos
del SDK; no se inicia sesión en otra cuenta para resolver un conflicto.

Safari controla su permiso de ventanas emergentes. La app no puede forzar un
diálogo nativo de permiso ni cambiar ese ajuste. El formulario explica cómo
permitir la ventana para MangaList si el navegador la bloquea, también después
de un error. No se abren ventanas antes del consentimiento explícito.

## Validación local

- 177 pruebas unitarias PASS, incluidas confirmación explícita, limpieza de
  contraseña, cancelación, bloqueo, reintento, cambio de cuenta, caducidad y
  apertura del SDK dentro de la llamada del segundo clic.
- Formato, ESLint, comprobación local Spark y auditoría de credenciales PASS.
- Compilación PWA con configuración demo PASS.
- Safari nativo 18.6, MacBookPro15,4, macOS 15.7.9: componente real en un harness
  local, frontera Firebase sintética y ventana loopback. Tras 6500 ms de demora
  sintética, el flujo anterior llamó al popup con activación falsa; el segundo
  clic del nuevo flujo llegó con activación verdadera y abrió la ventana. Antes
  del consentimiento no hubo un segundo popup y el campo de contraseña se había
  retirado. El navegador automatizado permitió ambas ventanas: no reproduce el
  bloqueo de la política del perfil normal ni certifica Google OAuth alojado.

Referencia técnica: [activación transitoria en WebKit](https://webkit.org/blog/13862/the-user-activation-api/).
La espera puede agotar la activación; el navegador sigue aplicando su política.

## Aceptación restante

Probar el nuevo candidato en Safari normal con «Bloquear y notificar», confirmar
identidad, comprobar que todavía no se abre Google, pulsar «Abrir ventana de
Google» y completar/cancelar el popup. Si Safari lo bloquea, comprobar la guía y
el reintento. Usar exclusivamente demos autorizadas, sin publicar secretos ni
identificadores. No desvincular métodos de demos existentes para preparar la
prueba. No se ha desplegado este cambio y ML-15 sigue abierta.

No se modifican Firebase remoto, reglas, IAM, facturación ni proveedores. No
se requieren servicios de pago; Spark exclusivamente.
