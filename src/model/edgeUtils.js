import {
  ASSOCIATION_LINE_STYLE_ORTHOGONAL,
  ASSOCIATION_LINE_STYLE_MANUAL,
  ASSOCIATION_LINE_STYLE_STRAIGHT,
  ASSOCIATION_EDGE_TYPE,
  COMPOSITION_EDGE_TYPE,
  REFLEXIVE_EDGE_TYPE,
  RELATIONSHIP_EDGE_TYPE,
} from './constants.js'

const REFLEXIVE_SIDE_LEFT = 'left'
const REFLEXIVE_SIDE_RIGHT = 'right'

export function normalizeControlPoints(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => ({
      x: Number(entry?.x),
      y: Number(entry?.y),
    }))
    .filter((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.y))
}

export function normalizePositiveNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

export function normalizeReflexiveSide(value) {
  if (value === REFLEXIVE_SIDE_RIGHT) {
    return REFLEXIVE_SIDE_RIGHT
  }
  if (value === REFLEXIVE_SIDE_LEFT) {
    return REFLEXIVE_SIDE_LEFT
  }
  return null
}

export function getOppositeReflexiveSide(side) {
  return side === REFLEXIVE_SIDE_RIGHT
    ? REFLEXIVE_SIDE_LEFT
    : REFLEXIVE_SIDE_RIGHT
}

function getLegacyReflexiveSide(edge, fallbackIndex = 0) {
  const rawIndex = Number.isFinite(edge?.data?.reflexiveIndex)
    ? Number(edge.data.reflexiveIndex)
    : Number(fallbackIndex)
  return Math.abs(rawIndex % 2) === 1
    ? REFLEXIVE_SIDE_RIGHT
    : REFLEXIVE_SIDE_LEFT
}

function assignReflexiveSides(orderedEdges) {
  const sideById = new Map()
  const usedSides = new Set()

  orderedEdges.forEach((edge) => {
    const side = normalizeReflexiveSide(edge.data?.reflexiveSide)
    if (!side || usedSides.has(side)) {
      return
    }

    sideById.set(edge.id, side)
    usedSides.add(side)
  })

  orderedEdges.forEach((edge, index) => {
    if (sideById.has(edge.id)) {
      return
    }

    const preferredSide = getLegacyReflexiveSide(edge, index)
    if (usedSides.has(preferredSide)) {
      return
    }

    sideById.set(edge.id, preferredSide)
    usedSides.add(preferredSide)
  })

  orderedEdges.forEach((edge, index) => {
    if (sideById.has(edge.id)) {
      return
    }

    const preferredSide = getLegacyReflexiveSide(edge, index)
    const oppositeSide = getOppositeReflexiveSide(preferredSide)
    const resolvedSide = usedSides.has(preferredSide) && !usedSides.has(oppositeSide)
      ? oppositeSide
      : preferredSide

    sideById.set(edge.id, resolvedSide)
    usedSides.add(resolvedSide)
  })

  return sideById
}

function normalizeAssociationEdgeLineStyle(edge) {
  if (
    edge.type !== ASSOCIATION_EDGE_TYPE &&
    edge.type !== COMPOSITION_EDGE_TYPE &&
    edge.type !== RELATIONSHIP_EDGE_TYPE
  ) {
    return edge
  }

  const currentData = edge.data ?? {}
  const normalizedLineStyle =
    currentData.lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT
      ? ASSOCIATION_LINE_STYLE_STRAIGHT
      : currentData.lineStyle === ASSOCIATION_LINE_STYLE_MANUAL
        ? ASSOCIATION_LINE_STYLE_MANUAL
        : ASSOCIATION_LINE_STYLE_ORTHOGONAL
  const normalizedControlPoints = normalizeControlPoints(currentData.controlPoints)
  const hasSameControlPoints =
    Array.isArray(currentData.controlPoints) &&
    currentData.controlPoints.length === normalizedControlPoints.length &&
    currentData.controlPoints.every((entry, index) => {
      const nextEntry = normalizedControlPoints[index]
      return entry?.x === nextEntry.x && entry?.y === nextEntry.y
    })

  if (currentData.lineStyle === normalizedLineStyle && hasSameControlPoints) {
    return edge
  }

  return {
    ...edge,
    data: {
      ...currentData,
      lineStyle: normalizedLineStyle,
      controlPoints: normalizedControlPoints,
    },
  }
}

function getFloatingGroupKey(edge) {
  if (!edge.source || !edge.target) {
    return null
  }

  const [first, second] =
    edge.source < edge.target
      ? [edge.source, edge.target]
      : [edge.target, edge.source]

  return `${first}|${second}`
}

function recomputeFloatingEdgeParallels(edges) {
  const groups = new Map()

  edges.forEach((edge) => {
    if (
      edge.type !== ASSOCIATION_EDGE_TYPE &&
      edge.type !== COMPOSITION_EDGE_TYPE
    ) {
      return
    }

    const key = getFloatingGroupKey(edge)
    if (!key) {
      return
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups.get(key).push(edge)
  })

  const metaById = new Map()
  groups.forEach((group) => {
    const ordered = [...group].sort((a, b) =>
      String(a.id).localeCompare(String(b.id)),
    )
    ordered.forEach((edge, index) => {
      metaById.set(edge.id, {
        parallelIndex: index,
        parallelCount: ordered.length,
      })
    })
  })

  let didChange = false
  const nextEdges = edges.map((edge) => {
    if (
      edge.type !== ASSOCIATION_EDGE_TYPE &&
      edge.type !== COMPOSITION_EDGE_TYPE
    ) {
      return edge
    }

    const meta = metaById.get(edge.id)
    if (!meta) {
      return edge
    }

    const currentIndex = edge.data?.parallelIndex
    const currentCount = edge.data?.parallelCount
    if (currentIndex !== meta.parallelIndex || currentCount !== meta.parallelCount) {
      didChange = true
    }

    return {
      ...edge,
      data: {
        ...(edge.data ?? {}),
        parallelIndex: meta.parallelIndex,
        parallelCount: meta.parallelCount,
      },
    }
  })

  return didChange ? nextEdges : edges
}

export function normalizeEdges(edges) {
  const withLineStyles = edges.map(normalizeAssociationEdgeLineStyle)
  const withParallels = recomputeFloatingEdgeParallels(withLineStyles)
  return recomputeReflexiveEdgeIndices(withParallels)
}

function recomputeReflexiveEdgeIndices(edges) {
  const groups = new Map()

  edges.forEach((edge) => {
    if (edge.type !== REFLEXIVE_EDGE_TYPE) {
      return
    }

    if (!edge.source) {
      return
    }

    if (!groups.has(edge.source)) {
      groups.set(edge.source, [])
    }

    groups.get(edge.source).push(edge)
  })

  const metaById = new Map()
  groups.forEach((group) => {
    const ordered = [...group].sort((a, b) => {
      const aIndex = Number.isFinite(a.data?.reflexiveIndex)
        ? a.data.reflexiveIndex
        : Number.POSITIVE_INFINITY
      const bIndex = Number.isFinite(b.data?.reflexiveIndex)
        ? b.data.reflexiveIndex
        : Number.POSITIVE_INFINITY

      if (aIndex !== bIndex) {
        return aIndex - bIndex
      }

      return String(a.id).localeCompare(String(b.id))
    })
    const sideById = assignReflexiveSides(ordered)

    ordered.forEach((edge, index) => {
      metaById.set(edge.id, {
        reflexiveIndex: index,
        reflexiveCount: ordered.length,
        reflexiveSide: sideById.get(edge.id) ?? getLegacyReflexiveSide(edge, index),
      })
    })
  })

  let didChange = false
  const nextEdges = edges.map((edge) => {
    if (edge.type !== REFLEXIVE_EDGE_TYPE) {
      return edge
    }

    const meta = metaById.get(edge.id)
    if (!meta) {
      return edge
    }

    const currentIndex = edge.data?.reflexiveIndex
    const currentCount = edge.data?.reflexiveCount
    const currentSide = edge.data?.reflexiveSide
    const currentHasLoopWidth =
      edge.data != null &&
      Object.prototype.hasOwnProperty.call(edge.data, 'loopWidth')
    const currentHasLoopHeight =
      edge.data != null &&
      Object.prototype.hasOwnProperty.call(edge.data, 'loopHeight')
    const nextLoopWidth = normalizePositiveNumber(edge.data?.loopWidth)
    const nextLoopHeight = normalizePositiveNumber(edge.data?.loopHeight)
    const loopWidthChanged =
      currentHasLoopWidth !== (nextLoopWidth !== undefined) ||
      (nextLoopWidth !== undefined && edge.data?.loopWidth !== nextLoopWidth)
    const loopHeightChanged =
      currentHasLoopHeight !== (nextLoopHeight !== undefined) ||
      (nextLoopHeight !== undefined && edge.data?.loopHeight !== nextLoopHeight)
    if (
      currentIndex !== meta.reflexiveIndex ||
      currentCount !== meta.reflexiveCount ||
      currentSide !== meta.reflexiveSide ||
      loopWidthChanged ||
      loopHeightChanged
    ) {
      didChange = true
    }

    const {
      reflexiveIndex: _reflexiveIndex,
      reflexiveCount: _reflexiveCount,
      reflexiveSide: _reflexiveSide,
      loopWidth: _loopWidth,
      loopHeight: _loopHeight,
      ...restData
    } = edge.data ?? {}
    const nextData = {
      ...restData,
      reflexiveIndex: meta.reflexiveIndex,
      reflexiveCount: meta.reflexiveCount,
      reflexiveSide: meta.reflexiveSide,
    }
    if (nextLoopWidth !== undefined) {
      nextData.loopWidth = nextLoopWidth
    }
    if (nextLoopHeight !== undefined) {
      nextData.loopHeight = nextLoopHeight
    }

    return {
      ...edge,
      data: nextData,
    }
  })

  return didChange ? nextEdges : edges
}
