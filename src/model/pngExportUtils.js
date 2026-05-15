import { AREA_NODE_TYPE, NOTE_NODE_TYPE } from './constants.js'

export const PNG_EXPORT_PADDING = 96
export const PNG_EXPORT_PIXEL_RATIO = 2
export const PNG_EXPORT_MAX_SIDE = 8192
export const PNG_EXPORT_MAX_PIXELS = 36_000_000

const DEFAULT_NODE_SIZE = { width: 220, height: 140 }
const DEFAULT_NOTE_SIZE = { width: 180, height: 80 }
const DEFAULT_AREA_SIZE = { width: 280, height: 180 }
const LINE_HEIGHT_RATIO = 1.3

function toFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function positiveNumber(...values) {
  for (const value of values) {
    const parsed = toFiniteNumber(value)
    if (parsed && parsed > 0) {
      return parsed
    }
  }
  return null
}

function getFallbackSize(node) {
  if (node?.type === AREA_NODE_TYPE) {
    return DEFAULT_AREA_SIZE
  }
  if (node?.type === NOTE_NODE_TYPE) {
    return DEFAULT_NOTE_SIZE
  }
  return DEFAULT_NODE_SIZE
}

function getNodePosition(node) {
  return (
    node?.positionAbsolute ??
    node?.internals?.positionAbsolute ??
    node?.position ??
    null
  )
}

function getNodeSize(node) {
  const fallback = getFallbackSize(node)
  return {
    width:
      positiveNumber(node?.width, node?.measured?.width, node?.style?.width) ??
      fallback.width,
    height:
      positiveNumber(node?.height, node?.measured?.height, node?.style?.height) ??
      fallback.height,
  }
}

function createMutableBounds() {
  return {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }
}

function extendBounds(bounds, x, y, width = 0, height = 0) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return bounds
  }

  bounds.minX = Math.min(bounds.minX, x)
  bounds.minY = Math.min(bounds.minY, y)
  bounds.maxX = Math.max(bounds.maxX, x + width)
  bounds.maxY = Math.max(bounds.maxY, y + height)
  return bounds
}

function extendPoint(bounds, point, radius = 0) {
  const x = toFiniteNumber(point?.x)
  const y = toFiniteNumber(point?.y)
  if (x === null || y === null) {
    return bounds
  }
  return extendBounds(bounds, x - radius, y - radius, radius * 2, radius * 2)
}

function boundsToRect(bounds, padding) {
  if (
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.maxY)
  ) {
    return null
  }

  const width = Math.max(1, bounds.maxX - bounds.minX + padding * 2)
  const height = Math.max(1, bounds.maxY - bounds.minY + padding * 2)
  return {
    x: bounds.minX - padding,
    y: bounds.minY - padding,
    width,
    height,
  }
}

function extendNodeBounds(bounds, nodes) {
  nodes.forEach((node) => {
    if (!node || node.hidden) {
      return
    }
    const position = getNodePosition(node)
    if (!position) {
      return
    }
    const size = getNodeSize(node)
    extendBounds(bounds, position.x, position.y, size.width, size.height)
  })
}

function extendEdgeHintBounds(bounds, edges) {
  edges.forEach((edge) => {
    const controlPoints = Array.isArray(edge?.data?.controlPoints)
      ? edge.data.controlPoints
      : []
    controlPoints.forEach((point) => extendPoint(bounds, point, 32))
  })
}

function getAnnotationItems({ annotations, activeView, currentStroke }) {
  const savedItems = annotations?.[activeView]?.items
  const items = Array.isArray(savedItems) ? [...savedItems] : []
  if (currentStroke) {
    items.push(currentStroke)
  }
  return items
}

function extendAnnotationBounds(bounds, items) {
  items.forEach((item) => {
    if (item?.kind === 'stroke') {
      const radius = Math.max(1, (toFiniteNumber(item.thickness) ?? 1) / 2)
      const points = Array.isArray(item.points) ? item.points : []
      points.forEach((point) => extendPoint(bounds, point, radius))
      return
    }

    if (item?.kind === 'text' && typeof item.text === 'string') {
      const x = toFiniteNumber(item.x)
      const y = toFiniteNumber(item.y)
      const fontSize = positiveNumber(item.fontSize) ?? 14
      if (x === null || y === null) {
        return
      }

      const lines = item.text.split('\n')
      const longestLine = lines.reduce(
        (max, line) => Math.max(max, line.length),
        0,
      )
      const lineHeight = fontSize * LINE_HEIGHT_RATIO
      const width = Math.max(fontSize * 2, longestLine * fontSize * 0.62)
      const height = Math.max(lineHeight, lines.length * lineHeight)
      extendBounds(bounds, x, y - fontSize * 0.95, width, height)
    }
  })
}

export function getPngExportContentBounds({
  nodes = [],
  edges = [],
  annotations = null,
  activeView = 'conceptual',
  includeAnnotations = false,
  currentStroke = null,
  padding = PNG_EXPORT_PADDING,
} = {}) {
  const bounds = createMutableBounds()
  extendNodeBounds(bounds, Array.isArray(nodes) ? nodes : [])
  extendEdgeHintBounds(bounds, Array.isArray(edges) ? edges : [])

  if (includeAnnotations) {
    extendAnnotationBounds(
      bounds,
      getAnnotationItems({ annotations, activeView, currentStroke }),
    )
  }

  return boundsToRect(bounds, padding)
}

export function getPngExportPixelRatio(
  width,
  height,
  {
    baseRatio = PNG_EXPORT_PIXEL_RATIO,
    maxSide = PNG_EXPORT_MAX_SIDE,
    maxPixels = PNG_EXPORT_MAX_PIXELS,
  } = {},
) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 1
  }

  const sideRatio = maxSide / Math.max(width, height)
  const areaRatio = Math.sqrt(maxPixels / (width * height))
  return Math.max(0.1, Math.min(baseRatio, sideRatio, areaRatio))
}

export function getPngExportDimensions(bounds, fallbackWidth, fallbackHeight) {
  const width = Math.ceil(bounds?.width ?? fallbackWidth ?? 1)
  const height = Math.ceil(bounds?.height ?? fallbackHeight ?? 1)
  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  }
}
