<template>
  <nav
    v-if="info.pageCount > 1"
    class="row items-center justify-center q-gutter-sm q-my-md"
    :aria-label="label"
  >
    <q-btn
      flat
      round
      icon="first_page"
      aria-label="Primera página"
      :disable="info.page === 1"
      @click="$emit('change', 1)"
    />
    <q-btn
      flat
      round
      icon="chevron_left"
      aria-label="Página anterior"
      :disable="info.page === 1"
      @click="$emit('change', info.page - 1)"
    />
    <span class="text-caption">{{ info.page }} / {{ info.pageCount }}</span>
    <q-btn
      flat
      round
      icon="chevron_right"
      aria-label="Página siguiente"
      :disable="info.page === info.pageCount"
      @click="$emit('change', info.page + 1)"
    />
    <q-btn
      flat
      round
      icon="last_page"
      aria-label="Última página"
      :disable="info.page === info.pageCount"
      @click="$emit('change', info.pageCount)"
    />
  </nav>
</template>

<script setup>
defineProps({ info: { type: Object, required: true }, label: { type: String, required: true } })
defineEmits(['change'])
</script>
