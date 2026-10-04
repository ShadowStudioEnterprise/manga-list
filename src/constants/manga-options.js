const freezeOptions = (options) =>
  Object.freeze(options.map((option) => Object.freeze({ ...option })))

export const MANGA_TYPES = freezeOptions([
  { value: 'manga', label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'other', label: 'Otro' },
])

export const READING_STATUSES = freezeOptions([
  { value: 'following', label: 'Siguiendo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Finalizado' },
  { value: 'dropped', label: 'Abandonado' },
])

export const PUBLICATION_STATUSES = freezeOptions([
  { value: 'publishing', label: 'En publicación' },
  { value: 'completed', label: 'Finalizada' },
  { value: 'hiatus', label: 'En pausa / Hiatus' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'author_abandoned', label: 'Abandonada por el autor' },
  { value: 'unknown', label: 'Desconocido' },
])

export const MANGA_GENRES = Object.freeze([
  'Acción',
  'Aventura',
  'Romance',
  'Drama',
  'Fantasía',
  'Comedia',
  'Terror',
  'Misterio',
  'Ciencia ficción',
  'Artes marciales',
  'Slice of Life',
  'Deportes',
  'Psicológico',
  'Sobrenatural',
  'Histórico',
])

export const LIBRARY_SORT_OPTIONS = freezeOptions([
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'updated-desc', label: 'Actualizado recientemente' },
  { value: 'created-desc', label: 'Añadido recientemente' },
  { value: 'chapter-desc', label: 'Capítulo' },
])

export const MANGA_LIMITS = Object.freeze({
  name: 200,
  chapter: 64,
  notes: 5000,
  genres: 20,
  genre: 60,
  sources: 10,
  sourceName: 100,
  sourceId: 100,
  sourceUrl: 2048,
})

export const MANGA_TYPE_VALUES = Object.freeze(MANGA_TYPES.map(({ value }) => value))
export const READING_STATUS_VALUES = Object.freeze(READING_STATUSES.map(({ value }) => value))
export const PUBLICATION_STATUS_VALUES = Object.freeze(
  PUBLICATION_STATUSES.map(({ value }) => value),
)

export const DEFAULT_MANGA_VALUES = Object.freeze({
  name: '',
  chapter: '',
  type: 'other',
  readingStatus: 'following',
  publicationStatus: 'unknown',
  notes: '',
  favorite: false,
})

export function getOptionLabel(options, value, fallback = '') {
  return options.find((option) => option.value === value)?.label ?? fallback
}

export function createEmptyManga() {
  return {
    ...DEFAULT_MANGA_VALUES,
    normalizedName: '',
    genres: [],
    sources: [],
  }
}
