import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const SETTINGS_STORAGE_KEY = 'mangalist.settings.v1'
export const SORT_OPTIONS = Object.freeze([
  'name-asc',
  'name-desc',
  'updated-desc',
  'created-desc',
  'chapter-desc',
])

const SORT_ALIASES = Object.freeze({
  name: 'name-asc',
  nameAsc: 'name-asc',
  nameDesc: 'name-desc',
  updated: 'updated-desc',
  updatedAt: 'updated-desc',
  created: 'created-desc',
  createdAt: 'created-desc',
  chapter: 'chapter-desc',
})

const DEFAULT_SETTINGS = Object.freeze({
  sortBy: 'updated-desc',
})

function normalizeSortBy(value) {
  const candidate = SORT_ALIASES[value] ?? value
  return SORT_OPTIONS.includes(candidate) ? candidate : DEFAULT_SETTINGS.sortBy
}

function readStoredSettings() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS }
  }

  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)

    if (!rawSettings) {
      return { ...DEFAULT_SETTINGS }
    }

    const settings = JSON.parse(rawSettings)

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return { ...DEFAULT_SETTINGS }
    }

    return {
      sortBy: normalizeSortBy(settings.sortBy),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function writeStoredSettings(settings) {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const sortBy = ref(readStoredSettings().sortBy)

  watch(
    sortBy,
    (value) => {
      const normalizedValue = normalizeSortBy(value)

      if (normalizedValue !== value) {
        sortBy.value = normalizedValue
        return
      }

      writeStoredSettings({ sortBy: normalizedValue })
    },
    { flush: 'sync' },
  )

  function hydrate() {
    sortBy.value = readStoredSettings().sortBy
  }

  function setSortBy(value) {
    sortBy.value = normalizeSortBy(value)
    return sortBy.value
  }

  function persist() {
    return writeStoredSettings({ sortBy: sortBy.value })
  }

  function resetSettings() {
    sortBy.value = DEFAULT_SETTINGS.sortBy

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
      } catch {
        // Keeping the in-memory defaults is sufficient when storage is unavailable.
      }
    }
  }

  return {
    sortBy,
    hydrate,
    setSortBy,
    persist,
    resetSettings,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
}
