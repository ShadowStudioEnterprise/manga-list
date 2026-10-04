import { normalizeChapter } from './chapter-utils.js'
import { isValidHttpUrl } from './validators.js'

const CHAPTER_PATTERN =
  /(?:^|[\s/_\-\u2013\u2014[(])(?:cap(?:[ií]tulo)?|chapter|chap|ch)\s*[-_:#/]?\s*(\d+(?:\.\d+)?)(?=$|[^\d])/iu

function decodeSafely(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function toSearchParams(input) {
  if (input instanceof URLSearchParams) {
    return new URLSearchParams(input)
  }

  const value = String(input ?? '').trim()
  if (value === '') return new URLSearchParams()

  try {
    if (/^https?:\/\//i.test(value)) {
      return new URL(value).searchParams
    }
  } catch {
    // Fall through and treat the value as a raw query string.
  }

  const queryStart = value.indexOf('?')
  const query = queryStart >= 0 ? value.slice(queryStart + 1) : value.replace(/^\?/, '')
  return new URLSearchParams(query)
}

export function detectChapterFromText(value) {
  const match = decodeSafely(String(value ?? '')).match(CHAPTER_PATTERN)
  return match?.[1] ?? ''
}

export function detectChapterFromBookmarklet({ title = '', url = '' } = {}) {
  if (url) {
    try {
      const parsedUrl = new URL(url)
      const pathChapter = detectChapterFromText(parsedUrl.pathname)
      if (pathChapter) return pathChapter
    } catch {
      const rawUrlChapter = detectChapterFromText(url)
      if (rawUrlChapter) return rawUrlChapter
    }
  }

  return detectChapterFromText(title)
}

export function parseBookmarkletParams(input) {
  const params = toSearchParams(input)
  const title = String(params.get('title') ?? params.get('name') ?? '').trim()
  const url = String(params.get('url') ?? '').trim()
  const explicitChapter = normalizeChapter(params.get('chapter'))

  return {
    title,
    url,
    chapter: explicitChapter || detectChapterFromBookmarklet({ title, url }),
  }
}

export function createMangaPrefillFromBookmarklet(input) {
  const { title, url, chapter } = parseBookmarkletParams(input)
  const safeUrl = isValidHttpUrl(url) ? url : ''

  return {
    name: title,
    chapter,
    sources: safeUrl
      ? [
          {
            id: globalThis.crypto?.randomUUID?.() ?? `bookmarklet-source-${Date.now()}`,
            name: 'Fuente principal',
            url: safeUrl,
            isPrimary: true,
          },
        ]
      : [],
  }
}

/**
 * Builds the string the user can save as a browser bookmark. `addPageUrl`
 * should point to MangaList's `/add` route.
 */
export function buildBookmarkletCode(addPageUrl) {
  if (!isValidHttpUrl(addPageUrl)) {
    throw new TypeError('La URL de MangaList debe comenzar por http:// o https://.')
  }

  const target = JSON.stringify(String(addPageUrl).trim())
  return `javascript:(()=>{const t=${target};const q=new URLSearchParams({title:document.title,url:location.href});window.open(t+(t.includes('?')?'&':'?')+q.toString(),'_blank','noopener,noreferrer')})()`
}
