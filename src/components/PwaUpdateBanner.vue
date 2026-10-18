<template>
  <q-banner v-if="pwaUpdateAvailable" class="bg-blue-1" role="status">
    <template #avatar><q-icon name="system_update" /></template>
    Hay una nueva versión disponible. Guarda los formularios en tu biblioteca, termina las
    operaciones pendientes y cierra todas las pestañas y ventanas de MangaList, incluida la app
    instalada. Después, vuelve a abrirla. Los borradores de pestaña no son una copia de seguridad.
  </q-banner>
</template>

<script setup>
import { pwaUpdateAvailable } from '@/utils/pwa-update'
</script>
