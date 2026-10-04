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
    error: null,
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
      this.loading = true
      this.error = null
      this.subscribedUid = uid

      try {
        stopMangaListener = subscribeToMangas(
          uid,
          (mangas) => {
            if (this.subscribedUid !== uid) {
              return
            }

            this.mangas = mangas
            this.loading = false
          },
          (error) => {
            if (this.subscribedUid !== uid) {
              return
            }

            const appError = toAppError(error, 'No se ha podido sincronizar la biblioteca.')
            stopMangaListener = null
            this.subscribedUid = null
            this.error = appError.message
            this.loading = false
          },
        )
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido abrir la biblioteca.')
        this.error = appError.message
        this.loading = false
        this.subscribedUid = null
        throw appError
      }
    },

    unsubscribe() {
      stopMangaListener?.()
      stopMangaListener = null
      this.subscribedUid = null
      this.mangas = []
      this.loading = false
      this.error = null
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

    async createManga(uid, data) {
      this.error = null

      try {
        return await createMangaDocument(uid, data)
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido guardar la obra.')
        this.error = appError.message
        throw appError
      }
    },

    async findDuplicates(uid, name) {
      this.error = null

      try {
        return await findMangasByNormalizedName(uid, name)
      } catch (error) {
        const appError = toAppError(error, 'No se han podido comprobar posibles duplicados.')
        this.error = appError.message
        throw appError
      }
    },

    async updateManga(uid, id, data, options) {
      this.error = null

      try {
        return await updateMangaDocument(uid, id, data, options)
      } catch (error) {
        const appError = toAppError(error, 'No se han podido guardar los cambios.')
        this.error = appError.message
        throw appError
      }
    },

    async deleteManga(uid, id) {
      this.error = null

      try {
        await deleteMangaDocument(uid, id)
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido eliminar la obra.')
        this.error = appError.message
        throw appError
      }
    },

    async toggleFavorite(uid, manga) {
      return this.updateManga(uid, manga.id, { favorite: manga.favorite !== true })
    },

    async changeChapter(uid, manga, direction) {
      this.error = null

      try {
        const chapter = await changeMangaChapter(uid, manga.id, direction)
        return { changed: true, chapter, requiresManual: false }
      } catch (error) {
        const appError = toAppError(error, 'No se ha podido actualizar el capítulo.')

        if (appError.code === 'app/manual-chapter-required') {
          return { changed: false, chapter: manga.chapter, requiresManual: true }
        }

        this.error = appError.message
        throw appError
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMangaStore, import.meta.hot))
}
