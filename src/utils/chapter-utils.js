const NUMERIC_CHAPTER_PATTERN = /^(\d+)(\.\d+)?$/

export function normalizeChapter(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

export function isNumericChapter(value) {
  return NUMERIC_CHAPTER_PATTERN.test(normalizeChapter(value))
}

/**
 * Changes only the integer part of a numeric chapter. This intentionally turns
 * 24.5 into 25.5 and preserves formatting such as 001 -> 002.
 * Returns null when changing the value would be unsafe.
 */
export function adjustChapter(value, amount) {
  const chapter = normalizeChapter(value)
  const match = chapter.match(NUMERIC_CHAPTER_PATTERN)

  if (!match || !Number.isSafeInteger(amount)) {
    return null
  }

  const integerPart = BigInt(match[1])
  const nextInteger = integerPart + BigInt(amount)

  if (nextInteger < 0n) {
    return null
  }

  const paddedInteger = nextInteger.toString().padStart(match[1].length, '0')
  return `${paddedInteger}${match[2] ?? ''}`
}

export function incrementChapter(value) {
  return adjustChapter(value, 1)
}

export function decrementChapter(value) {
  return adjustChapter(value, -1)
}

export function chapterToSortableNumber(value) {
  const chapter = normalizeChapter(value)
  return isNumericChapter(chapter) ? Number(chapter) : null
}

export function compareChapters(first, second) {
  const firstNumber = chapterToSortableNumber(first)
  const secondNumber = chapterToSortableNumber(second)

  if (firstNumber !== null && secondNumber !== null) {
    return firstNumber - secondNumber
  }

  if (firstNumber !== null) return 1
  if (secondNumber !== null) return -1

  return normalizeChapter(first).localeCompare(normalizeChapter(second), 'es', {
    numeric: true,
    sensitivity: 'base',
  })
}
