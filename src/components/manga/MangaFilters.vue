<template>
  <q-card flat bordered class="filters-card q-mb-lg">
    <q-card-section>
      <q-input
        v-model="mangaStore.searchQuery"
        outlined
        dense
        clearable
        debounce="120"
        placeholder="Buscar por nombre…"
        aria-label="Buscar por nombre"
        class="lt-sm q-mb-md"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <div class="row q-col-gutter-sm items-center">
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="mangaStore.filters.readingStatus"
            outlined
            dense
            emit-value
            map-options
            :options="readingOptions"
            label="Estado de lectura"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <q-select
            v-model="mangaStore.filters.type"
            outlined
            dense
            emit-value
            map-options
            :options="typeOptions"
            label="Tipo"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="mangaStore.filters.genres"
            outlined
            dense
            multiple
            use-chips
            clearable
            :options="MANGA_GENRES"
            label="Géneros"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="settingsStore.sortBy"
            outlined
            dense
            emit-value
            map-options
            :options="LIBRARY_SORT_OPTIONS"
            label="Ordenar"
          />
        </div>
        <div class="col-12 col-md-1 row justify-center">
          <q-btn
            flat
            round
            icon="filter_alt_off"
            aria-label="Limpiar filtros"
            @click="resetFilters"
          >
            <q-tooltip>Limpiar filtros</q-tooltip>
          </q-btn>
        </div>
      </div>

      <q-toggle
        v-model="mangaStore.filters.favoritesOnly"
        class="q-mt-sm"
        color="secondary"
        icon="favorite"
        label="Solo favoritos"
      />
    </q-card-section>
  </q-card>
</template>

<script setup>
import {
  LIBRARY_SORT_OPTIONS,
  MANGA_GENRES,
  MANGA_TYPES,
  READING_STATUSES,
} from '@/constants/manga-options'
import { useMangaStore } from '@/stores/manga-store'
import { useSettingsStore } from '@/stores/settings-store'

const mangaStore = useMangaStore()
const settingsStore = useSettingsStore()

const readingOptions = [{ value: '', label: 'Todos' }, ...READING_STATUSES]
const typeOptions = [{ value: '', label: 'Todos' }, ...MANGA_TYPES]

function resetFilters() {
  mangaStore.searchQuery = ''
  mangaStore.filters.readingStatus = ''
  mangaStore.filters.type = ''
  mangaStore.filters.genres = []
  mangaStore.filters.favoritesOnly = false
}
</script>
