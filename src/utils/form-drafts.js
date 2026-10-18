const PREFIX = 'mangalist:form-draft:v1:'
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000
export const MAX_DRAFTS = 10
export const MAX_DRAFT_LENGTH = 80_000

// Browser data is untrusted. Persist only editable form fields, never tokens or document metadata.
export function draftValue(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid draft')
  const result = {}
  for (const field of ['name', 'chapter', 'type', 'readingStatus', 'publicationStatus', 'notes']) {
    if (typeof value[field] !== 'string' || value[field].length > 5000)
      throw new Error('Invalid draft')
    result[field] = value[field]
  }
  if (typeof value.favorite !== 'boolean') throw new Error('Invalid draft')
  result.favorite = value.favorite
  if (!Array.isArray(value.genres) || value.genres.length > 20) throw new Error('Invalid draft')
  result.genres = value.genres.map((genre) => {
    if (typeof genre !== 'string' || genre.length > 60) throw new Error('Invalid draft')
    return genre
  })
  if (!Array.isArray(value.sources) || value.sources.length > 10) throw new Error('Invalid draft')
  result.sources = value.sources.map((source) => {
    if (!source || typeof source.isPrimary !== 'boolean') throw new Error('Invalid draft')
    const entry = { isPrimary: source.isPrimary }
    for (const key of ['id', 'name', 'url']) {
      if (typeof source[key] !== 'string' || source[key].length > 2048)
        throw new Error('Invalid draft')
      entry[key] = source[key]
    }
    return entry
  })
  return result
}

export function createDraftStorage(storage, now = Date.now) {
  const keyFor = (uid, scope) => {
    if (!uid || !scope) throw new Error('Missing draft owner')
    return PREFIX + JSON.stringify([uid, scope])
  }
  function keys() {
    return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key) =>
      key?.startsWith(PREFIX),
    )
  }
  function readKey(key) {
    try {
      const raw = storage.getItem(key)
      if (!raw) return null
      if (raw.length > MAX_DRAFT_LENGTH) throw new Error('Oversized draft')
      const item = JSON.parse(raw)
      if (
        item.version !== 1 ||
        !Number.isFinite(item.savedAt) ||
        item.savedAt > now() ||
        now() - item.savedAt >= DRAFT_TTL_MS
      )
        throw new Error('Expired draft')
      return { ...item, value: draftValue(item.value), baseline: draftValue(item.baseline) }
    } catch {
      storage.removeItem(key)
      return null
    }
  }
  return {
    read(uid, scope) {
      return readKey(keyFor(uid, scope))
    },
    write(uid, scope, value, baseline) {
      const key = keyFor(uid, scope)
      for (const stored of keys()) readKey(stored)
      if (!storage.getItem(key) && keys().length >= MAX_DRAFTS)
        throw new Error('Draft limit reached')
      const raw = JSON.stringify({
        version: 1,
        savedAt: now(),
        value: draftValue(value),
        baseline: draftValue(baseline),
      })
      if (raw.length > MAX_DRAFT_LENGTH) throw new Error('Oversized draft')
      storage.setItem(key, raw)
    },
    remove(uid, scope) {
      storage.removeItem(keyFor(uid, scope))
    },
    clear() {
      for (const key of keys()) storage.removeItem(key)
    },
  }
}

export function browserDraftStorage() {
  return createDraftStorage(window.sessionStorage)
}

export function clearBrowserDrafts() {
  try {
    browserDraftStorage().clear()
  } catch {
    // Disabled browser storage must never prevent signing out.
  }
}
