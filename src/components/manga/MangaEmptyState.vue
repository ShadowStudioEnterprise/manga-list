<template>
  <div class="empty-state text-center q-pa-xl">
    <div class="empty-state__icon flex flex-center q-mx-auto q-mb-lg">
      <q-icon :name="filtered ? 'search_off' : 'auto_stories'" size="52px" />
    </div>
    <h2 class="text-h5 text-weight-bold q-mb-sm">
      {{ filtered ? 'No hay coincidencias' : 'Tu biblioteca está vacía' }}
    </h2>
    <p class="text-grey-7 q-mx-auto q-mb-lg empty-state__copy">
      {{
        filtered
          ? 'Prueba con otro nombre o limpia alguno de los filtros.'
          : 'Añade tu primera obra o importa una lista existente para empezar.'
      }}
    </p>
    <div class="row justify-center q-gutter-sm">
      <q-btn
        v-if="filtered"
        outline
        no-caps
        icon="filter_alt_off"
        label="Limpiar filtros"
        @click="$emit('reset')"
      />
      <template v-else>
        <q-btn unelevated color="primary" no-caps icon="add" label="Añadir obra" to="/add" />
        <q-btn
          outline
          color="primary"
          no-caps
          icon="upload_file"
          label="Importar"
          to="/settings/import-export"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({ filtered: Boolean })
defineEmits(['reset'])
</script>
