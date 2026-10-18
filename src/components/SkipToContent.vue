<template>
  <a class="skip-link" href="#main-content" @click.prevent="skipToContent">Saltar al contenido</a>
</template>

<script setup>
function skipToContent() {
  const content = document.getElementById('main-content')
  content?.focus()
  content?.scrollIntoView({ block: 'start', behavior: 'instant' })
}
</script>
