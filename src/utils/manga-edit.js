const EDITABLE_FIELDS = [
  'name',
  'chapter',
  'type',
  'genres',
  'readingStatus',
  'publicationStatus',
  'sources',
  'notes',
  'favorite',
]

// These fields contain JSON data. Compare maps independently of their key order.
export function sameMangaValue(left, right) {
  if (left === right) return true
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false
  if (Array.isArray(left) !== Array.isArray(right)) return false
  const keys = Object.keys(left)
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && sameMangaValue(left[key], right[key]))
  )
}

export function createMangaEdit(value, baseline) {
  const patch = {}
  const expectedValues = {}
  for (const key of EDITABLE_FIELDS) {
    if (Object.hasOwn(value, key) && !sameMangaValue(value[key], baseline[key])) {
      patch[key] = value[key]
      expectedValues[key] = baseline[key]
    }
  }
  return { patch, expectedValues }
}

export function conflictingMangaFields(current, patch, expectedValues) {
  return Object.keys(expectedValues).filter(
    (key) =>
      Object.hasOwn(patch, key) &&
      !sameMangaValue(current[key], expectedValues[key]) &&
      !sameMangaValue(current[key], patch[key]),
  )
}
