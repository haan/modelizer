export const CLASS_COLOR_PALETTE = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
]

export function getPaletteColor(index) {
  if (!CLASS_COLOR_PALETTE.length) {
    return '#8eb7ff'
  }
  const safeIndex = Math.abs(index) % CLASS_COLOR_PALETTE.length
  return CLASS_COLOR_PALETTE[safeIndex]
}

export function getRandomPaletteColor() {
  if (!CLASS_COLOR_PALETTE.length) {
    return '#8eb7ff'
  }
  const index = Math.floor(Math.random() * CLASS_COLOR_PALETTE.length)
  return CLASS_COLOR_PALETTE[index]
}
