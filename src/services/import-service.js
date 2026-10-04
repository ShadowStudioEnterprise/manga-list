import {
  DEFAULT_MANGA_VALUES,
  MANGA_TYPE_VALUES,
  PUBLICATION_STATUS_VALUES,
  READING_STATUS_VALUES,
} from '../constants/manga-options.js'
import { normalizeChapter } from '../utils/chapter-utils.js'
import { normalizeTitle } from '../utils/normalize-title.js'
import { validateManga } from '../utils/validators.js'

export const IMPORT_FORMATS = Object.freeze({
  JSON: 'json',
  CSV: 'csv',
  TXT: 'txt',
})

const COLUMN_ALIASES = Object.freeze({
  name: 'name',
  title: 'name',
  nombre: 'name',
  titulo: 'name',
  obra: 'name',
  chapter: 'chapter',
  currentchapter: 'chapter',
  lastchapter: 'chapter',
  capitulo: 'chapter',
  ultimocapitulo: 'chapter',
  cap: 'chapter',
  type: 'type',
  tipo: 'type',
  format: 'type',
  formato: 'type',
  genres: 'genres',
  genre: 'genres',
  generos: 'genres',
  genero: 'genres',
  readingstatus: 'readingStatus',
  readingstate: 'readingStatus',
  status: 'readingStatus',
  estado: 'readingStatus',
  estadolectura: 'readingStatus',
  publicationstatus: 'publicationStatus',
  publicationstate: 'publicationStatus',
  estadopublicacion: 'publicationStatus',
  url: 'url',
  link: 'url',
  enlace: 'url',
  sourceurl: 'url',
  urlfuente: 'url',
  sourcename: 'sourceName',
  nombrefuente: 'sourceName',
  fuente: 'sourceName',
  sources: 'sources',
  fuentes: 'sources',
  notes: 'notes',
  note: 'notes',
  notas: 'notes',
  favorite: 'favorite',
  favourite: 'favorite',
  favorito: 'favorite',
})

const TYPE_ALIASES = Object.freeze({
  comic: 'other',
  manga: 'manga',
  manhwa: 'manhwa',
  manhua: 'manhua',
  other: 'other',
  otro: 'other',
  otros: 'other',
})

const READING_STATUS_ALIASES = Object.freeze({
  following: 'following',
  reading: 'following',
  siguiendo: 'following',
  leyendo: 'following',
  pending: 'pending',
  planned: 'pending',
  pendiente: 'pending',
  pendientes: 'pending',
  completed: 'completed',
  complete: 'completed',
  finished: 'completed',
  completado: 'completed',
  completada: 'completed',
  finalizado: 'completed',
  finalizada: 'completed',
  dropped: 'dropped',
  abandoned: 'dropped',
  abandonado: 'dropped',
  abandonada: 'dropped',
})

const PUBLICATION_STATUS_ALIASES = Object.freeze({
  publishing: 'publishing',
  ongoing: 'publishing',
  enpublicacion: 'publishing',
  publicando: 'publishing',
  completed: 'completed',
  complete: 'completed',
  finished: 'completed',
  completado: 'completed',
  completada: 'completed',
  finalizado: 'completed',
  finalizada: 'completed',
  hiatus: 'hiatus',
  paused: 'hiatus',
  enpausa: 'hiatus',
  pausada: 'hiatus',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  cancelado: 'cancelled',
  cancelada: 'cancelled',
  authorabandoned: 'author_abandoned',
  abandonedbyauthor: 'author_abandoned',
  abandonadaporelautor: 'author_abandoned',
  unknown: 'unknown',
  desconocido: 'unknown',
  desconocida: 'unknown',
})

function importError(field, code, message) {
  return { field, code, message }
}

function stripBom(value) {
  return String(value ?? '').replace(/^\uFEFF/, '')
}

function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{Mark}+/gu, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, '')
}

function normalizeEnumToken(value) {
  return normalizeKey(value)
}

function canonicalizeRecord(record) {
  const canonical = {}

  Object.entries(record).forEach(([key, value]) => {
    const canonicalKey = COLUMN_ALIASES[normalizeKey(key)]
    if (canonicalKey && canonical[canonicalKey] === undefined) {
      canonical[canonicalKey] = value
    }
  })

  return canonical
}

function normalizeEnum(value, aliases, allowedValues, fallback) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback
  }

  const rawValue = String(value).trim()
  if (allowedValues.includes(rawValue)) return rawValue

  return aliases[normalizeEnumToken(rawValue)] ?? rawValue
}

function normalizeGenres(value) {
  let values = value

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (trimmed.startsWith('[')) {
      try {
        values = JSON.parse(trimmed)
      } catch {
        values = trimmed.split(/[;,|]/)
      }
    } else {
      values = trimmed.split(/[;,|]/)
    }
  }

  if (!Array.isArray(values)) return []

  const seen = new Set()
  return values
    .map((genre) => String(genre ?? '').trim())
    .filter((genre) => {
      const normalizedGenre = normalizeTitle(genre)
      if (!normalizedGenre || seen.has(normalizedGenre)) return false
      seen.add(normalizedGenre)
      return true
    })
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (value === null || value === undefined || value === '') return fallback

  return ['1', 'true', 'yes', 'y', 'si', 'sí'].includes(
    String(value).trim().toLocaleLowerCase('es'),
  )
}

function createSourceId(recordIndex, sourceIndex) {
  return globalThis.crypto?.randomUUID?.() ?? `import-source-${recordIndex + 1}-${sourceIndex + 1}`
}

function normalizeSource(source, recordIndex, sourceIndex) {
  const sourceObject =
    typeof source === 'string'
      ? { url: source }
      : source && typeof source === 'object'
        ? source
        : {}

  const url = String(sourceObject.url ?? sourceObject.link ?? '').trim()
  const name = String(sourceObject.name ?? sourceObject.label ?? '').trim()
  const primaryValue = sourceObject.isPrimary ?? sourceObject.primary

  return {
    id: String(sourceObject.id ?? '').trim() || createSourceId(recordIndex, sourceIndex),
    name: name || `Fuente ${sourceIndex + 1}`,
    url,
    isPrimary: normalizeBoolean(primaryValue),
  }
}

function normalizeSources(canonical, recordIndex) {
  const errors = []
  let sourceValues = canonical.sources

  if (typeof sourceValues === 'string') {
    const trimmedSources = sourceValues.trim()

    if (trimmedSources.startsWith('[')) {
      try {
        sourceValues = JSON.parse(trimmedSources)
      } catch {
        errors.push(
          importError(
            'sources',
            'invalid_sources_json',
            'La columna de fuentes no contiene JSON válido.',
          ),
        )
        sourceValues = []
      }
    } else if (trimmedSources) {
      sourceValues = [trimmedSources]
    }
  }

  if (!Array.isArray(sourceValues)) {
    sourceValues = sourceValues ? [sourceValues] : []
  }

  // Keep malformed entries so validation can explain them in the preview.
  const sources = sourceValues.map((source, index) => normalizeSource(source, recordIndex, index))

  const flatUrl = String(canonical.url ?? '').trim()
  if (flatUrl && !sources.some((source) => source.url === flatUrl)) {
    sources.push({
      id: createSourceId(recordIndex, sources.length),
      name: String(canonical.sourceName ?? '').trim() || 'Fuente principal',
      url: flatUrl,
      isPrimary: sources.length === 0,
    })
  }

  if (sources.length > 0) {
    const firstPrimaryIndex = sources.findIndex((source) => source.isPrimary)
    const primaryIndex = firstPrimaryIndex >= 0 ? firstPrimaryIndex : 0

    sources.forEach((source, index) => {
      source.isPrimary = index === primaryIndex
      if (source.name === `Fuente ${index + 1}` && index === primaryIndex) {
        source.name = 'Fuente principal'
      }
    })
  }

  return { sources, errors }
}

function extractJsonRecords(parsed) {
  if (Array.isArray(parsed)) return parsed

  if (parsed && typeof parsed === 'object') {
    for (const key of ['mangas', 'items', 'records', 'data']) {
      if (Array.isArray(parsed[key])) return parsed[key]
    }

    if (Object.keys(parsed).some((key) => COLUMN_ALIASES[normalizeKey(key)] === 'name')) {
      return [parsed]
    }
  }

  return null
}

function parseJsonImport(content) {
  try {
    const parsed = JSON.parse(stripBom(content))
    const records = extractJsonRecords(parsed)

    if (!records) {
      return {
        rows: [],
        parseErrors: [
          {
            sourceIndex: null,
            raw: parsed,
            ...importError('', 'invalid_json_shape', 'El JSON debe contener una lista de obras.'),
          },
        ],
      }
    }

    return {
      rows: records.map((value, index) => ({
        sourceIndex: index + 1,
        raw: value,
        value,
        parserErrors: [],
      })),
      parseErrors: [],
    }
  } catch (error) {
    return {
      rows: [],
      parseErrors: [
        {
          sourceIndex: null,
          raw: null,
          ...importError('', 'invalid_json', `No se ha podido leer el JSON: ${error.message}`),
        },
      ],
    }
  }
}

function parseCsvMatrix(content) {
  const input = stripBom(content)
  const rows = []
  const errors = []
  let row = []
  let field = ''
  let inQuotes = false
  let currentLine = 1
  let rowStartLine = 1

  const finishRow = () => {
    row.push(field)
    const isBlankRow = row.every((value) => value.trim() === '')
    if (!isBlankRow) rows.push({ values: row, line: rowStartLine })
    row = []
    field = ''
    rowStartLine = currentLine + 1
  }

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]

    if (character === '"') {
      if (inQuotes && input[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (inQuotes) {
        inQuotes = false
      } else if (field === '') {
        inQuotes = true
      } else {
        field += character
      }
    } else if (character === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && input[index + 1] === '\n') index += 1
      finishRow()
      currentLine += 1
    } else {
      field += character
      if (character === '\n') currentLine += 1
    }
  }

  if (inQuotes) {
    errors.push({
      sourceIndex: rowStartLine,
      raw: null,
      ...importError('', 'unclosed_csv_quote', 'Hay una comilla sin cerrar en el CSV.'),
    })
  }

  if (field !== '' || row.length > 0) finishRow()
  return { rows, errors }
}

function parseCsvImport(content) {
  const matrix = parseCsvMatrix(content)
  if (matrix.rows.length === 0) {
    return {
      rows: [],
      parseErrors: [
        ...matrix.errors,
        {
          sourceIndex: null,
          raw: null,
          ...importError('', 'empty_csv', 'El CSV no contiene datos.'),
        },
      ],
    }
  }

  const [headerRow, ...dataRows] = matrix.rows
  const headers = headerRow.values.map((header) => String(header).trim())
  const knownHeaders = headers.filter((header) => COLUMN_ALIASES[normalizeKey(header)])
  const dataRowLines = new Set(dataRows.map((row) => row.line))
  const parseErrors = matrix.errors.filter((error) => !dataRowLines.has(error.sourceIndex))

  if (knownHeaders.length === 0) {
    parseErrors.push({
      sourceIndex: headerRow.line,
      raw: headerRow.values,
      ...importError('', 'unknown_csv_headers', 'No se reconoce ninguna columna del CSV.'),
    })
  }

  return {
    rows: dataRows.map((dataRow) => {
      const value = {}
      const parserErrors = matrix.errors
        .filter((error) => error.sourceIndex === dataRow.line)
        .map(({ field, code, message }) => ({ field, code, message }))
      if (dataRow.values.length !== headers.length) {
        parserErrors.push(
          importError(
            '',
            'csv_column_count',
            `La fila contiene ${dataRow.values.length} columnas; se esperaban ${headers.length}.`,
          ),
        )
      }
      headers.forEach((header, index) => {
        if (header) value[header] = dataRow.values[index] ?? ''
      })

      return {
        sourceIndex: dataRow.line,
        raw: dataRow.values,
        value,
        parserErrors,
      }
    }),
    parseErrors,
  }
}

function parseTxtImport(content) {
  const rows = []

  stripBom(content)
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (line.trim() === '') return

      const parts = line.split('|').map((part) => part.trim())
      const parserErrors = []

      if (parts.length < 2 || parts.length > 3) {
        parserErrors.push(
          importError(
            '',
            'invalid_txt_line',
            'La línea debe tener el formato Nombre | Capítulo | URL.',
          ),
        )
      }

      rows.push({
        sourceIndex: index + 1,
        raw: line,
        value: {
          name: parts[0] ?? '',
          chapter: parts[1] ?? '',
          url: parts[2] ?? '',
        },
        parserErrors,
      })
    })

  return {
    rows,
    parseErrors:
      rows.length === 0
        ? [
            {
              sourceIndex: null,
              raw: null,
              ...importError('', 'empty_txt', 'El archivo TXT no contiene datos.'),
            },
          ]
        : [],
  }
}

export function detectImportFormat(fileNameOrMimeType = '', content = '') {
  const hint = String(fileNameOrMimeType).trim().toLocaleLowerCase('es')

  if (hint.endsWith('.json') || hint.includes('application/json')) return IMPORT_FORMATS.JSON
  if (hint.endsWith('.csv') || hint.includes('text/csv')) return IMPORT_FORMATS.CSV
  if (hint.endsWith('.txt') || hint.includes('text/plain')) return IMPORT_FORMATS.TXT

  const trimmedContent = stripBom(content).trimStart()
  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    return IMPORT_FORMATS.JSON
  }

  const firstLine = trimmedContent.split(/\r?\n/, 1)[0] ?? ''
  if (firstLine.includes(',')) return IMPORT_FORMATS.CSV
  if (firstLine.includes('|')) return IMPORT_FORMATS.TXT

  return ''
}

export function parseImportContent(content, format) {
  const normalizedFormat = String(format ?? '')
    .replace(/^\./, '')
    .toLocaleLowerCase('es')

  if (normalizedFormat === IMPORT_FORMATS.JSON) return parseJsonImport(content)
  if (normalizedFormat === IMPORT_FORMATS.CSV) return parseCsvImport(content)
  if (normalizedFormat === IMPORT_FORMATS.TXT) return parseTxtImport(content)

  return {
    rows: [],
    parseErrors: [
      {
        sourceIndex: null,
        raw: null,
        ...importError('', 'unsupported_format', 'El formato de importación no es compatible.'),
      },
    ],
  }
}

/**
 * Converts JSON/CSV/TXT field names and values into the internal Manga model.
 * Firestore timestamps are deliberately omitted; the persistence service must
 * add serverTimestamp() when the selected records are saved.
 */
export function mapImportedRecord(record, recordIndex = 0) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return {
      manga: null,
      errors: [importError('', 'invalid_record', 'El registro no contiene una obra válida.')],
    }
  }

  const canonical = canonicalizeRecord(record)
  const name = String(canonical.name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
  const { sources, errors } = normalizeSources(canonical, recordIndex)

  const manga = {
    name,
    normalizedName: normalizeTitle(name),
    chapter: normalizeChapter(canonical.chapter),
    type: normalizeEnum(canonical.type, TYPE_ALIASES, MANGA_TYPE_VALUES, DEFAULT_MANGA_VALUES.type),
    genres: normalizeGenres(canonical.genres),
    readingStatus: normalizeEnum(
      canonical.readingStatus,
      READING_STATUS_ALIASES,
      READING_STATUS_VALUES,
      DEFAULT_MANGA_VALUES.readingStatus,
    ),
    publicationStatus: normalizeEnum(
      canonical.publicationStatus,
      PUBLICATION_STATUS_ALIASES,
      PUBLICATION_STATUS_VALUES,
      DEFAULT_MANGA_VALUES.publicationStatus,
    ),
    sources,
    notes: String(canonical.notes ?? '').trim(),
    favorite: normalizeBoolean(canonical.favorite),
  }

  return { manga, errors }
}

function existingMangaIndex(existingMangas) {
  const result = new Map()

  existingMangas.forEach((manga) => {
    const normalizedName = manga?.normalizedName || normalizeTitle(manga?.name)
    if (normalizedName && !result.has(normalizedName)) {
      result.set(normalizedName, manga)
    }
  })

  return result
}

function duplicateReference(scope, manga, itemId = null) {
  return {
    scope,
    id: manga?.id ?? itemId,
    name: manga?.name ?? '',
    normalizedName: manga?.normalizedName || normalizeTitle(manga?.name),
  }
}

function classifyPreviewItems(parsed, existingMangas) {
  const items = parsed.parseErrors.map((error, index) => ({
    id: `parse-error-${index + 1}`,
    sourceIndex: error.sourceIndex,
    raw: error.raw,
    manga: null,
    status: 'error',
    selected: false,
    duplicateOf: null,
    errors: [
      {
        field: error.field,
        code: error.code,
        message: error.message,
      },
    ],
  }))
  const libraryNames = existingMangaIndex(existingMangas)
  const importedNames = new Map()

  parsed.rows.forEach((row, index) => {
    const id = `import-record-${index + 1}`
    const mapped = mapImportedRecord(row.value, index)
    const validation = mapped.manga ? validateManga(mapped.manga) : { valid: false, errors: [] }
    const errors = [...row.parserErrors, ...mapped.errors, ...validation.errors]
    let status = errors.length > 0 ? 'error' : 'valid'
    let duplicateOf = null

    if (status === 'valid') {
      const normalizedName = mapped.manga.normalizedName
      const libraryDuplicate = libraryNames.get(normalizedName)
      const importedDuplicate = importedNames.get(normalizedName)

      if (libraryDuplicate) {
        status = 'duplicate'
        duplicateOf = duplicateReference('library', libraryDuplicate)
      } else if (importedDuplicate) {
        status = 'duplicate'
        duplicateOf = duplicateReference('import', importedDuplicate.manga, importedDuplicate.id)
      } else {
        importedNames.set(normalizedName, { id, manga: mapped.manga })
      }
    }

    items.push({
      id,
      sourceIndex: row.sourceIndex,
      raw: row.raw,
      manga: mapped.manga,
      status,
      selected: status === 'valid',
      duplicateOf,
      errors,
    })
  })

  return items
}

function summarizePreview(items) {
  const valid = items.filter((item) => item.status === 'valid')
  const duplicates = items.filter((item) => item.status === 'duplicate')
  const errors = items.filter((item) => item.status === 'error')

  return {
    detected: items.length,
    total: items.length,
    new: valid.length,
    valid: valid.length,
    duplicates: duplicates.length,
    errors: errors.length,
    selected: items.filter((item) => item.selected).length,
  }
}

export function createImportPreview(
  content,
  { format = '', fileName = '', mimeType = '', existingMangas = [] } = {},
) {
  const resolvedFormat =
    String(format).replace(/^\./, '').toLocaleLowerCase('es') ||
    detectImportFormat(fileName || mimeType, content)
  const parsed = parseImportContent(content, resolvedFormat)
  const items = classifyPreviewItems(parsed, Array.isArray(existingMangas) ? existingMangas : [])

  return {
    format: resolvedFormat,
    items,
    valid: items.filter((item) => item.status === 'valid'),
    duplicates: items.filter((item) => item.status === 'duplicate'),
    errors: items.filter((item) => item.status === 'error'),
    summary: summarizePreview(items),
  }
}

/**
 * Produces the final pure-data batch for mangaStore. Passing `selectedIds`
 * explicitly allows the UI to opt duplicate rows in; invalid rows are always
 * excluded.
 */
export function prepareImportSelection(preview, { selectedIds } = {}) {
  const explicitSelection = Array.isArray(selectedIds) || selectedIds instanceof Set
  const selectedIdSet = explicitSelection ? new Set(selectedIds) : null
  const items = Array.isArray(preview?.items) ? preview.items : []
  const selectedItems = items.filter((item) => {
    if (item.status === 'error' || item.imported || !item.manga) return false
    return selectedIdSet ? selectedIdSet.has(item.id) : item.selected === true
  })

  return {
    mangas: selectedItems.map((item) => ({
      ...item.manga,
      genres: [...item.manga.genres],
      sources: item.manga.sources.map((source) => ({ ...source })),
    })),
    selectedItems,
    skippedItems: items.filter((item) => !selectedItems.includes(item)),
    summary: {
      selected: selectedItems.length,
      skipped: items.length - selectedItems.length,
    },
  }
}
