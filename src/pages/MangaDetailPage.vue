<template>
  <q-page class="page-shell narrow-page">
    <header class="page-heading">
      <q-btn flat round dense icon="arrow_back" to="/library" aria-label="Volver a la biblioteca" />
      <p class="eyebrow text-primary q-mt-lg q-mb-xs">Editar obra</p>
      <h1 class="page-title q-my-none">{{ manga?.name || 'Cargando…' }}</h1>
      <p class="page-subtitle q-mb-none">Actualiza el progreso, las fuentes o cualquier detalle.</p>
    </header>

    <div v-if="mangaStore.loading" class="q-mt-xl">
      <q-skeleton type="rect" height="380px" class="rounded-borders" />
    </div>

    <q-banner v-else-if="mangaStore.error && !manga" rounded class="bg-red-1 text-negative q-mt-xl">
      <template #avatar><q-icon name="cloud_off" /></template>
      {{ mangaStore.error }}
      <template #action>
        <q-btn flat no-caps color="negative" label="Reintentar" @click="retrySubscription" />
      </template>
    </q-banner>

    <q-banner v-else-if="!manga" rounded class="bg-orange-1 text-warning q-mt-xl">
      <template #avatar><q-icon name="search_off" /></template>
      Esta obra no existe o ya ha sido eliminada.
      <template #action
        ><q-btn flat no-caps color="primary" label="Volver" to="/library"
      /></template>
    </q-banner>

    <div v-else>
      <q-banner v-if="editConflict" rounded class="bg-orange-1 text-warning q-mt-lg">
        La obra cambió en otro dispositivo. Conservamos tu formulario, pero no hemos guardado los
        cambios.
        <template #action>
          <q-btn
            flat
            no-caps
            label="Cargar versión actual"
            :disable="saving"
            @click="reloadCurrentVersion"
          />
        </template>
      </q-banner>
      <MangaForm
        :key="formVersion"
        :initial-value="manga"
        :loading="saving"
        submit-label="Guardar cambios"
        class="q-mt-lg"
        @submit="save"
        @cancel="router.push('/library')"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import MangaForm from '@/components/manga/MangaForm.vue'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'
import { createMangaEdit } from '@/utils/manga-edit'

const props = defineProps({ id: { type: String, required: true } })
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const mangaStore = useMangaStore()
const saving = ref(false)
const formVersion = ref(0)
const editConflict = ref(false)
const manga = computed(() => mangaStore.mangas.find((item) => item.id === props.id))

async function save(value, baseline) {
  if (saving.value) return
  const { patch, expectedValues } = createMangaEdit(value, baseline)
  if (!Object.keys(patch).length) {
    await router.push('/library')
    return
  }
  saving.value = true
  try {
    await mangaStore.updateManga(authStore.user.uid, props.id, patch, { expectedValues })
    $q.notify({ type: 'positive', message: 'Cambios guardados.' })
    await router.push('/library')
  } catch (error) {
    editConflict.value = error?.code === 'app/edit-conflict'
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No se han podido guardar los cambios.'),
    })
  } finally {
    saving.value = false
  }
}

function reloadCurrentVersion() {
  $q.dialog({
    title: 'Cargar versión actual',
    message: 'Se descartarán los cambios de este formulario y se cargarán los datos sincronizados.',
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Cargar versión actual' },
  }).onOk(() => {
    formVersion.value += 1
    editConflict.value = false
  })
}

function retrySubscription() {
  if (authStore.user?.uid) mangaStore.subscribe(authStore.user.uid)
}
</script>
