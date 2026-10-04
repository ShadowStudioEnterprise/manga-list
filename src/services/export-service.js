export const EXPORT_FORMATS = Object.freeze({
  JSON: 'json',
  CSV: 'csv',
})

export const CSV_EXPORT_COLUMNS = Object.freeze([
  'name',
  'chapter',
  'type',
  'genres',
  'readingStatus',
  'publicationStatus',
  'url',
  'sourceName',
  'sources',
  'notes',
  'favorite',
])

function assertMangaList(mangas) {
  if (!Array.isArray(mangas)) {
    throw new TypeError('La biblioteca debe ser una lista de obras.')
  }
}

function timestampToIsoString(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }

  if (value && typeof value.toDate === 'function') {
    try {
      const date = value.toDate()
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date.toISOString()
    } catch {
      return null
    }
  }

  return null
}

function toSerializableValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value ?? null
  if (typeof value === 'bigint') return value.toString()
  if (typeof value !== 'object') return value

  const timestamp = timestampToIsoString(value)
  if (timestamp) return timestamp

  if (seen.has(value)) return null
  seen.add(value)

  if (Array.isArray(value)) {
    const result = value.map((item) => toSerializableValue(item, seen))
    seen.delete(value)
    return result
  }

  const result = {}
  Object.entries(value).forEach(([key, item]) => {
    if (typeof item !== 'undefined' && typeof item !== 'function' && typeof item !== 'symbol') {
      result[key] = toSerializableValue(item, seen)
    }
  })
  seen.delete(value)
  return result
}

function escapeCsvCell(value) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function primarySourceFor(manga) {
  if (!Array.isArray(manga?.sources)) return null
  return manga.sources.find((source) => source?.isPrimary) ?? manga.sources[0] ?? null
}

function mangaToCsvRecord(manga) {
  const primarySource = primarySourceFor(manga)
  const serializableSources = Array.isArray(manga?.sources)
    ? toSerializableValue(manga.sources)
    : []

  return {
    name: manga?.name ?? '',
    chapter: manga?.chapter ?? '',
    type: manga?.type ?? '',
    genres: Array.isArray(manga?.genres) ? manga.genres.join('; ') : '',
    readingStatus: manga?.readingStatus ?? '',
    publicationStatus: manga?.publicationStatus ?? '',
    url: primarySource?.url ?? '',
    sourceName: primarySource?.name ?? '',
    sources: serializableSources.length > 0 ? JSON.stringify(serializableSources) : '',
    notes: manga?.notes ?? '',
    favorite: manga?.favorite === true ? 'true' : 'false',
  }
}

function safeDatePart(date) {
  const parsedDate = date instanceof Date ? date : new Date(date)
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  return safeDate.toISOString().slice(0, 10)
}

export function exportLibraryToJson(mangas, { pretty = true } = {}) {
  assertMangaList(mangas)
  return JSON.stringify(toSerializableValue(mangas), null, pretty ? 2 : 0)
}

export function exportLibraryToCsv(mangas, { includeBom = true } = {}) {
  assertMangaList(mangas)

  const rows = [CSV_EXPORT_COLUMNS.join(',')]
  mangas.forEach((manga) => {
    const record = mangaToCsvRecord(manga)
    rows.push(CSV_EXPORT_COLUMNS.map((column) => escapeCsvCell(record[column])).join(','))
  })

  return `${includeBom ? '\uFEFF' : ''}${rows.join('\r\n')}`
}

/**
 * Creates an export payload without touching the DOM. This is useful for a
 * preview, tests, or handing the download to another UI layer.
 */
export function createLibraryExport(
  mangas,
  format,
  { fileName = '', date = new Date(), pretty = true, includeBom = true } = {},
) {
  const normalizedFormat = String(format ?? '')
    .replace(/^\./, '')
    .toLocaleLowerCase('es')
  const datePart = safeDatePart(date)

  if (normalizedFormat === EXPORT_FORMATS.JSON) {
    return {
      format: EXPORT_FORMATS.JSON,
      fileName: fileName || `mangalist-${datePart}.json`,
      mimeType: 'application/json;charset=utf-8',
      content: exportLibraryToJson(mangas, { pretty }),
    }
  }

  if (normalizedFormat === EXPORT_FORMATS.CSV) {
    return {
      format: EXPORT_FORMATS.CSV,
      fileName: fileName || `mangalist-${datePart}.csv`,
      mimeType: 'text/csv;charset=utf-8',
      content: exportLibraryToCsv(mangas, { includeBom }),
    }
  }

  throw new TypeError('El formato de exportación no es compatible.')
}

export function downloadExport({ content, fileName, mimeType = 'text/plain;charset=utf-8' }) {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    throw new Error('La descarga solo está disponible en el navegador.')
  }

  const blob = new Blob([content], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = fileName
  anchor.hidden = true
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0)

  return fileName
}

export function downloadLibraryExport(mangas, format, options = {}) {
  const payload = createLibraryExport(mangas, format, options)
  downloadExport(payload)
  return payload
}
