<template>
  <q-page class="page-shell">
    <header class="page-heading">
      <q-btn flat round dense icon="arrow_back" to="/settings" aria-label="Volver a ajustes" />
      <p class="eyebrow text-primary q-mt-lg q-mb-xs">Tus datos son tuyos</p>
      <h1 class="page-title q-my-none">Importar / Exportar</h1>
      <p class="page-subtitle q-mb-none">
        Trae una lista existente o guarda una copia completa de tu biblioteca.
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
                :disable="mangaStore.loading"
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
              :importing="importing"
              @reset="resetImport"
              @import="importSelected"
            />
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
            </p>
            <div class="column q-gutter-sm">
              <q-btn
                unelevated
                color="primary"
                no-caps
                icon="data_object"
                label="Descargar JSON"
                :disable="mangaStore.mangas.length === 0"
                @click="exportLibrary('json')"
              />
              <q-btn
                outline
                color="primary"
                no-caps
                icon="table_view"
                label="Descargar CSV"
                :disable="mangaStore.mangas.length === 0"
                @click="exportLibrary('csv')"
              />
            </div>
          </q-card-section>
        </q-card>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import ImportPreview from '@/components/import/ImportPreview.vue'
import {
  createImportPreview,
  detectImportFormat,
  prepareImportSelection,
} from '@/services/import-service'
import { downloadLibraryExport } from '@/services/export-service'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const $q = useQuasar()
const authStore = useAuthStore()
const mangaStore = useMangaStore()
const file = ref(null)
const preview = ref(null)
const readingFile = ref(false)
const importing = ref(false)

async function readFile(selectedFile) {
  if (!selectedFile) return
  if (mangaStore.loading) {
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
    preview.value = createImportPreview(content, {
      format,
      fileName: selectedFile.name,
      mimeType: selectedFile.type,
      existingMangas: mangaStore.mangas,
    })
  } catch {
    $q.notify({ type: 'negative', message: 'No se ha podido leer el archivo.' })
    file.value = null
  } finally {
    readingFile.value = false
  }
}

function resetImport() {
  if (importing.value) return
  file.value = null
  preview.value = null
}

async function importSelected() {
  if (importing.value || !preview.value) return
  const uid = authStore.user?.uid
  if (!uid) return
  const selectedIds = preview.value.items.filter((item) => item.selected).map((item) => item.id)
  const selection = prepareImportSelection(preview.value, { selectedIds })
  importing.value = true
  let imported = 0
  let failed = 0

  try {
    for (let index = 0; index < selection.selectedItems.length; index += 8) {
      const chunk = selection.selectedItems.slice(index, index + 8)
      const results = await Promise.allSettled(
        chunk.map((item) => mangaStore.createManga(uid, item.manga)),
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

function exportLibrary(format) {
  try {
    downloadLibraryExport(mangaStore.mangas, format)
    $q.notify({ type: 'positive', message: `Copia ${format.toUpperCase()} descargada.` })
  } catch {
    $q.notify({ type: 'negative', message: 'No se ha podido preparar la descarga.' })
  }
}
</script>
