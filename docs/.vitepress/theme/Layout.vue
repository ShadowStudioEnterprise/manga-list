<script setup>
import DefaultTheme from 'vitepress/theme'
</script>

<template>
  <DefaultTheme.Layout>
    <template #not-found>
      <main class="ml-not-found" aria-labelledby="not-found-title" tabindex="-1">
        <p class="code">404</p>
        <h1 id="not-found-title">Página no encontrada</h1>
        <p>La dirección no existe o la página se ha movido.</p>
        <a href="/">Volver a la portada</a>
      </main>
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
.ml-not-found {
  padding: 96px 24px;
  text-align: center;
}
.code {
  font-size: 64px;
  line-height: 1.2;
  font-weight: 700;
}
h1 {
  margin: 24px 0;
  font-size: 24px;
  line-height: 1.4;
}
a {
  display: inline-block;
  margin-top: 24px;
  padding: 8px 16px;
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}
</style>
