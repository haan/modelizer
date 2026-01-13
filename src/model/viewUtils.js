import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from './constants.js'

export const DEFAULT_VIEW_VISIBILITY = {
  conceptual: true,
  logical: true,
  physical: true,
}

const normalizePosition = (position, fallback) => {
  if (
    position &&
    typeof position.x === 'number' &&
    typeof position.y === 'number'
  ) {
    return { x: position.x, y: position.y }
  }
  return { x: fallback.x, y: fallback.y }
}

export const normalizeVisibility = (visibility) => ({
  conceptual:
    typeof visibility?.conceptual === 'boolean'
      ? visibility.conceptual
      : DEFAULT_VIEW_VISIBILITY.conceptual,
  logical:
    typeof visibility?.logical === 'boolean'
      ? visibility.logical
      : DEFAULT_VIEW_VISIBILITY.logical,
  physical:
    typeof visibility?.physical === 'boolean'
      ? visibility.physical
      : DEFAULT_VIEW_VISIBILITY.physical,
})

export const normalizeViewPositions = (viewPositions, fallbackPosition) => {
  const fallback = normalizePosition(
    fallbackPosition ?? { x: 0, y: 0 },
    { x: 0, y: 0 },
  )
  return {
    [VIEW_CONCEPTUAL]: normalizePosition(viewPositions?.[VIEW_CONCEPTUAL], fallback),
    [VIEW_LOGICAL]: normalizePosition(viewPositions?.[VIEW_LOGICAL], fallback),
    [VIEW_PHYSICAL]: normalizePosition(viewPositions?.[VIEW_PHYSICAL], fallback),
  }
}
