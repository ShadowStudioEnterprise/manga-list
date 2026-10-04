import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, requireFirebase } from '@/boot/firebase'
import {
  MANGA_LIMITS,
  MANGA_TYPE_VALUES as MANGA_TYPES,
  PUBLICATION_STATUS_VALUES as PUBLICATION_STATUSES,
  READING_STATUS_VALUES as READING_STATUSES,
} from '@/constants/manga-options'
import { createAppError, toAppError } from '@/utils/firebase-errors'
import { adjustChapter } from '@/utils/chapter-utils'
import { normalizeTitle } from '@/utils/normalize-title'
import { conflictingMangaFields } from '@/utils/manga-edit'

const MAX_NAME_LENGTH = MANGA_LIMITS.name
const MAX_CHAPTER_LENGTH = MANGA_LIMITS.chapter
const MAX_NOTES_LENGTH = MANGA_LIMITS.notes
const MAX_GENRES = MANGA_LIMITS.genres
const MAX_SOURCES = MANGA_LIMITS.sources

function assertIdentifier(value, label) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('/')) {
    throw createAppError('app/invalid-manga', `${label} no es válido.`)
  }

  return value.trim()
}

function cleanRequiredText(value, label, maxLength) {
  const result = typeof value === 'string' ? value.trim() : ''

  if (!result) {
    throw createAppError('app/invalid-manga', `${label} es obligatorio.`)
  }

  if (result.length > maxLength) {
    throw createAppError(
      'app/invalid-manga',
      `${label} no puede superar los ${maxLength} caracteres.`,
    )
  }

  return result
}

function cleanOptionalText(value, label, maxLength) {
  const result = typeof value === 'string' ? value.trim() : ''

  if (result.length > maxLength) {
    throw createAppError(
      'app/invalid-manga',
      `${label} no puede superar los ${maxLength} caracteres.`,
    )
  }

  return result
}

function createSourceId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `source-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cleanUrl(value) {
  const result = typeof value === 'string' ? value.trim() : ''

  if (!result) {
    return ''
  }

  if (result.length > MANGA_LIMITS.sourceUrl) {
    throw createAppError(
      'app/invalid-manga',
      `La URL no puede superar los ${MANGA_LIMITS.sourceUrl} caracteres.`,
    )
  }

  try {
    const parsedUrl = new URL(result)

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Unsupported URL protocol')
    }
  } catch {
    throw createAppError('app/invalid-manga', 'La URL debe ser una dirección HTTP o HTTPS válida.')
  }

  return result
}

function cleanGenres(value) {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  const uniqueGenres = []
  const seen = new Set()

  for (const genre of values) {
    const cleanGenre = cleanOptionalText(genre, 'El género', MANGA_LIMITS.genre)
    const key = cleanGenre.toLocaleLowerCase('es')

    if (cleanGenre && !seen.has(key)) {
      seen.add(key)
      uniqueGenres.push(cleanGenre)
    }
  }

  if (uniqueGenres.length > MAX_GENRES) {
    throw createAppError(
      'app/invalid-manga',
      `No se pueden guardar más de ${MAX_GENRES} géneros por obra.`,
    )
  }

  return uniqueGenres
}

function cleanSources(value, legacyUrl, legacySourceName) {
  const inputSources = Array.isArray(value) ? [...value] : []

  if (inputSources.length === 0 && legacyUrl) {
    inputSources.push({
      name: legacySourceName || 'Fuente principal',
      url: legacyUrl,
      isPrimary: true,
    })
  }

  if (inputSources.length > MAX_SOURCES) {
    throw createAppError(
      'app/invalid-manga',
      `No se pueden guardar más de ${MAX_SOURCES} fuentes por obra.`,
    )
  }

  let primaryAlreadyAssigned = false

  return inputSources
    .map((source, index) => {
      const url = cleanUrl(source?.url)

      if (!url) {
        return null
      }

      const wantsPrimary = source?.isPrimary === true
      const isPrimary = wantsPrimary && !primaryAlreadyAssigned

      if (isPrimary) {
        primaryAlreadyAssigned = true
      }

      return {
        id:
          typeof source?.id === 'string' && source.id.trim()
            ? source.id.trim().slice(0, MANGA_LIMITS.sourceId)
            : createSourceId(),
        name:
          cleanOptionalText(source?.name, 'El nombre de la fuente', MANGA_LIMITS.sourceName) ||
          `Fuente ${index + 1}`,
        url,
        isPrimary,
      }
    })
    .filter(Boolean)
}

function cleanEnum(value, allowedValues, fallback, label) {
  const result = typeof value === 'string' ? value.trim() : ''

  if (!result) {
    return fallback
  }

  if (!allowedValues.includes(result)) {
    throw createAppError('app/invalid-manga', `${label} no es válido.`)
  }

  return result
}

function timestampToDate(value) {
  if (!value) {
    return null
  }

  return typeof value.toDate === 'function' ? value.toDate() : value
}

export const normalizeMangaName = normalizeTitle

export function serializeMangaForCreate(input = {}) {
  const name = cleanRequiredText(input.name, 'El nombre', MAX_NAME_LENGTH)
  const chapter = cleanRequiredText(input.chapter, 'El capítulo', MAX_CHAPTER_LENGTH)
  const normalizedName = normalizeMangaName(name)

  if (!normalizedName) {
    throw createAppError(
      'app/invalid-manga',
      'El nombre debe contener al menos una letra o un número.',
    )
  }

  return {
    schemaVersion: 1,
    name,
    normalizedName,
    chapter,
    type: cleanEnum(input.type, MANGA_TYPES, 'other', 'El tipo'),
    genres: cleanGenres(input.genres),
    readingStatus: cleanEnum(
      input.readingStatus ?? input.status,
      READING_STATUSES,
      'following',
      'El estado de lectura',
    ),
    publicationStatus: cleanEnum(
      input.publicationStatus,
      PUBLICATION_STATUSES,
      'unknown',
      'El estado de publicación',
    ),
    sources: cleanSources(input.sources, input.url, input.sourceName),
    notes: cleanOptionalText(input.notes, 'Las notas', MAX_NOTES_LENGTH),
    favorite: input.favorite === true,
  }
}

export function serializeMangaForUpdate(input = {}) {
  const patch = {}

  if (Object.hasOwn(input, 'name')) {
    patch.name = cleanRequiredText(input.name, 'El nombre', MAX_NAME_LENGTH)
    patch.normalizedName = normalizeMangaName(patch.name)

    if (!patch.normalizedName) {
      throw createAppError(
        'app/invalid-manga',
        'El nombre debe contener al menos una letra o un número.',
      )
    }
  }

  if (Object.hasOwn(input, 'chapter')) {
    patch.chapter = cleanRequiredText(input.chapter, 'El capítulo', MAX_CHAPTER_LENGTH)
  }

  if (Object.hasOwn(input, 'type')) {
    patch.type = cleanEnum(input.type, MANGA_TYPES, 'other', 'El tipo')
  }

  if (Object.hasOwn(input, 'genres')) {
    patch.genres = cleanGenres(input.genres)
  }

  if (Object.hasOwn(input, 'readingStatus') || Object.hasOwn(input, 'status')) {
    patch.readingStatus = cleanEnum(
      input.readingStatus ?? input.status,
      READING_STATUSES,
      'following',
      'El estado de lectura',
    )
  }

  if (Object.hasOwn(input, 'publicationStatus')) {
    patch.publicationStatus = cleanEnum(
      input.publicationStatus,
      PUBLICATION_STATUSES,
      'unknown',
      'El estado de publicación',
    )
  }

  if (
    Object.hasOwn(input, 'sources') ||
    Object.hasOwn(input, 'url') ||
    Object.hasOwn(input, 'sourceName')
  ) {
    patch.sources = cleanSources(input.sources, input.url, input.sourceName)
  }

  if (Object.hasOwn(input, 'notes')) {
    patch.notes = cleanOptionalText(input.notes, 'Las notas', MAX_NOTES_LENGTH)
  }

  if (Object.hasOwn(input, 'favorite')) {
    patch.favorite = input.favorite === true
  }

  if (Object.keys(patch).length === 0) {
    throw createAppError('app/invalid-manga', 'No hay cambios válidos que guardar.')
  }

  return patch
}

export function deserializeManga(snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    ...data,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

export function getMangaCollection(uid) {
  requireFirebase()
  return collection(db, 'users', assertIdentifier(uid, 'El usuario'), 'mangas')
}

function getMangaDocument(uid, mangaId) {
  return doc(getMangaCollection(uid), assertIdentifier(mangaId, 'La obra'))
}

export function subscribeToMangas(uid, onData, onError) {
  const collectionReference = getMangaCollection(uid)

  return onSnapshot(
    collectionReference,
    (snapshot) => {
      onData(snapshot.docs.map(deserializeManga))
    },
    (error) => {
      onError?.(toAppError(error, 'No se ha podido sincronizar la biblioteca.'))
    },
  )
}

export async function createManga(uid, input) {
  try {
    const manga = serializeMangaForCreate(input)
    const reference = await addDoc(getMangaCollection(uid), {
      ...manga,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return reference.id
  } catch (error) {
    throw toAppError(error, 'No se ha podido guardar la obra.')
  }
}

export async function updateManga(uid, mangaId, input, { expectedValues } = {}) {
  try {
    const patch = serializeMangaForUpdate(input)
    const reference = getMangaDocument(uid, mangaId)
    if (expectedValues) {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reference)
        if (!snapshot.exists()) {
          throw createAppError('app/invalid-manga', 'La obra ya no existe.')
        }
        if (conflictingMangaFields(snapshot.data(), patch, expectedValues).length) {
          throw createAppError(
            'app/edit-conflict',
            'Esta obra cambió en otro dispositivo. Tus cambios no se han guardado. Carga la versión actual y revísala antes de guardar.',
          )
        }
        transaction.update(reference, { ...patch, updatedAt: serverTimestamp() })
      })
    } else {
      await updateDoc(reference, { ...patch, updatedAt: serverTimestamp() })
    }

    return mangaId
  } catch (error) {
    throw toAppError(error, 'No se han podido guardar los cambios.')
  }
}

export async function deleteManga(uid, mangaId) {
  try {
    await deleteDoc(getMangaDocument(uid, mangaId))
  } catch (error) {
    throw toAppError(error, 'No se ha podido eliminar la obra.')
  }
}

export async function getManga(uid, mangaId) {
  try {
    const snapshot = await getDoc(getMangaDocument(uid, mangaId))
    return snapshot.exists() ? deserializeManga(snapshot) : null
  } catch (error) {
    throw toAppError(error, 'No se ha podido cargar la obra.')
  }
}

export async function findMangasByNormalizedName(uid, name) {
  try {
    const normalizedName = normalizeMangaName(name)

    if (!normalizedName) {
      return []
    }

    const duplicateQuery = query(
      getMangaCollection(uid),
      where('normalizedName', '==', normalizedName),
      limit(10),
    )
    const snapshot = await getDocs(duplicateQuery)
    return snapshot.docs.map(deserializeManga)
  } catch (error) {
    throw toAppError(error, 'No se han podido comprobar posibles duplicados.')
  }
}

export function calculateNextChapter(chapter, direction) {
  const amount =
    direction === 'increment' || direction === 'increase' || Number(direction) > 0
      ? 1
      : direction === 'decrement' || direction === 'decrease' || Number(direction) < 0
        ? -1
        : 0
  const nextChapter = adjustChapter(chapter, amount)

  if (amount === 0 || nextChapter === null) {
    throw createAppError('app/manual-chapter-required', 'Este capítulo debe editarse manualmente.')
  }

  return nextChapter
}

export async function changeMangaChapter(uid, mangaId, direction) {
  try {
    const documentReference = getMangaDocument(uid, mangaId)

    return await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(documentReference)

      if (!snapshot.exists()) {
        throw createAppError('app/invalid-manga', 'La obra ya no existe.')
      }

      const nextChapter = calculateNextChapter(snapshot.data().chapter, direction)
      transaction.update(documentReference, {
        chapter: nextChapter,
        updatedAt: serverTimestamp(),
      })

      return nextChapter
    })
  } catch (error) {
    throw toAppError(error, 'No se ha podido actualizar el capítulo.')
  }
}
