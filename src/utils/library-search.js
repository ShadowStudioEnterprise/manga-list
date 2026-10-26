const MAX_QUERY_LENGTH = 512

// Per-tab UI state only. Never store library documents, filters or credentials.
export function createLibrarySearchStorage(storage, project = 'unconfigured') {
  const key = `mangalist:library-search:v1:${project}`
  const clear = () => {
    try {
      storage()?.removeItem(key)
    } catch {
      // Disabled session storage must not prevent signing out or synchronization.
    }
  }
  return {
    clear,
    read(uid) {
      try {
        const raw = storage()?.getItem(key)
        if (!raw) return ''
        if (raw.length > 4096) throw Error('Invalid search')
        const item = JSON.parse(raw)
        if (
          item?.version !== 1 ||
          !uid ||
          item.uid !== uid ||
          typeof item.query !== 'string' ||
          item.query.length > MAX_QUERY_LENGTH
        )
          throw Error('Invalid search')
        return item.query
      } catch {
        clear()
        return ''
      }
    },
    write(uid, query) {
      if (!uid || typeof query !== 'string' || !query || query.length > MAX_QUERY_LENGTH) {
        clear()
        return
      }
      try {
        storage()?.setItem(key, JSON.stringify({ version: 1, uid, query }))
      } catch {
        // Keep the in-memory search when the browser denies persistence.
      }
    },
  }
}

export const librarySearchStorage = createLibrarySearchStorage(
  () => globalThis.sessionStorage,
  import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'unconfigured',
)
