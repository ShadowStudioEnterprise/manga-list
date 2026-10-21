<template>
  <section aria-labelledby="multipart-heading" class="q-mt-xl">
    <h2 id="multipart-heading" class="text-h5">Copias divididas y recuperación</h2>
    <p class="text-grey-7">
      Para bibliotecas grandes, guarda el manifiesto y todas sus partes. Se comprueban juntas antes
      de recuperar las obras.
    </p>
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-5">
        <q-card flat bordered class="tool-card">
          <q-card-section>
            <h3 class="text-h6 q-mt-none">Guardar copia dividida</h3>
            <q-btn
              color="primary"
              no-caps
              label="Preparar copia dividida"
              :loading="work === 'exporting'"
              :disable="busy || active || !synchronized || !mangaStore.mangas.length"
              @click="prepareExport"
            />
            <div v-if="exportPlan" class="q-mt-md">
              <p>
                {{ exportPlan.manifest.totalRecords }} obras ·
                {{ exportPlan.manifest.parts.length }} partes. Guarda cada archivo, incluido el
                manifiesto.
              </p>
              <q-btn
                outline
                color="primary"
                no-caps
                label="Descargar manifiesto"
                :disable="busy || active"
                @click="downloadManifest"
              />
              <ul class="q-pl-md">
                <li v-for="part in exportPlan.manifest.parts" :key="part.index" class="q-mt-sm">
                  <q-btn
                    flat
                    color="primary"
                    no-caps
                    :label="`Descargar parte ${part.index}`"
                    :disable="busy || active"
                    @click="downloadPart(part.index - 1)"
                  />
                  <span v-if="requestedDownloads.includes(part.index)" class="text-caption"
                    >Descarga solicitada</span
                  >
                </li>
              </ul>
              <p class="text-caption">
                Las descargas se guardan en tu dispositivo. No se conserva la copia en este
                navegador al salir.
              </p>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-lg-7">
        <q-card flat bordered class="tool-card">
          <q-card-section>
            <h3 class="text-h6 q-mt-none">Recuperar copia dividida</h3>
            <p>
              Usa una biblioteca vacía o reanuda la misma copia parcial. Para combinar listas, usa
              la importación normal. Las obras recuperadas tendrán fechas nuevas.
            </p>
            <q-file
              v-model="files"
              multiple
              clearable
              outlined
              accept=".json,application/json"
              label="Manifiesto y todas las partes"
              :disable="busy || active"
              @update:model-value="selectionChanged"
            />
            <p class="text-caption">
              Máximo 5 MiB por archivo. Conserva los nombres y el contenido originales.
            </p>
            <q-btn
              outline
              color="primary"
              no-caps
              label="Comprobar copia"
              :loading="work === 'checking'"
              :disable="busy || active || !files?.length || !synchronized"
              @click="checkBackup"
            />
            <div v-if="restorePlan" class="q-mt-md">
              <p role="status" aria-live="polite">
                {{ completed }} de {{ restorePlan.manifest.totalRecords }} obras recuperadas.
              </p>
              <q-linear-progress
                :value="completed / restorePlan.manifest.totalRecords"
                aria-label="Progreso de recuperación"
                class="q-mb-md"
              />
              <p v-if="phase === 'complete'" class="text-positive" role="status">
                Recuperación completa.
              </p>
              <template v-else>
                <q-btn
                  v-if="phase === 'restoring'"
                  outline
                  no-caps
                  :label="pauseRequested ? 'Pausando…' : 'Pausar recuperación'"
                  :disable="pauseRequested"
                  @click="pauseRequested = true"
                />
                <q-btn
                  v-else
                  color="primary"
                  no-caps
                  :label="
                    phase === 'paused' || completed ? 'Continuar recuperación' : 'Recuperar obras'
                  "
                  :disable="busy || active || !synchronized || remainingSeconds > 0"
                  @click="restore"
                />
                <p v-if="remainingSeconds" role="status">
                  Espera {{ remainingSeconds }} segundos antes de continuar.
                </p>
                <p class="text-caption">
                  Puedes pausar o cerrar la página. Para reanudar, selecciona los mismos archivos
                  con la misma cuenta. Las obras en curso pueden terminar antes de la pausa.
                </p>
              </template>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-banner v-if="message" rounded class="bg-blue-1 text-primary q-mt-md" role="status">{{
      message
    }}</q-banner>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'
import { fetchLibraryForExport } from '@/services/manga-service'
import { downloadExport } from '@/services/export-service'
import {
  prepareMultipartExport,
  verifyMultipartBackup,
  restoreMultipartBackup,
  assertRestoreLibrary,
} from '@/services/multipart-backup'
import { sparkBudget } from '@/utils/spark-budget'
import { createAppError, getFirebaseErrorMessage } from '@/utils/firebase-errors'

const props = defineProps({ busy: Boolean })
const emit = defineEmits(['busy'])
const authStore = useAuthStore()
const mangaStore = useMangaStore()
const phase = ref('idle'),
  work = ref(''),
  files = shallowRef(null),
  exportPlan = shallowRef(null),
  restorePlan = shallowRef(null)
const completed = ref(0),
  message = ref(''),
  pauseRequested = ref(false),
  requestedDownloads = ref([])
const resumeAt = ref(0),
  time = ref(Date.now())
let version = 0,
  disposed = false,
  exportOwner = null
const active = computed(() => Boolean(work.value))
const synchronized = computed(
  () =>
    !mangaStore.loading &&
    !mangaStore.syncError &&
    mangaStore.snapshotFromCache === false &&
    !mangaStore.hasPendingWrites &&
    !(mangaStore.pendingOperations > 0),
)
const remainingSeconds = computed(() =>
  Math.max(0, Math.ceil((resumeAt.value - time.value) / 1000)),
)
let timer
onMounted(() => {
  timer = setInterval(() => {
    time.value = Date.now()
  }, 1000)
})
watch(active, (value) => emit('busy', value), { flush: 'sync' })
function clear() {
  version++
  files.value = null
  exportPlan.value = null
  restorePlan.value = null
  exportOwner = null
  phase.value = 'idle'
  work.value = ''
  message.value = ''
  completed.value = 0
  resumeAt.value = 0
  requestedDownloads.value = []
  pauseRequested.value = true
}
watch(() => authStore.user?.uid, clear, { flush: 'sync' })
onBeforeUnmount(() => {
  disposed = true
  clear()
  clearInterval(timer)
})
function session(uid, current) {
  if (disposed || current !== version || authStore.user?.uid !== uid)
    throw createAppError('cancelled')
}
function ready() {
  if (!synchronized.value)
    throw createAppError(
      'app/backup-wait',
      'Espera a que la biblioteca esté confirmada y sin cambios pendientes antes de continuar.',
    )
}
function selectionChanged() {
  version++
  restorePlan.value = null
  completed.value = 0
  resumeAt.value = 0
  message.value = ''
  phase.value = 'idle'
}
async function prepareExport() {
  if (active.value || props.busy || !authStore.user?.uid) return
  const uid = authStore.user.uid,
    current = ++version,
    revision = mangaStore.libraryRevision
  work.value = 'exporting'
  message.value = ''
  exportPlan.value = null
  requestedDownloads.value = []
  try {
    ready()
    const snapshot = await fetchLibraryForExport(uid)
    const assertCurrent = () => {
      session(uid, current)
      ready()
      if (revision !== mangaStore.libraryRevision)
        throw createAppError(
          'app/backup-changed',
          'La biblioteca cambió durante la copia. Vuelve a prepararla cuando termine la sincronización.',
        )
    }
    assertCurrent()
    const plan = await prepareMultipartExport(snapshot.mangas, snapshot.verification, assertCurrent)
    assertCurrent()
    exportOwner = uid
    exportPlan.value = plan
    message.value = 'Copia preparada. Descarga el manifiesto y todas las partes.'
  } catch (error) {
    if (current === version && !disposed)
      message.value = getFirebaseErrorMessage(error, 'No se pudo preparar la copia dividida.')
  } finally {
    if (current === version && !disposed) work.value = ''
  }
}
function downloadManifest() {
  if (props.busy || active.value || !exportPlan.value || exportOwner !== authStore.user?.uid) return
  downloadExport({
    content: exportPlan.value.manifestContent,
    fileName: exportPlan.value.manifestFileName,
    mimeType: 'application/json;charset=utf-8',
  })
}
function downloadPart(index) {
  if (props.busy || active.value || !exportPlan.value || exportOwner !== authStore.user?.uid) return
  downloadExport({
    content: exportPlan.value.partContent(index),
    fileName: exportPlan.value.manifest.parts[index].fileName,
    mimeType: 'application/json;charset=utf-8',
  })
  requestedDownloads.value = [...new Set([...requestedDownloads.value, index + 1])]
}
async function checkBackup() {
  if (active.value || props.busy || !authStore.user?.uid) return
  const uid = authStore.user.uid,
    current = ++version
  work.value = 'checking'
  phase.value = 'idle'
  restorePlan.value = null
  message.value = ''
  resumeAt.value = 0
  try {
    ready()
    const plan = await verifyMultipartBackup(files.value, {
      uid,
      assertCurrent: () => session(uid, current),
      existingMangas: mangaStore.mangas,
    })
    session(uid, current)
    ready()
    // The library may have changed while the files were being verified.
    assertRestoreLibrary(plan, mangaStore.mangas)
    restorePlan.value = plan
    completed.value = mangaStore.mangas.length
    phase.value = 'ready'
    message.value = 'Todos los archivos están comprobados. Puedes recuperar las obras.'
  } catch (error) {
    if (current === version && !disposed) {
      phase.value = 'idle'
      message.value = getFirebaseErrorMessage(error, 'No se pudo comprobar la copia.')
    }
  } finally {
    if (current === version && !disposed) work.value = ''
  }
}
async function restore() {
  if (active.value || props.busy || !restorePlan.value || remainingSeconds.value) return
  const plan = restorePlan.value,
    uid = plan.uid,
    current = version
  phase.value = 'restoring'
  work.value = 'restoring'
  pauseRequested.value = false
  message.value = ''
  try {
    session(uid, current)
    ready()
    const result = await restoreMultipartBackup(plan, {
      assertCurrent: () => session(uid, current),
      assertReady: ready,
      getMangas: () => mangaStore.mangas,
      write: (owner, manga, options) => mangaStore.createManga(owner, manga, options),
      budget: sparkBudget,
      shouldPause: () => pauseRequested.value,
      onProgress: (value) => {
        session(uid, current)
        completed.value = value
      },
    })
    session(uid, current)
    if (result.complete) {
      const deadline = Date.now() + 15000
      // Acknowledged transactions must also be visible in the confirmed library.
      // This polls local state only, never issues extra Firestore reads.
      let attempts = 0
      while (
        !synchronized.value ||
        mangaStore.mangas.length !== plan.manifest.totalRecords ||
        mangaStore.mangas.some((item) => !plan.expectedIds.has(item.id))
      ) {
        session(uid, current)
        if (++attempts > 150 || Date.now() >= deadline)
          throw createAppError(
            'app/backup-wait',
            'Las operaciones terminaron, pero falta confirmar la biblioteca. Espera a sincronizar y continúa con los mismos archivos.',
          )
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
    resumeAt.value = Date.now() + result.retryAfterMs
    phase.value = result.complete ? 'complete' : 'paused'
    message.value = result.complete
      ? 'Se han recuperado todas las obras de esta copia.'
      : result.error
        ? getFirebaseErrorMessage(
            result.error,
            'La recuperación se pausó. Espera y continúa con los mismos archivos.',
          )
        : 'Recuperación pausada. Puedes continuar con los mismos archivos.'
  } catch (error) {
    if (current !== version || disposed) return
    phase.value = 'paused'
    message.value = getFirebaseErrorMessage(
      error,
      'La recuperación se pausó. Comprueba la conexión antes de continuar.',
    )
    if (error.code === 'app/backup-invalid') {
      restorePlan.value = null
      phase.value = 'idle'
    }
  } finally {
    if (current === version && !disposed) work.value = ''
  }
}
</script>
