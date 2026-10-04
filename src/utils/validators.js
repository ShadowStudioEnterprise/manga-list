import {
  MANGA_LIMITS,
  MANGA_TYPE_VALUES,
  PUBLICATION_STATUS_VALUES,
  READING_STATUS_VALUES,
} from '../constants/manga-options.js'
import { normalizeChapter } from './chapter-utils.js'
import { normalizeTitle } from './normalize-title.js'

function validationError(field, code, message) {
  return { field, code, message }
}

export function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

export function isValidHttpUrl(value) {
  if (isBlank(value)) return false

  try {
    const parsedUrl = new URL(String(value).trim())
    return ['http:', 'https:'].includes(parsedUrl.protocol) && parsedUrl.hostname !== ''
  } catch {
    return false
  }
}

export function validateSource(source, index = 0) {
  const errors = []
  const fieldPrefix = `sources.${index}`

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return [validationError(fieldPrefix, 'invalid_source', 'La fuente no tiene un formato válido.')]
  }

  if (isBlank(source.url)) {
    errors.push(
      validationError(`${fieldPrefix}.url`, 'required', 'La URL de la fuente es obligatoria.'),
    )
  } else if (!isValidHttpUrl(source.url)) {
    errors.push(
      validationError(
        `${fieldPrefix}.url`,
        'invalid_url',
        'La URL debe comenzar por http:// o https://.',
      ),
    )
  } else if (String(source.url).trim().length > MANGA_LIMITS.sourceUrl) {
    errors.push(
      validationError(
        `${fieldPrefix}.url`,
        'url_too_long',
        `La URL no puede superar los ${MANGA_LIMITS.sourceUrl} caracteres.`,
      ),
    )
  }

  if (String(source.name ?? '').trim().length > MANGA_LIMITS.sourceName) {
    errors.push(
      validationError(
        `${fieldPrefix}.name`,
        'source_name_too_long',
        `El nombre de la fuente no puede superar los ${MANGA_LIMITS.sourceName} caracteres.`,
      ),
    )
  }

  if (String(source.id ?? '').trim().length > MANGA_LIMITS.sourceId) {
    errors.push(
      validationError(
        `${fieldPrefix}.id`,
        'source_id_too_long',
        'El identificador de la fuente es demasiado largo.',
      ),
    )
  }

  return errors
}

/**
 * Validates the internal manga shape. It returns structured errors so forms
 * and import previews can decide how to present them.
 */
export function validateManga(manga) {
  const errors = []

  if (!manga || typeof manga !== 'object' || Array.isArray(manga)) {
    return {
      valid: false,
      errors: [validationError('', 'invalid_manga', 'La obra no tiene un formato válido.')],
    }
  }

  if (isBlank(manga.name)) {
    errors.push(validationError('name', 'required', 'El nombre es obligatorio.'))
  } else if (String(manga.name).trim().length > MANGA_LIMITS.name) {
    errors.push(
      validationError(
        'name',
        'name_too_long',
        `El nombre no puede superar los ${MANGA_LIMITS.name} caracteres.`,
      ),
    )
  } else if (!normalizeTitle(manga.name)) {
    errors.push(
      validationError('name', 'invalid_name', 'El nombre debe contener una letra o un número.'),
    )
  }

  const chapter = normalizeChapter(manga.chapter)
  if (chapter === '') {
    errors.push(validationError('chapter', 'required', 'El capítulo es obligatorio.'))
  } else if (chapter.length > MANGA_LIMITS.chapter) {
    errors.push(
      validationError(
        'chapter',
        'chapter_too_long',
        `El capítulo no puede superar los ${MANGA_LIMITS.chapter} caracteres.`,
      ),
    )
  }

  if (!isBlank(manga.type) && !MANGA_TYPE_VALUES.includes(manga.type)) {
    errors.push(validationError('type', 'invalid_type', 'El tipo de obra no es válido.'))
  }

  if (isBlank(manga.readingStatus) || !READING_STATUS_VALUES.includes(manga.readingStatus)) {
    errors.push(
      validationError(
        'readingStatus',
        'invalid_reading_status',
        'El estado de lectura no es válido.',
      ),
    )
  }

  if (
    !isBlank(manga.publicationStatus) &&
    !PUBLICATION_STATUS_VALUES.includes(manga.publicationStatus)
  ) {
    errors.push(
      validationError(
        'publicationStatus',
        'invalid_publication_status',
        'El estado de publicación no es válido.',
      ),
    )
  }

  if (manga.genres !== undefined && !Array.isArray(manga.genres)) {
    errors.push(validationError('genres', 'invalid_genres', 'Los géneros deben ser una lista.'))
  } else if (Array.isArray(manga.genres)) {
    if (manga.genres.length > MANGA_LIMITS.genres) {
      errors.push(
        validationError(
          'genres',
          'too_many_genres',
          `No puede haber más de ${MANGA_LIMITS.genres} géneros.`,
        ),
      )
    }

    manga.genres.forEach((genre, index) => {
      if (isBlank(genre) || String(genre).trim().length > MANGA_LIMITS.genre) {
        errors.push(
          validationError(
            `genres.${index}`,
            'invalid_genre',
            `Cada género debe tener entre 1 y ${MANGA_LIMITS.genre} caracteres.`,
          ),
        )
      }
    })
  }

  if (manga.sources !== undefined && !Array.isArray(manga.sources)) {
    errors.push(validationError('sources', 'invalid_sources', 'Las fuentes deben ser una lista.'))
  } else if (Array.isArray(manga.sources)) {
    if (manga.sources.length > MANGA_LIMITS.sources) {
      errors.push(
        validationError(
          'sources',
          'too_many_sources',
          `No puede haber más de ${MANGA_LIMITS.sources} fuentes.`,
        ),
      )
    }

    manga.sources.forEach((source, index) => {
      errors.push(...validateSource(source, index))
    })

    const primarySourceCount = manga.sources.filter((source) => source?.isPrimary === true).length
    if (primarySourceCount > 1) {
      errors.push(
        validationError(
          'sources',
          'multiple_primary_sources',
          'Solo puede existir una fuente principal.',
        ),
      )
    }
  }

  if (String(manga.notes ?? '').length > MANGA_LIMITS.notes) {
    errors.push(
      validationError(
        'notes',
        'notes_too_long',
        `Las notas no pueden superar los ${MANGA_LIMITS.notes} caracteres.`,
      ),
    )
  }

  return { valid: errors.length === 0, errors }
}

export function requiredRule(label = 'Este campo') {
  return (value) => !isBlank(value) || `${label} es obligatorio.`
}

export function optionalUrlRule(value) {
  return isBlank(value) || isValidHttpUrl(value) || 'Introduce una URL http:// o https:// válida.'
}
