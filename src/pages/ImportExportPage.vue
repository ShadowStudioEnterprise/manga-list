<template>
  <q-page class="page-shell">
    <header class="page-heading">
      <q-btn flat round dense icon="arrow_back" to="/settings" aria-label="Volver a ajustes" />
      <p class="eyebrow text-primary q-mt-lg q-mb-xs">Tus datos son tuyos</p>
      <h1 class="page-title q-my-none">Importar / Exportar</h1>
      <p class="page-subtitle q-mb-none">
        Trae una lista existente o guarda una copia de tus obras comprobada con el servidor.
      </p>
    </header>

    <div class="row q-col-gutter-lg q-mt-md">
      <section class="col-12 col-lg-7" aria-labelledby="import-heading">
        <q-card flat bordered class="tool-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-avatar icon="upload_file" color="primary" text-color="white" />
              <div>
                <h2 id="import-heading" class="text-h6 text-weight-bold q-my-none">
                  Importar biblioteca
                </h2>
                <p class="text-caption text-grey-7 q-mb-none">JSON, CSV o TXT · máximo 5 MB</p>
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <template v-if="!preview">
              <q-file
                v-model="file"
                outlined
                clearable
                accept=".json,.csv,.txt,application/json,text/csv,text/plain"
                label="Seleccionar archivo"
                :loading="readingFile"
                :disable="mangaStore.loading || exporting || multipartBusy"
                @update:model-value="readFile"
              >
                <template #prepend><q-icon name="attach_file" /></template>
              </q-file>

              <q-banner rounded class="bg-blue-1 text-primary q-mt-md">
                <template #avatar><q-icon name="shield" /></template>
                Nada se guarda todavía. Primero verás una previsualización con nuevos, duplicados y
                errores.
              </q-banner>

              <q-expansion-item icon="help_outline" label="Formatos admitidos" class="q-mt-sm">
                <div class="text-body2 text-grey-8 q-pa-md format-examples">
                  <p><strong>TXT:</strong> Nombre | Capítulo | https://ejemplo.com</p>
                  <p><strong>CSV:</strong> columnas name, url, chapter, type y status.</p>
                  <p class="q-mb-none">
                    <strong>JSON:</strong> una lista de objetos con name y chapter como mínimo.
                  </p>
                </div>
              </q-expansion-item>
            </template>

            <ImportPreview
              v-else
              :preview="preview"
              :importing="importing || multipartBusy"
              @reset="resetImport"
              @import="importSelected"
            />
            <p class="text-caption text-grey-7 q-mb-none">
              Para reanudar tras una recarga, vuelve a elegir el mismo archivo y formato con la
              misma cuenta. Se reconocerán las filas ya guardadas por esta versión. El archivo no se
              guarda en este navegador y el proceso no continúa al cerrar la app.
            </p>
          </q-card-section>
        </q-card>
      </section>

      <section class="col-12 col-lg-5" aria-labelledby="export-heading">
        <q-card flat bordered class="tool-card sticky-tool-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-avatar icon="download" color="secondary" text-color="white" />
              <div>
                <h2 id="export-heading" class="text-h6 text-weight-bold q-my-none">
                  Exportar biblioteca
                </h2>
                <p class="text-caption text-grey-7 q-mb-none">
                  {{ mangaStore.mangas.length }} obras disponibles
                </p>
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <p class="text-grey-7 q-mt-none">
              JSON conserva toda la información. CSV ofrece una copia cómoda para hojas de cálculo.
              Al descargar se consulta el servidor. Si hay cambios pendientes o no se puede
              verificar la copia, la descarga se detiene. No incluye la cuenta ni sus ajustes.
            </p>
            <p role="status" class="text-caption sync-status">{{ mangaStore.syncStatusMessage }}</p>
            <div class="column q-gutter-sm">
              <q-btn
                unelevated
                color="primary"
                no-caps
                icon="data_object"
                label="Descargar JSON"
                :loading="exporting"
                :disable="
                  mangaStore.mangas.length === 0 ||
                  importing ||
                  multipartBusy ||
                  mangaStore.loading ||
                  !!mangaStore.syncError ||
                  hasUnconfirmedWrites()
                "
                @click="exportLibrary('json')"
              />
              <q-btn
                outline
                color="primary"
                no-caps
                icon="table_view"
                label="Descargar CSV"
                :loading="exporting"
                :disable="
                  mangaStore.mangas.length === 0 ||
                  importing ||
                  multipartBusy ||
                  mangaStore.loading ||
                  !!mangaStore.syncError ||
                  hasUnconfirmedWrites()
                "
                @click="exportLibrary('csv')"
              />
            </div>
          </q-card-section>
        </q-card>
      </section>
    </div>
    <MultipartBackupPanel
      :busy="importing || exporting || readingFile"
      @busy="multipartBusy = $event"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import ImportPreview from '@/components/import/ImportPreview.vue'
import MultipartBackupPanel from '@/components/import/MultipartBackupPanel.vue'
import { isMultipartBackup } from '@/services/multipart-backup'
import {
  createRecoverableImportPreview,
  detectImportFormat,
  prepareImportSelection,
} from '@/services/import-service'
import { downloadLibraryExport } from '@/services/export-service'
import { fetchLibraryForExport } from '@/services/manga-service'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'
import { createAppError, getFirebaseErrorMessage } from '@/utils/firebase-errors'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const $q = useQuasar()
const authStore = useAuthStore()
const mangaStore = useMangaStore()
const file = ref(null)
const preview = ref(null)
const readingFile = ref(false)
const importing = ref(false)
const exporting = ref(false)
const multipartBusy = ref(false)
let fileVersion = 0

async function readFile(selectedFile) {
  const version = ++fileVersion
  if (!selectedFile) {
    preview.value = null
    readingFile.value = false
    return
  }
  const uid = authStore.user?.uid
  if (!uid || importing.value || exporting.value || multipartBusy.value) return
  if (mangaStore.loading || mangaStore.syncError) {
    $q.notify({ type: 'info', message: 'Espera a que termine de sincronizarse la biblioteca.' })
    file.value = null
    return
  }
  if (selectedFile.size > MAX_FILE_SIZE) {
    $q.notify({ type: 'negative', message: 'El archivo supera el límite de 5 MB.' })
    file.value = null
    return
  }

  readingFile.value = true
  try {
    const content = await selectedFile.text()
    const format = detectImportFormat(selectedFile.name || selectedFile.type, content)
    if (format === 'json' && isMultipartBackup(content)) {
      throw createAppError(
        'app/backup-invalid',
        'Para esta copia usa «Recuperar copia dividida» y selecciona el manifiesto y todas las partes.',
      )
    }
    const nextPreview = await createRecoverableImportPreview(content, {
      uid,
      format,
      fileName: selectedFile.name,
      mimeType: selectedFile.type,
      existingMangas: mangaStore.mangas,
    })
    if (version !== fileVersion || authStore.user?.uid !== uid) return
    preview.value = nextPreview
  } catch (error) {
    if (version !== fileVersion || authStore.user?.uid !== uid) return
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No se ha podido leer el archivo.'),
    })
    file.value = null
  } finally {
    if (version === fileVersion) readingFile.value = false
  }
}

function resetImport() {
  if (importing.value || multipartBusy.value) return
  fileVersion++
  readingFile.value = false
  file.value = null
  preview.value = null
}

async function importSelected() {
  if (
    importing.value ||
    multipartBusy.value ||
    exporting.value ||
    !preview.value ||
    mangaStore.syncError ||
    mangaStore.loading
  )
    return
  const uid = authStore.user?.uid
  if (!uid) return
  if (
    preview.value.ownerUid !== uid ||
    preview.value.items.some((item) => item.selected && !item.importDocumentId)
  ) {
    $q.notify({
      type: 'negative',
      message: 'Vuelve a seleccionar el archivo con tu cuenta actual antes de importar.',
    })
    return
  }
  const selectedIds = preview.value.items.filter((item) => item.selected).map((item) => item.id)
  const selection = prepareImportSelection(preview.value, { selectedIds })
  importing.value = true
  let imported = 0
  let failed = 0

  try {
    for (let index = 0; index < selection.selectedItems.length; index += 8) {
      if (authStore.user?.uid !== uid) {
        failed += selection.selectedItems.length - index
        break
      }
      const chunk = selection.selectedItems.slice(index, index + 8)
      const results = await Promise.allSettled(
        chunk.map((item) =>
          mangaStore.createManga(uid, item.manga, { importDocumentId: item.importDocumentId }),
        ),
      )
      results.forEach((result, resultIndex) => {
        if (result.status === 'fulfilled') {
          imported += 1
          chunk[resultIndex].selected = false
          chunk[resultIndex].imported = true
        } else {
          failed += 1
        }
      })
      const stopped = results.some(
        (result) =>
          result.status === 'rejected' &&
          [
            'resource-exhausted',
            'firestore/resource-exhausted',
            'auth/quota-exceeded',
            'app/quota-paused',
            'app/request-budget',
          ].includes(result.reason?.code),
      )
      if (stopped) {
        failed += selection.selectedItems.length - index - chunk.length
        break
      }
    }

    $q.notify({
      type: failed ? 'warning' : 'positive',
      timeout: 6000,
      message: failed
        ? `Se importaron ${imported} obras; ${failed} no pudieron guardarse.`
        : `${imported} obras importadas correctamente.`,
    })
  } finally {
    importing.value = false
  }
  if (!failed) resetImport()
}

function hasUnconfirmedWrites() {
  return Boolean(mangaStore.hasPendingWrites || mangaStore.pendingOperations > 0)
}

async function exportLibrary(format) {
  if (exporting.value || importing.value || multipartBusy.value) return
  const uid = authStore.user?.uid
  if (!uid) return
  if (mangaStore.syncError || mangaStore.loading || hasUnconfirmedWrites()) {
    $q.notify({
      type: 'warning',
      message: 'Espera a confirmar el guardado y resolver los errores antes de exportar.',
    })
    return
  }
  exporting.value = true
  const libraryRevision = mangaStore.libraryRevision
  try {
    const snapshot = await fetchLibraryForExport(uid)
    if (authStore.user?.uid !== uid || hasUnconfirmedWrites() || mangaStore.syncError) return
    if (mangaStore.libraryRevision !== libraryRevision) {
      $q.notify({
        type: 'warning',
        message:
          'La biblioteca cambió durante la copia. Espera a que se sincronice y vuelve a exportar.',
      })
      return
    }
    downloadLibraryExport(snapshot.mangas, format, { verification: snapshot.verification })
    $q.notify({
      type: 'positive',
      message: `Copia ${format.toUpperCase()} comprobada con el servidor y descargada.`,
    })
  } catch (error) {
    if (authStore.user?.uid !== uid) return
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(
        error,
        'No se ha podido confirmar la descarga con el servidor.',
      ),
    })
  } finally {
    exporting.value = false
  }
}
</script>
