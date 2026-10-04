<template>
  <q-page class="page-shell narrow-page">
    <header class="page-heading">
      <q-btn flat round dense icon="arrow_back" to="/library" aria-label="Volver a la biblioteca" />
      <p class="eyebrow text-primary q-mt-lg q-mb-xs">Nueva lectura</p>
      <h1 class="page-title q-my-none">Añadir obra</h1>
      <p class="page-subtitle q-mb-none">
        Guarda lo esencial ahora; podrás completarlo cuando quieras.
      </p>
    </header>

    <q-banner v-if="fromBookmarklet" rounded class="bookmarklet-banner q-mt-lg q-mb-md">
      <template #avatar><q-icon name="bookmark_added" color="primary" /></template>
      Hemos precompletado los datos enviados por tu marcador. Revísalos antes de guardar.
    </q-banner>

    <MangaForm
      :initial-value="initialValue"
      :loading="saving || checkingDuplicate"
      submit-label="Guardar obra"
      class="q-mt-lg"
      @submit="checkAndSave"
      @cancel="router.push('/library')"
    />

    <q-dialog v-model="duplicateDialog" persistent aria-labelledby="duplicate-dialog-title">
      <q-card class="dialog-card">
        <q-card-section class="row items-start no-wrap q-gutter-md">
          <q-avatar icon="content_copy" color="warning" text-color="white" />
          <div class="col">
            <div id="duplicate-dialog-title" class="text-h6">Posible duplicado</div>
            <p class="q-mb-none">Parece que esta obra ya existe en tu biblioteca.</p>
          </div>
        </q-card-section>
        <q-list v-if="duplicate" bordered class="q-mx-md rounded-borders">
          <q-item>
            <q-item-section>
              <q-item-label>{{ duplicate.name }}</q-item-label>
              <q-item-label caption>Capítulo {{ duplicate.chapter }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn v-close-popup flat no-caps label="Cancelar" />
          <q-btn flat color="primary" no-caps label="Ver existente" @click="viewDuplicate" />
          <q-btn unelevated color="primary" no-caps label="Crear igualmente" @click="savePending" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import MangaForm from '@/components/manga/MangaForm.vue'
import { createMangaPrefillFromBookmarklet } from '@/utils/bookmarklet-utils'
import { normalizeTitle } from '@/utils/normalize-title'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mangaStore = useMangaStore()
const saving = ref(false)
const checkingDuplicate = ref(false)
const duplicateDialog = ref(false)
const duplicate = ref(null)
const pendingManga = ref(null)

const bookmarkletParams = new URLSearchParams()
for (const [key, value] of Object.entries(route.query)) {
  if (typeof value === 'string') bookmarkletParams.set(key, value)
}

const initialValue = createMangaPrefillFromBookmarklet(bookmarkletParams)
const fromBookmarklet = computed(() => Boolean(route.query.title || route.query.url))

async function checkAndSave(manga) {
  const normalizedName = normalizeTitle(manga.name)
  duplicate.value = mangaStore.mangas.find((item) => item.normalizedName === normalizedName) ?? null

  if (!duplicate.value) {
    checkingDuplicate.value = true
    try {
      const matches = await mangaStore.findDuplicates(authStore.user.uid, manga.name)
      duplicate.value = matches[0] ?? null
    } catch (error) {
      $q.notify({
        type: 'warning',
        message: getFirebaseErrorMessage(
          error,
          'No hemos podido comprobar duplicados; revisa el nombre antes de guardar.',
        ),
      })
    } finally {
      checkingDuplicate.value = false
    }
  }

  if (duplicate.value) {
    pendingManga.value = manga
    duplicateDialog.value = true
    return
  }

  await saveManga(manga)
}

async function saveManga(manga) {
  saving.value = true
  try {
    const id = await mangaStore.createManga(authStore.user.uid, manga)
    $q.notify({ type: 'positive', message: 'Obra añadida a tu biblioteca.' })
    await router.replace(id ? `/manga/${id}` : '/library')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No se ha podido guardar la obra.'),
    })
  } finally {
    saving.value = false
  }
}

function savePending() {
  duplicateDialog.value = false
  if (pendingManga.value) void saveManga(pendingManga.value)
}

function viewDuplicate() {
  duplicateDialog.value = false
  if (duplicate.value) router.push(`/manga/${duplicate.value.id}`)
}
</script>
