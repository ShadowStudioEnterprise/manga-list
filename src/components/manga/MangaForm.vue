<template>
  <q-form ref="formRef" class="manga-form" :inert="loading" @submit="submit">
    <q-banner v-if="draftOwner" rounded class="bg-blue-1 q-mb-md" aria-live="polite">
      <template v-if="availableDraft">
        Hay un borrador de este formulario en esta pestaña. Revisa los datos después de recuperarlo.
        <div class="q-gutter-sm q-mt-sm">
          <q-btn flat no-caps label="Recuperar borrador" :disable="loading" @click="restoreDraft" />
          <q-btn flat no-caps label="Descartar borrador" :disable="loading" @click="discardDraft" />
        </div>
      </template>
      <template v-else>
        <q-checkbox
          :model-value="draftEnabled"
          label="Conservar borrador en esta pestaña"
          :disable="loading"
          @update:model-value="setDraftEnabled"
        />
        <div class="text-caption">
          Opcional, hasta 24 horas. Incluye tus notas y enlaces, sin cifrado adicional. Evítalo en
          equipos compartidos. Guarda en tu biblioteca antes de cerrar la pestaña o actualizar la
          app.
        </div>
      </template>
      <div v-if="draftError" class="text-negative" role="alert">{{ draftError }}</div>
    </q-banner>
    <q-card flat bordered class="form-section">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-input
              v-model.trim="form.name"
              outlined
              label="Nombre *"
              autocomplete="off"
              :maxlength="MANGA_LIMITS.name"
              :rules="[requiredRule('El nombre')]"
              lazy-rules
            >
              <template #prepend><q-icon name="auto_stories" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model.trim="form.chapter"
              outlined
              label="Capítulo *"
              hint="Ej.: 24, 24.5 o Special 2"
              :maxlength="MANGA_LIMITS.chapter"
              :rules="[requiredRule('El capítulo')]"
              lazy-rules
            >
              <template #prepend><q-icon name="bookmark" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.type"
              outlined
              emit-value
              map-options
              :options="MANGA_TYPES"
              label="Tipo"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.readingStatus"
              outlined
              emit-value
              map-options
              :options="READING_STATUSES"
              label="Estado de lectura *"
              :rules="[requiredRule('El estado de lectura')]"
              lazy-rules
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.publicationStatus"
              outlined
              emit-value
              map-options
              :options="PUBLICATION_STATUSES"
              label="Estado de publicación"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.genres"
              outlined
              multiple
              use-chips
              use-input
              hide-selected
              input-debounce="0"
              new-value-mode="add-unique"
              :max-values="MANGA_LIMITS.genres"
              :options="filteredGenres"
              label="Géneros"
              @filter="filterGenres"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="form.notes"
              outlined
              autogrow
              type="textarea"
              label="Notas"
              :maxlength="MANGA_LIMITS.notes"
              counter
            />
          </div>
          <div class="col-12">
            <q-toggle v-model="form.favorite" color="secondary" icon="favorite" label="Favorito" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card id="sources" flat bordered class="form-section q-mt-md">
      <q-card-section>
        <MangaSources v-model="form.sources" />
      </q-card-section>
    </q-card>

    <div class="form-actions row justify-end q-gutter-sm q-mt-lg">
      <q-btn flat no-caps label="Cancelar" :disable="loading" @click="$emit('cancel')" />
      <q-btn
        unelevated
        color="primary"
        no-caps
        icon="save"
        :label="submitLabel"
        type="submit"
        :loading="loading"
      />
    </div>
  </q-form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import MangaSources from './MangaSources.vue'
import {
  MANGA_GENRES,
  MANGA_LIMITS,
  MANGA_TYPES,
  PUBLICATION_STATUSES,
  READING_STATUSES,
  createEmptyManga,
} from '@/constants/manga-options'
import { normalizeChapter } from '@/utils/chapter-utils'
import { requiredRule } from '@/utils/validators'
import { browserDraftStorage } from '@/utils/form-drafts'

const props = defineProps({
  initialValue: {
    type: Object,
    default: () => ({}),
  },
  loading: Boolean,
  draftOwner: { type: String, default: '' },
  draftScope: { type: String, default: '' },
  submitLabel: {
    type: String,
    default: 'Guardar',
  },
})

const emit = defineEmits(['submit', 'cancel'])
const formRef = ref(null)
const filteredGenres = ref([...MANGA_GENRES])
const form = reactive(createFormValue(props.initialValue))
let baseline = formPayload()
const draftEnabled = ref(false)
const availableDraft = ref(null)
const draftError = ref('')

if (props.draftOwner && props.draftScope) {
  try {
    availableDraft.value = browserDraftStorage().read(props.draftOwner, props.draftScope)
  } catch {
    draftError.value = 'El navegador no permite recuperar borradores en esta pestaña.'
  }
}

function persistDraft() {
  if (!draftEnabled.value) return
  try {
    browserDraftStorage().write(props.draftOwner, props.draftScope, formPayload(), baseline)
    draftError.value = ''
  } catch {
    draftEnabled.value = false
    draftError.value =
      'No se ha podido conservar el borrador. Guarda en la biblioteca antes de salir.'
  }
}

function discardDraft() {
  draftEnabled.value = false
  availableDraft.value = null
  try {
    browserDraftStorage().remove(props.draftOwner, props.draftScope)
    draftError.value = ''
  } catch {
    draftError.value =
      'No se ha podido borrar el borrador local. Borra los datos del sitio en tu navegador.'
  }
}

function setDraftEnabled(enabled) {
  if (!enabled) return discardDraft()
  draftEnabled.value = true
  persistDraft()
}

function restoreDraft() {
  let draft
  try {
    draft = browserDraftStorage().read(props.draftOwner, props.draftScope)
  } catch {
    draftError.value = 'No se ha podido recuperar el borrador.'
    return
  }
  availableDraft.value = null
  if (!draft) return
  // Preserve the original version: changing the baseline here would bypass conflict detection.
  baseline = draft.baseline
  Object.assign(form, createFormValue(draft.value))
  setDraftEnabled(true)
}

watch(form, persistDraft, { deep: true, flush: 'sync' })
defineExpose({ discardDraft })

watch(
  () => props.initialValue?.id,
  () => {
    Object.assign(form, createFormValue(props.initialValue))
    baseline = formPayload()
  },
)

function createFormValue(value = {}) {
  const defaults = createEmptyManga()
  return {
    ...defaults,
    ...value,
    name: String(value.name ?? defaults.name),
    chapter: normalizeChapter(value.chapter ?? defaults.chapter),
    notes: String(value.notes ?? defaults.notes),
    genres: Array.isArray(value.genres) ? [...value.genres] : [],
    sources: Array.isArray(value.sources) ? value.sources.map((source) => ({ ...source })) : [],
    favorite: Boolean(value.favorite),
  }
}

function filterGenres(value, update) {
  update(() => {
    const needle = value.toLocaleLowerCase('es')
    filteredGenres.value = MANGA_GENRES.filter((genre) =>
      genre.toLocaleLowerCase('es').includes(needle),
    )
  })
}

function formPayload() {
  return {
    name: form.name.trim(),
    chapter: normalizeChapter(form.chapter),
    type: form.type || 'other',
    genres: [...form.genres],
    readingStatus: form.readingStatus,
    publicationStatus: form.publicationStatus || 'unknown',
    sources: form.sources.map((source) => ({
      id: source.id,
      name: String(source.name || '').trim() || 'Fuente',
      url: String(source.url || '').trim(),
      isPrimary: Boolean(source.isPrimary),
    })),
    notes: form.notes.trim(),
    favorite: Boolean(form.favorite),
  }
}

function submit() {
  if (props.loading) return
  emit('submit', formPayload(), baseline)
}
</script>
