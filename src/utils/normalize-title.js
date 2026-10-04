const COMBINING_MARK = /\p{Mark}/u
const LATIN_CHARACTER = /\p{Script=Latin}/u
const NON_ALPHANUMERIC = /[^\p{Letter}\p{Number}]+/gu
const EDGE_SEPARATORS = /^-+|-+$/g

function removeLatinDiacritics(value) {
  let result = ''
  let previousBaseIsLatin = false

  for (const character of value.normalize('NFKD')) {
    if (COMBINING_MARK.test(character)) {
      if (!previousBaseIsLatin) result += character
      continue
    }

    result += character
    previousBaseIsLatin = LATIN_CHARACTER.test(character)
  }

  return result.normalize('NFC')
}

/**
 * Creates the stable value stored in `normalizedName` and used by search and
 * duplicate detection. Unicode letters and numbers are preserved so titles in
 * non-Latin alphabets remain searchable.
 */
export function normalizeTitle(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return removeLatinDiacritics(String(value))
    .toLocaleLowerCase('es')
    .trim()
    .replace(NON_ALPHANUMERIC, '-')
    .replace(EDGE_SEPARATORS, '')
}

export function titlesMatch(firstTitle, secondTitle) {
  const first = normalizeTitle(firstTitle)
  return first !== '' && first === normalizeTitle(secondTitle)
}
