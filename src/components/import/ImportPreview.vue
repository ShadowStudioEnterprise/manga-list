<template>
  <section v-if="preview" class="q-mt-lg" aria-labelledby="preview-heading">
    <div class="row items-end justify-between q-col-gutter-md q-mb-md">
      <div class="col">
        <p class="eyebrow text-primary q-mb-xs">Revisa antes de importar</p>
        <h2 id="preview-heading" class="text-h5 text-weight-bold q-my-none">
          {{ preview.summary.detected }} obras detectadas
        </h2>
      </div>
      <div class="col-auto">
        <q-btn
          flat
          no-caps
          icon="restart_alt"
          label="Elegir otro archivo"
          :disable="importing"
          @click="$emit('reset')"
        />
      </div>
    </div>

    <div class="import-summary-grid q-mb-lg">
      <q-card flat bordered class="summary-card summary-card--valid">
        <q-card-section
          ><strong>{{ preview.summary.valid }}</strong
          ><span>Nuevas</span></q-card-section
        >
      </q-card>
      <q-card flat bordered class="summary-card summary-card--duplicate">
        <q-card-section
          ><strong>{{ preview.summary.duplicates }}</strong
          ><span>Duplicados</span></q-card-section
        >
      </q-card>
      <q-card flat bordered class="summary-card summary-card--error">
        <q-card-section
          ><strong>{{ preview.summary.errors }}</strong
          ><span>Con errores</span></q-card-section
        >
      </q-card>
    </div>

    <q-card flat bordered>
      <q-tabs
        v-model="tab"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        narrow-indicator
      >
        <q-tab name="valid" :label="`Correctos (${preview.valid.length})`" no-caps />
        <q-tab name="duplicate" :label="`Duplicados (${preview.duplicates.length})`" no-caps />
        <q-tab name="error" :label="`Errores (${preview.errors.length})`" no-caps />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel
          v-for="category in categories"
          :key="category.name"
          :name="category.name"
          class="q-pa-none"
        >
          <q-list v-if="category.items.length" separator>
            <q-item v-for="item in category.items" :key="item.id" class="import-item q-py-md">
              <q-item-section v-if="item.status !== 'error'" avatar top>
                <q-checkbox
                  v-model="item.selected"
                  :disable="importing || item.imported"
                  :aria-label="`Seleccionar ${item.manga?.name}`"
                />
              </q-item-section>
              <q-item-section avatar top v-else>
                <q-icon name="error_outline" color="negative" size="24px" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ item.manga?.name || `Registro ${item.sourceIndex || 'sin número'}` }}
                </q-item-label>
                <q-item-label v-if="item.manga" caption>
                  Capítulo {{ item.manga.chapter || '—' }} · {{ item.manga.type || 'sin tipo' }}
                </q-item-label>
                <q-item-label v-if="item.duplicateOf" caption class="text-warning">
                  Coincide con {{ item.duplicateOf.name || 'otra obra de la importación' }}.
                </q-item-label>
                <ul v-if="item.errors.length" class="import-errors q-mb-none q-mt-xs">
                  <li v-for="error in item.errors" :key="`${error.field}-${error.code}`">
                    {{ error.message }}
                  </li>
                </ul>
              </q-item-section>
              <q-item-section side top>
                <q-badge
                  :color="item.imported ? 'positive' : badgeFor(item.status).color"
                  :label="item.imported ? 'Importado' : badgeFor(item.status).label"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="text-center text-grey-7 q-pa-xl">
            No hay registros en esta categoría.
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <div class="row items-center justify-between q-col-gutter-md q-mt-lg">
      <p class="col-12 col-sm q-mb-none text-grey-7">
        {{ selectedCount }} {{ selectedCount === 1 ? 'obra seleccionada' : 'obras seleccionadas' }}.
        Los registros con errores nunca se importan.
      </p>
      <div class="col-12 col-sm-auto row q-gutter-sm justify-end">
        <q-btn flat no-caps label="Cancelar" :disable="importing" @click="$emit('reset')" />
        <q-btn
          unelevated
          color="primary"
          no-caps
          icon="playlist_add"
          :label="`Importar ${selectedCount}`"
          :disable="selectedCount === 0"
          :loading="importing"
          @click="$emit('import')"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  preview: { type: Object, required: true },
  importing: Boolean,
})

defineEmits(['reset', 'import'])
const tab = ref('valid')

const categories = computed(() => [
  { name: 'valid', items: props.preview.valid },
  { name: 'duplicate', items: props.preview.duplicates },
  { name: 'error', items: props.preview.errors },
])
const selectedCount = computed(
  () =>
    props.preview.items.filter((item) => item.status !== 'error' && !item.imported && item.selected)
      .length,
)

function badgeFor(status) {
  return (
    {
      valid: { label: 'Correcto', color: 'positive' },
      duplicate: { label: 'Duplicado', color: 'warning' },
      error: { label: 'Error', color: 'negative' },
    }[status] || { label: status, color: 'grey' }
  )
}
</script>
