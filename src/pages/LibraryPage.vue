<template>
  <q-page class="page-shell library-page">
    <header class="page-heading row items-end justify-between q-col-gutter-md">
      <div class="col-12 col-sm">
        <p class="eyebrow text-primary q-mb-xs">Tu espacio de lectura</p>
        <h1 class="page-title q-my-none">Biblioteca</h1>
        <p class="page-subtitle q-mb-none">Todo lo que lees, justo donde lo dejaste.</p>
      </div>
      <div class="col-auto gt-xs">
        <q-btn unelevated color="primary" no-caps icon="add" label="Añadir obra" to="/add" />
      </div>
    </header>

    <section class="stats-grid q-mt-lg" aria-label="Resumen de la biblioteca">
      <q-card v-for="stat in stats" :key="stat.label" flat bordered class="stat-card">
        <q-card-section class="row items-center no-wrap">
          <q-avatar :icon="stat.icon" :color="stat.color" text-color="white" />
          <div class="q-ml-md">
            <div class="stat-card__value">{{ stat.value }}</div>
            <div class="stat-card__label">{{ stat.label }}</div>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <MangaFilters class="q-mt-lg" />
    <p v-if="!mangaStore.syncError" role="status" class="text-caption sync-status">
      {{ mangaStore.syncStatusMessage }}
    </p>

    <q-btn
      v-if="!mangaStore.syncError && mangaStore.coordinationStale"
      flat
      no-caps
      color="primary"
      label="Solicitar estado a la otra pestaña"
      @click="mangaStore.requestSharedSnapshot()"
    />

    <q-banner
      v-if="mangaStore.syncError"
      rounded
      role="alert"
      class="bg-red-1 text-negative q-mb-lg"
    >
      <template #avatar><q-icon name="cloud_off" /></template>
      {{ mangaStore.syncError }}
      <template #action>
        <q-btn flat no-caps color="negative" label="Reintentar" @click="retrySubscription" />
      </template>
    </q-banner>

    <div v-if="mangaStore.loading" class="manga-grid" aria-label="Cargando biblioteca">
      <q-card v-for="index in 6" :key="index" flat bordered class="manga-card q-pa-md">
        <q-skeleton type="text" width="70%" height="34px" />
        <q-skeleton type="text" width="45%" />
        <q-skeleton type="QChip" class="q-mt-sm" />
        <q-skeleton type="text" width="50%" height="44px" class="q-mt-md" />
        <q-skeleton type="QBtn" class="full-width q-mt-lg" />
      </q-card>
    </div>

    <MangaEmptyState
      v-else-if="
        displayedMangas.length === 0 &&
        mangaStore.snapshotReceived &&
        !mangaStore.snapshotFromCache &&
        !mangaStore.hasPendingWrites &&
        mangaStore.pendingOperations === 0 &&
        !mangaStore.syncError
      "
      :filtered="hasActiveFilters && mangaStore.mangas.length > 0"
      @reset="resetFilters"
    />

    <div v-else>
      <p
        v-if="pageInfo.total"
        ref="pageSummary"
        tabindex="-1"
        class="text-caption sync-status library-page-summary"
        aria-live="polite"
        aria-atomic="true"
      >
        Mostrando {{ pageInfo.start }}–{{ pageInfo.end }} de {{ pageInfo.total }} obras · Página
        {{ pageInfo.page }} de {{ pageInfo.pageCount }}
      </p>
      <LibraryPagination
        :info="pageInfo"
        label="Páginas de la biblioteca al inicio"
        @change="changePage"
      />
      <section class="manga-grid">
        <MangaCard v-for="manga in pageInfo.items" :key="manga.id" :manga="manga" />
      </section>
      <LibraryPagination
        :info="pageInfo"
        label="Páginas de la biblioteca al final"
        @change="changePage"
      />
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]" class="lt-sm">
      <q-btn fab color="primary" icon="add" to="/add" aria-label="Añadir obra" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import LibraryPagination from '@/components/manga/LibraryPagination.vue'
import { useLibraryPagination } from '@/composables/use-library-pagination'
import MangaCard from '@/components/manga/MangaCard.vue'
import MangaEmptyState from '@/components/manga/MangaEmptyState.vue'
import MangaFilters from '@/components/manga/MangaFilters.vue'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'
import { useSettingsStore } from '@/stores/settings-store'

const authStore = useAuthStore()
const mangaStore = useMangaStore()
const settingsStore = useSettingsStore()
const pageSummary = ref(null)

const stats = computed(() => [
  { label: 'Total', value: mangaStore.counters.total, icon: 'library_books', color: 'primary' },
  {
    label: 'Siguiendo',
    value: mangaStore.counters.following,
    icon: 'menu_book',
    color: 'secondary',
  },
  {
    label: 'Pendientes',
    value: mangaStore.counters.pending,
    icon: 'bookmark_border',
    color: 'warning',
  },
  {
    label: 'Finalizados',
    value: mangaStore.counters.completed,
    icon: 'task_alt',
    color: 'positive',
  },
])

const displayedMangas = computed(() => mangaStore.filteredMangas)
const { page, pageInfo } = useLibraryPagination(displayedMangas, () => [
  mangaStore.subscribedUid,
  mangaStore.searchQuery,
  mangaStore.filters.readingStatus,
  mangaStore.filters.type,
  ...mangaStore.filters.genres,
  mangaStore.filters.favoritesOnly,
  settingsStore.sortBy,
])

async function changePage(value) {
  page.value = value
  await nextTick()
  pageSummary.value?.focus({ preventScroll: true })
  pageSummary.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
}

const hasActiveFilters = computed(
  () =>
    Boolean(mangaStore.searchQuery) ||
    Boolean(mangaStore.filters.readingStatus) ||
    Boolean(mangaStore.filters.type) ||
    mangaStore.filters.genres.length > 0 ||
    mangaStore.filters.favoritesOnly,
)

function resetFilters() {
  mangaStore.searchQuery = ''
  Object.assign(mangaStore.filters, {
    readingStatus: '',
    type: '',
    genres: [],
    favoritesOnly: false,
  })
}

function retrySubscription() {
  try {
    if (authStore.user?.uid) mangaStore.subscribe(authStore.user.uid)
  } catch {
    // subscribe records the failure in the banner.
  }
}
</script>
