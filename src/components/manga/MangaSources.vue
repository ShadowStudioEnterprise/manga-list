<template>
  <section aria-labelledby="sources-heading">
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <h3 id="sources-heading" class="text-subtitle1 text-weight-bold q-my-none">Fuentes</h3>
        <p class="text-caption text-grey-7 q-my-none">Añade una o varias webs de lectura.</p>
      </div>
      <q-btn
        flat
        color="primary"
        no-caps
        icon="add_link"
        label="Añadir fuente"
        :disable="modelValue.length >= MANGA_LIMITS.sources"
        @click="addSource"
      >
        <q-tooltip v-if="modelValue.length >= MANGA_LIMITS.sources">
          Máximo {{ MANGA_LIMITS.sources }} fuentes
        </q-tooltip>
      </q-btn>
    </div>

    <div v-if="modelValue.length" class="q-gutter-md">
      <q-card
        v-for="(source, index) in modelValue"
        :key="source.id"
        flat
        bordered
        class="source-row"
      >
        <q-card-section class="row q-col-gutter-md items-start">
          <div class="col-12 col-sm-4">
            <q-input
              :model-value="source.name"
              outlined
              dense
              :label="`Nombre de la fuente ${index + 1}`"
              placeholder="Fuente principal"
              :maxlength="MANGA_LIMITS.sourceName"
              @update:model-value="updateSource(index, 'name', $event)"
            />
          </div>
          <div class="col-12 col-sm">
            <q-input
              :model-value="source.url"
              outlined
              dense
              type="url"
              :label="`URL ${index + 1} *`"
              placeholder="https://…"
              :maxlength="MANGA_LIMITS.sourceUrl"
              :rules="[optionalUrlRule, requiredUrlRule]"
              lazy-rules
              @update:model-value="updateSource(index, 'url', $event)"
            >
              <template #prepend><q-icon name="link" /></template>
            </q-input>
          </div>
          <div class="col-auto row items-center no-wrap source-row__actions">
            <q-radio
              :model-value="primaryId"
              :val="source.id"
              label="Principal"
              @update:model-value="setPrimary(source.id)"
            />
            <q-btn
              flat
              round
              color="negative"
              icon="delete_outline"
              :aria-label="`Eliminar fuente ${index + 1}`"
              @click="removeSource(index)"
            >
              <q-tooltip>Eliminar fuente</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="source-empty q-pa-md text-center text-grey-7">
      <q-icon name="link_off" size="28px" class="q-mb-xs" />
      <div class="text-body2">Todavía no hay una URL. Podrás añadirla después.</div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { MANGA_LIMITS } from '@/constants/manga-options'
import { optionalUrlRule } from '@/utils/validators'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])
const primaryId = computed(() => props.modelValue.find((source) => source.isPrimary)?.id ?? '')
const requiredUrlRule = (value) => Boolean(String(value ?? '').trim()) || 'La URL es obligatoria.'

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `source-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

function addSource() {
  const isFirst = props.modelValue.length === 0
  emit('update:modelValue', [
    ...props.modelValue,
    {
      id: createId(),
      name: isFirst ? 'Fuente principal' : '',
      url: '',
      isPrimary: isFirst,
    },
  ])
}

function updateSource(index, field, value) {
  emit(
    'update:modelValue',
    props.modelValue.map((source, sourceIndex) =>
      sourceIndex === index ? { ...source, [field]: value } : source,
    ),
  )
}

function setPrimary(sourceId) {
  emit(
    'update:modelValue',
    props.modelValue.map((source) => ({ ...source, isPrimary: source.id === sourceId })),
  )
}

function removeSource(index) {
  const nextSources = props.modelValue.filter((_, sourceIndex) => sourceIndex !== index)

  if (nextSources.length && !nextSources.some((source) => source.isPrimary)) {
    nextSources[0] = { ...nextSources[0], isPrimary: true }
  }

  emit('update:modelValue', nextSources)
}
</script>
