<template>
  <q-card
    flat
    bordered
    class="manga-card column no-wrap"
    :class="{ 'manga-card--favorite': manga.favorite }"
  >
    <q-card-section class="q-pb-sm">
      <div class="row items-start no-wrap">
        <div class="col min-width-0">
          <div class="row items-center no-wrap q-gutter-xs">
            <h2 class="manga-card__title ellipsis q-my-none">{{ manga.name }}</h2>
            <q-icon v-if="manga.favorite" name="favorite" color="secondary" size="18px">
              <q-tooltip>Favorito</q-tooltip>
            </q-icon>
          </div>
          <p class="manga-card__meta ellipsis q-mt-xs q-mb-none">
            {{ typeLabel
            }}<template v-if="manga.genres?.length">
              · {{ manga.genres.slice(0, 2).join(', ') }}</template
            >
          </p>
        </div>

        <q-btn flat round dense icon="more_vert" aria-label="Más acciones">
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 210px">
              <q-item v-close-popup clickable :to="`/manga/${manga.id}`">
                <q-item-section avatar><q-icon name="edit" /></q-item-section>
                <q-item-section>Editar</q-item-section>
              </q-item>
              <q-item v-close-popup clickable :to="`/manga/${manga.id}#sources`">
                <q-item-section avatar><q-icon name="link" /></q-item-section>
                <q-item-section>Gestionar fuentes</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="toggleFavorite">
                <q-item-section avatar>
                  <q-icon :name="manga.favorite ? 'favorite_border' : 'favorite'" />
                </q-item-section>
                <q-item-section>{{
                  manga.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'
                }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item v-close-popup clickable class="text-negative" @click="deleteDialog = true">
                <q-item-section avatar
                  ><q-icon name="delete_outline" color="negative"
                /></q-item-section>
                <q-item-section>Eliminar</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-sm col">
      <q-chip dense :color="statusColor" text-color="white" class="q-ml-none">
        {{ readingStatusLabel }}
      </q-chip>

      <div class="chapter-display q-mt-md">
        <span class="chapter-display__label">Capítulo actual</span>
        <strong>{{ manga.chapter }}</strong>
      </div>

      <p
        v-if="manga.notes"
        class="manga-card__notes text-grey-7 q-mt-md q-mb-none ellipsis-2-lines"
      >
        {{ manga.notes }}
      </p>
    </q-card-section>

    <q-card-actions vertical class="q-pa-md q-pt-sm">
      <q-btn
        v-if="manga.sources?.length"
        unelevated
        color="primary"
        no-caps
        icon-right="open_in_new"
        label="Continuar leyendo"
        class="full-width"
        @click="continueReading"
      />

      <div
        class="progress-control row items-center justify-between q-mt-sm"
        aria-label="Actualizar capítulo"
      >
        <q-btn
          flat
          round
          dense
          icon="remove"
          aria-label="Restar un capítulo"
          :loading="progressLoading === -1"
          @click="changeChapter(-1)"
        >
          <q-tooltip>Restar un capítulo</q-tooltip>
        </q-btn>
        <q-btn
          flat
          no-caps
          class="progress-control__value"
          :aria-label="`Editar capítulo actual: ${manga.chapter}`"
          @click="openManualEditor"
        >
          {{ manga.chapter }}
          <q-tooltip>Editar capítulo manualmente</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          dense
          icon="add"
          aria-label="Sumar un capítulo"
          :loading="progressLoading === 1"
          @click="changeChapter(1)"
        >
          <q-tooltip>Sumar un capítulo</q-tooltip>
        </q-btn>
      </div>
    </q-card-actions>
  </q-card>

  <q-dialog v-model="manualDialog" aria-labelledby="manual-chapter-title">
    <q-card class="dialog-card">
      <q-card-section>
        <div id="manual-chapter-title" class="text-h6">Actualizar capítulo</div>
        <p class="text-grey-7 q-mb-none">{{ manga.name }}</p>
      </q-card-section>
      <q-form @submit="saveManualChapter">
        <q-card-section>
          <q-input
            v-model.trim="manualChapter"
            autofocus
            outlined
            label="Capítulo *"
            hint="También admite valores como 45 Extra"
            :rules="[(value) => Boolean(value) || 'El capítulo es obligatorio.']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat no-caps label="Cancelar" :disable="savingManual" />
          <q-btn
            unelevated
            color="primary"
            no-caps
            label="Guardar"
            type="submit"
            :loading="savingManual"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="sourceDialog" aria-labelledby="source-dialog-title">
    <q-card class="dialog-card">
      <q-card-section>
        <div id="source-dialog-title" class="text-h6">Elige una fuente</div>
        <p class="text-grey-7 q-mb-none">No hay una fuente principal seleccionada.</p>
      </q-card-section>
      <q-list separator>
        <q-item
          v-for="source in manga.sources"
          :key="source.id"
          v-close-popup
          clickable
          @click="openSource(source.url)"
        >
          <q-item-section avatar><q-icon name="open_in_new" /></q-item-section>
          <q-item-section>
            <q-item-label>{{ source.name || 'Fuente' }}</q-item-label>
            <q-item-label caption lines="1">{{ source.url }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-actions align="right"
        ><q-btn v-close-popup flat no-caps label="Cancelar"
      /></q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="deleteDialog" aria-labelledby="delete-manga-title">
    <q-card class="dialog-card">
      <q-card-section class="row items-center q-gutter-sm">
        <q-avatar icon="delete_outline" color="negative" text-color="white" />
        <div class="col">
          <div id="delete-manga-title" class="text-h6">Eliminar obra</div>
          <p class="q-mb-none">
            ¿Seguro que quieres eliminar <strong>{{ manga.name }}</strong
            >?
          </p>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="deleting" />
        <q-btn
          unelevated
          color="negative"
          no-caps
          label="Eliminar"
          :loading="deleting"
          @click="removeManga"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { MANGA_TYPES, READING_STATUSES, getOptionLabel } from '@/constants/manga-options'
import { isValidHttpUrl } from '@/utils/validators'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'

const props = defineProps({
  manga: {
    type: Object,
    required: true,
  },
})

const $q = useQuasar()
const authStore = useAuthStore()
const mangaStore = useMangaStore()
const manualDialog = ref(false)
const sourceDialog = ref(false)
const deleteDialog = ref(false)
const manualChapter = ref('')
const manualOriginalChapter = ref('')
const progressLoading = ref(0)
const savingManual = ref(false)
const deleting = ref(false)

const typeLabel = computed(() => getOptionLabel(MANGA_TYPES, props.manga.type, 'Otro'))
const readingStatusLabel = computed(() =>
  getOptionLabel(READING_STATUSES, props.manga.readingStatus, 'Pendiente'),
)
const statusColor = computed(
  () =>
    ({ following: 'primary', pending: 'warning', completed: 'positive', dropped: 'grey-7' })[
      props.manga.readingStatus
    ] || 'grey-7',
)

function notifySaveError(error) {
  $q.notify({
    type: 'negative',
    message: getFirebaseErrorMessage(error, 'No se ha podido actualizar la obra.'),
  })
}

async function toggleFavorite() {
  try {
    await mangaStore.updateManga(authStore.user.uid, props.manga.id, {
      favorite: !props.manga.favorite,
    })
  } catch (error) {
    notifySaveError(error)
  }
}

function openManualEditor() {
  manualChapter.value = String(props.manga.chapter)
  manualOriginalChapter.value = props.manga.chapter
  manualDialog.value = true
}

async function changeChapter(direction) {
  progressLoading.value = direction
  try {
    const result = await mangaStore.changeChapter(authStore.user.uid, props.manga, direction)
    if (result.requiresManual) openManualEditor()
  } catch (error) {
    notifySaveError(error)
  } finally {
    progressLoading.value = 0
  }
}

async function saveManualChapter() {
  savingManual.value = true
  try {
    await mangaStore.updateManga(
      authStore.user.uid,
      props.manga.id,
      {
        chapter: manualChapter.value.trim(),
      },
      { expectedValues: { chapter: manualOriginalChapter.value } },
    )
    manualDialog.value = false
  } catch (error) {
    notifySaveError(error)
  } finally {
    savingManual.value = false
  }
}

function continueReading() {
  const primary = props.manga.sources.find((source) => source.isPrimary)
  if (primary) {
    openSource(primary.url)
  } else if (props.manga.sources.length === 1) {
    openSource(props.manga.sources[0].url)
  } else {
    sourceDialog.value = true
  }
}

function openSource(url) {
  if (!isValidHttpUrl(url)) return
  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer')
  if (openedWindow) openedWindow.opener = null
}

async function removeManga() {
  deleting.value = true
  try {
    await mangaStore.deleteManga(authStore.user.uid, props.manga.id)
    deleteDialog.value = false
    $q.notify({ type: 'positive', message: 'Obra eliminada.' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No se ha podido eliminar la obra.'),
    })
  } finally {
    deleting.value = false
  }
}
</script>
