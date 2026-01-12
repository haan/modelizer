const INVALID_FILENAME_CHARS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*'])

export const sanitizeFileName = (value) => {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  let sanitized = ''

  for (const char of trimmed) {
    const code = char.charCodeAt(0)
    if (code < 32 || INVALID_FILENAME_CHARS.has(char)) {
      sanitized += '-'
    } else {
      sanitized += char
    }
  }

  return sanitized.replace(/\s+/g, ' ').trim()
}
