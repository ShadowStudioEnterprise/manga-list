<template>
  <q-page class="error-page flex flex-center q-pa-lg">
    <div class="text-center">
      <q-icon name="auto_stories" size="72px" color="primary" />
      <p class="error-code q-mb-none">404</p>
      <h1 class="text-h4 text-weight-bold q-mt-none">Esta página no está en la biblioteca</h1>
      <p class="text-body1 text-grey-7 q-mb-lg">
        Puede que el enlace sea antiguo o esté incompleto.
      </p>
      <q-btn unelevated color="primary" no-caps label="Volver a MangaList" to="/" />
    </div>
  </q-page>
</template>

<script setup>
// Página de error deliberadamente independiente de los layouts autenticados.
</script>
