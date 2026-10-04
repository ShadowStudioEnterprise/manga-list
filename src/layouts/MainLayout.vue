<template>
  <q-layout view="hHh Lpr lFf" class="main-layout">
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn
          flat
          round
          dense
          icon="menu"
          aria-label="Abrir navegación"
          class="lt-md"
          @click="drawerOpen = !drawerOpen"
        />

        <router-link
          to="/library"
          class="brand-link brand-link--header"
          aria-label="Ir a la biblioteca de MangaList"
        >
          <q-icon name="auto_stories" size="28px" />
          <span>MangaList</span>
        </router-link>

        <q-space />

        <q-input
          v-if="route.name === 'library'"
          v-model="mangaStore.searchQuery"
          dense
          outlined
          clearable
          debounce="120"
          placeholder="Buscar por nombre…"
          aria-label="Buscar en la biblioteca"
          class="header-search gt-xs"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          label="Añadir"
          to="/add"
          class="q-ml-sm"
        />

        <q-btn flat round icon="account_circle" class="q-ml-xs" aria-label="Menú de usuario">
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 220px">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-weight-medium">Tu cuenta</q-item-label>
                  <q-item-label caption lines="1">{{ authStore.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item v-close-popup clickable to="/settings">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>Ajustes</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="handleLogout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Cerrar sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" show-if-above :width="264" bordered class="app-drawer">
      <div class="drawer-content column no-wrap">
        <q-list padding class="col">
          <q-item-label header class="drawer-label">Mi biblioteca</q-item-label>

          <q-item clickable :active="isBaseLibrary" active-class="nav-active" @click="showAll">
            <q-item-section avatar><q-icon name="library_books" /></q-item-section>
            <q-item-section>Biblioteca</q-item-section>
            <q-item-section side>{{ mangaStore.counters?.total ?? 0 }}</q-item-section>
          </q-item>

          <q-item
            v-for="item in statusItems"
            :key="item.value"
            clickable
            :active="activeStatus === item.value"
            active-class="nav-active"
            @click="showStatus(item.value)"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section side>{{ mangaStore.counters?.[item.counter] ?? 0 }}</q-item-section>
          </q-item>

          <q-item
            clickable
            :active="Boolean(mangaStore.filters?.favoritesOnly)"
            active-class="nav-active"
            @click="showFavorites"
          >
            <q-item-section avatar><q-icon name="favorite" /></q-item-section>
            <q-item-section>Favoritos</q-item-section>
            <q-item-section side>{{ mangaStore.counters?.favorites ?? 0 }}</q-item-section>
          </q-item>

          <q-separator class="q-my-md" />
          <q-item-label header class="drawer-label">Herramientas</q-item-label>

          <q-item clickable to="/settings/import-export" active-class="nav-active">
            <q-item-section avatar><q-icon name="swap_vert" /></q-item-section>
            <q-item-section>Importar / Exportar</q-item-section>
          </q-item>
          <q-item clickable to="/settings" active-class="nav-active">
            <q-item-section avatar><q-icon name="settings" /></q-item-section>
            <q-item-section>Ajustes</q-item-section>
          </q-item>
        </q-list>

        <div class="drawer-footer q-pa-md">
          <q-btn
            flat
            no-caps
            icon="logout"
            label="Cerrar sesión"
            class="full-width"
            align="left"
            @click="handleLogout"
          />
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'
import { useMangaStore } from '@/stores/manga-store'
import { getFirebaseErrorMessage } from '@/utils/firebase-errors'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mangaStore = useMangaStore()
const drawerOpen = ref(false)

const statusItems = [
  { label: 'Siguiendo', value: 'following', icon: 'menu_book', counter: 'following' },
  { label: 'Pendientes', value: 'pending', icon: 'bookmark_border', counter: 'pending' },
  { label: 'Finalizados', value: 'completed', icon: 'task_alt', counter: 'completed' },
]

const activeStatus = computed(() => mangaStore.filters?.readingStatus || '')
const isBaseLibrary = computed(
  () =>
    route.name === 'library' &&
    !mangaStore.filters?.readingStatus &&
    !mangaStore.filters?.favoritesOnly,
)

watch(
  () => authStore.user?.uid,
  (uid) => {
    if (uid) {
      mangaStore.subscribe(uid)
    } else {
      mangaStore.unsubscribe()
      if (authStore.initialized && route.meta.requiresAuth) {
        void router.replace('/login')
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => mangaStore.unsubscribe())

function goToLibrary() {
  drawerOpen.value = false
  if (route.name !== 'library') router.push('/library')
}

function showAll() {
  mangaStore.filters.readingStatus = ''
  mangaStore.filters.favoritesOnly = false
  goToLibrary()
}

function showStatus(status) {
  mangaStore.filters.readingStatus = status
  mangaStore.filters.favoritesOnly = false
  goToLibrary()
}

function showFavorites() {
  mangaStore.filters.readingStatus = ''
  mangaStore.filters.favoritesOnly = true
  goToLibrary()
}

async function handleLogout() {
  try {
    await authStore.logout()
    await router.replace('/login')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getFirebaseErrorMessage(error, 'No se ha podido cerrar la sesión.'),
    })
  }
}
</script>
