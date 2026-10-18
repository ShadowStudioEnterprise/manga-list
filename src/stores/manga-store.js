import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  changeMangaChapter,
  createManga as createMangaDocument,
  deleteManga as deleteMangaDocument,
  findMangasByNormalizedName,
  normalizeMangaName,
  subscribeToMangas,
  updateManga as updateMangaDocument,
} from '@/services/manga-service'
import { toAppError } from '@/utils/firebase-errors'
import { useSettingsStore } from '@/stores/settings-store'
import { compareChapters } from '@/utils/chapter-utils'

let stopMangaListener = null
let subscriptionVersion = 0

const DEFAULT_FILTERS = Object.freeze({
  readingStatus: '',
  type: '',
  genres: [],
  favoritesOnly: false,
})

const nameCollator = new Intl.Collator('es', {
  numeric: true,
  sensitivity: 'base',
})

function timestampValue(value) {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value?.toMillis === 'function') {
    return value.toMillis()
  }

  const parsedValue = Date.parse(value)
  return Number.isNaN(parsedValue) ? 0 : parsedValue
}

function sortMangas(mangas, sortBy) {
  const sortedMangas = [...mangas]

  switch (sortBy) {
    case 'name-asc':
      return sortedMangas.sort((left, right) => nameCollator.compare(left.name, right.name))
    case 'name-desc':
      return sortedMangas.sort((left, right) => nameCollator.compare(right.name, left.name))
    case 'created-desc':
      return sortedMangas.sort(
        (left, right) => timestampValue(right.createdAt) - timestampValue(left.createdAt),
      )
    case 'chapter-desc':
      return sortedMangas.sort((left, right) => compareChapters(right.chapter, left.chapter))
    case 'updated-desc':
    default:
      return sortedMangas.sort(
        (left, right) => timestampValue(right.updatedAt) - timestampValue(left.updatedAt),
      )
  }
}

function selectedGenresMatch(mangaGenres, selectedGenres) {
  const selections = Array.isArray(selectedGenres) ? selectedGenres : []

  if (selections.length === 0) {
    return true
  }

  const normalizedGenres = new Set(
    (Array.isArray(mangaGenres) ? mangaGenres : []).map((genre) =>
      String(genre).toLocaleLowerCase('es'),
    ),
  )

  return selections.every((genre) => normalizedGenres.has(String(genre).toLocaleLowerCase('es')))
}

export const useMangaStore = defineStore('mangas', {
  state: () => ({
    mangas: [],
    loading: false,
    syncError: null,
    searchQuery: '',
    filters: { ...DEFAULT_FILTERS },
    subscribedUid: null,
  }),

  getters: {
    filteredMangas(state) {
      const settingsStore = useSettingsStore()
      const normalizedSearch = normalizeMangaName(state.searchQuery)
      const filtered = state.mangas.filter((manga) => {
        const matchesSearch =
          !normalizedSearch ||
          String(manga.normalizedName ?? normalizeMangaName(manga.name)).includes(normalizedSearch)
        const matchesReadingStatus =
          !state.filters.readingStatus ||
          state.filters.readingStatus === 'all' ||
          manga.readingStatus === state.filters.readingStatus
        const matchesType =
          !state.filters.type || state.filters.type === 'all' || manga.type === state.filters.type
        const matchesGenres = selectedGenresMatch(manga.genres, state.filters.genres)
        const matchesFavorite = !state.filters.favoritesOnly || manga.favorite === true

        return (
          matchesSearch && matchesReadingStatus && matchesType && matchesGenres && matchesFavorite
        )
      })

      return sortMangas(filtered, settingsStore.sortBy)
    },

    counters(state) {
      return state.mangas.reduce(
        (totals, manga) => {
          totals.total += 1

          if (Object.hasOwn(totals, manga.readingStatus)) {
            totals[manga.readingStatus] += 1
          }

          if (manga.favorite === true) {
            totals.favorites += 1
          }

          return totals
        },
        {
          total: 0,
          following: 0,
          pending: 0,
          completed: 0,
          dropped: 0,
          favorites: 0,
        },
      )
    },
  },

  actions: {
    subscribe(uid) {
      if (!uid) {
        this.unsubscribe()
        return
      }

      if (this.subscribedUid === uid && stopMangaListener) {
        return
      }

      this.unsubscribe()
      const version = subscriptionVersion
      this.loading = true
      this.syncError = null
      this.subscribedUid = uid

      try {
        stopMangaListener = subscribeToMangas(
          uid,
          (mangas) => {
            if (this.subscribedUid !== uid || version !== subscriptionVersion) {
              return
            }

            this.mangas = mangas
            this.syncError = null
            this.loading = false
          },
          (error) => {
            if (this.subscribedUid !== uid || version !== subscriptionVersion) {
              return
            }

            const appError = toAppError(error, 'No se ha podido sincronizar la biblioteca.')
            stopMangaListener = null
            this.subscribedUid = null
            this.syncError = appError.message
            this.loading = false
          },
        )
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido abrir la biblioteca.')
        this.syncError = appError.message
        this.loading = false
        this.subscribedUid = null
        throw appError
      }
    },

    unsubscribe() {
      subscriptionVersion += 1
      stopMangaListener?.()
      stopMangaListener = null
      this.subscribedUid = null
      this.mangas = []
      this.loading = false
      this.syncError = null
      this.searchQuery = ''
      this.filters = { ...DEFAULT_FILTERS }
    },

    setSearchQuery(value) {
      this.searchQuery = String(value ?? '')
    },

    setFilters(filters = {}) {
      this.filters = {
        ...this.filters,
        ...filters,
        genres: Array.isArray(filters.genres) ? [...filters.genres] : this.filters.genres,
      }
    },

    resetFilters() {
      this.filters = { ...DEFAULT_FILTERS }
    },

    async createManga(uid, data, options) {
      try {
        return await createMangaDocument(uid, data, options)
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido guardar la obra.')
        throw appError
      }
    },

    async findDuplicates(uid, name) {
      try {
        return await findMangasByNormalizedName(uid, name)
      } catch (error) {
        const appError = toAppError(error, 'No se han podido comprobar posibles duplicados.')
        throw appError
      }
    },

    async updateManga(uid, id, data, options) {
      try {
        return await updateMangaDocument(uid, id, data, options)
      } catch (error) {
        const appError = toAppError(error, 'No se han podido guardar los cambios.')
        throw appError
      }
    },

    async deleteManga(uid, id) {
      try {
        await deleteMangaDocument(uid, id)
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido eliminar la obra.')
        throw appError
      }
    },

    async toggleFavorite(uid, manga) {
      return this.updateManga(
        uid,
        manga.id,
        { favorite: manga.favorite !== true },
        { expectedValues: { favorite: manga.favorite === true } },
      )
    },

    async changeChapter(uid, manga, direction) {
      try {
        const chapter = await changeMangaChapter(uid, manga.id, direction)
        return { changed: true, chapter, requiresManual: false }
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido actualizar el capítulo.')

        if (appError.code === 'app/manual-chapter-required') {
          return { changed: false, chapter: manga.chapter, requiresManual: true }
        }

        throw appError
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMangaStore, import.meta.hot))
}
