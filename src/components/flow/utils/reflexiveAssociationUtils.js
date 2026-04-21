const REFLEXIVE_INSET_LIMIT = 40
const REFLEXIVE_CORNER_RADIUS = 5
const REFLEXIVE_MIN_SEGMENT = 12
const REFLEXIVE_SIDE_LEFT = 'left'
const REFLEXIVE_SIDE_RIGHT = 'right'

function getNodePosition(node) {
  return (
    node?.internals?.positionAbsolute ??
    node?.positionAbsolute ??
    node?.position ??
    null
  )
}

function getNodeSize(node) {
  const width = node?.measured?.width ?? node?.width ?? 0
  const height = node?.measured?.height ?? node?.height ?? 0
  return { width, height }
}

function normalizePositive(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

export function getRoundedPolylinePath(points, cornerRadius = 0) {
  if (!Array.isArray(points) || points.length === 0) {
    return ''
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`
  }

  const radius = Math.max(0, Number(cornerRadius) || 0)
  if (radius === 0) {
    return points.reduce((result, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`
      }
      return `${result} L ${point.x} ${point.y}`
    }, '')
  }

  let path = `M ${points[0].x} ${points[0].y}`

  for (let index = 1; index < points.length - 1; index += 1) {
    const prev = points[index - 1]
    const current = points[index]
    const next = points[index + 1]

    const incomingDx = prev.x - current.x
    const incomingDy = prev.y - current.y
    const outgoingDx = next.x - current.x
    const outgoingDy = next.y - current.y
    const incomingLength = Math.hypot(incomingDx, incomingDy)
    const outgoingLength = Math.hypot(outgoingDx, outgoingDy)

    if (incomingLength === 0 || outgoingLength === 0) {
      path = `${path} L ${current.x} ${current.y}`
      continue
    }

    const cornerClamp = Math.min(radius, incomingLength / 2, outgoingLength / 2)
    if (cornerClamp <= 0) {
      path = `${path} L ${current.x} ${current.y}`
      continue
    }

    const entryX = current.x + (incomingDx / incomingLength) * cornerClamp
    const entryY = current.y + (incomingDy / incomingLength) * cornerClamp
    const exitX = current.x + (outgoingDx / outgoingLength) * cornerClamp
    const exitY = current.y + (outgoingDy / outgoingLength) * cornerClamp

    path = `${path} L ${entryX} ${entryY}`
    path = `${path} Q ${current.x} ${current.y} ${exitX} ${exitY}`
  }

  const last = points[points.length - 1]
  path = `${path} L ${last.x} ${last.y}`
  return path
}

export function getReflexiveSide(data) {
  if (data?.reflexiveSide === REFLEXIVE_SIDE_RIGHT) {
    return REFLEXIVE_SIDE_RIGHT
  }
  if (data?.reflexiveSide === REFLEXIVE_SIDE_LEFT) {
    return REFLEXIVE_SIDE_LEFT
  }

  const reflexiveIndex = Number.isFinite(data?.reflexiveIndex)
    ? Number(data.reflexiveIndex)
    : 0
  return reflexiveIndex === 1 ? REFLEXIVE_SIDE_RIGHT : REFLEXIVE_SIDE_LEFT
}

export function getReflexiveNodeRect(node) {
  const position = getNodePosition(node)
  const { width, height } = getNodeSize(node)

  if (
    !position ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }

  return { x: position.x, y: position.y, width, height }
}

export function getReflexiveAssociationLayout(sourceNode, data = {}) {
  const rect = getReflexiveNodeRect(sourceNode)
  if (!rect) {
    return null
  }

  const side = getReflexiveSide(data)
  const horizontalInset = Math.min(REFLEXIVE_INSET_LIMIT, rect.width / 4)
  const verticalInset = Math.min(REFLEXIVE_INSET_LIMIT, rect.height / 4)
  const startAnchor = {
    x: side === REFLEXIVE_SIDE_RIGHT ? rect.x + rect.width : rect.x,
    y: rect.y + verticalInset,
  }
  const endAnchor = {
    x:
      side === REFLEXIVE_SIDE_RIGHT
        ? startAnchor.x - horizontalInset
        : startAnchor.x + horizontalInset,
    y: rect.y,
  }

  const minLoopWidth = REFLEXIVE_MIN_SEGMENT
  const minLoopHeight = Math.max(
    REFLEXIVE_MIN_SEGMENT,
    verticalInset + REFLEXIVE_MIN_SEGMENT,
  )
  const defaultLoopWidth = Math.max(minLoopWidth, horizontalInset)
  const defaultLoopHeight = Math.max(minLoopHeight, verticalInset * 2)
  const loopWidth = Math.max(
    minLoopWidth,
    normalizePositive(data?.loopWidth) ?? defaultLoopWidth,
  )
  const loopHeight = Math.max(
    minLoopHeight,
    normalizePositive(data?.loopHeight) ?? defaultLoopHeight,
  )

  const outerX =
    side === REFLEXIVE_SIDE_RIGHT
      ? startAnchor.x + loopWidth
      : startAnchor.x - loopWidth
  const topY = startAnchor.y - loopHeight
  const pathPoints = [
    startAnchor,
    { x: outerX, y: startAnchor.y },
    { x: outerX, y: topY },
    { x: endAnchor.x, y: topY },
    endAnchor,
  ]
  const topSegmentCenter = {
    x: (outerX + endAnchor.x) / 2,
    y: topY,
  }
  const outerSegmentCenter = {
    x: outerX,
    y: (startAnchor.y + topY) / 2,
  }

  return {
    side,
    rect,
    edgePath: getRoundedPolylinePath(pathPoints, REFLEXIVE_CORNER_RADIUS),
    pathPoints,
    startAnchor,
    endAnchor,
    loopWidth,
    loopHeight,
    minLoopWidth,
    minLoopHeight,
    outerX,
    topY,
    topSegmentCenter,
    outerSegmentCenter,
    helperAnchor: topSegmentCenter,
    resizeHandles: [
      {
        key: 'width',
        axis: 'x',
        x: outerSegmentCenter.x,
        y: outerSegmentCenter.y,
      },
      {
        key: 'height',
        axis: 'y',
        x: topSegmentCenter.x,
        y: topSegmentCenter.y,
      },
    ],
  }
}

