import { Position, getSmoothStepPath, getStraightPath } from 'reactflow'
import {
  ASSOCIATION_LINE_STYLE_MANUAL,
  ASSOCIATION_LINE_STYLE_ORTHOGONAL,
  ASSOCIATION_LINE_STYLE_STRAIGHT,
  RELATIONSHIP_EDGE_STUB_DISTANCE,
} from '../../../model/constants.js'

const MANUAL_CORNER_RADIUS = 5

export function normalizeLineStyle(value) {
  return value === ASSOCIATION_LINE_STYLE_STRAIGHT
    ? ASSOCIATION_LINE_STYLE_STRAIGHT
    : value === ASSOCIATION_LINE_STYLE_MANUAL
      ? ASSOCIATION_LINE_STYLE_MANUAL
      : ASSOCIATION_LINE_STYLE_ORTHOGONAL
}

export function normalizeRelationshipControlPoints(value) {
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

function normalizePosition(value, fallback = null) {
  if (value === Position.Left || value === 'left') {
    return Position.Left
  }
  if (value === Position.Right || value === 'right') {
    return Position.Right
  }
  if (value === Position.Top || value === 'top') {
    return Position.Top
  }
  if (value === Position.Bottom || value === 'bottom') {
    return Position.Bottom
  }

  return fallback
}

export function getOrthogonalIncomingDirection(
  sourceX,
  sourceY,
  targetX,
  targetY,
  targetPosition,
) {
  const byPosition =
    targetPosition === Position.Left
      ? { x: 1, y: 0 }
      : targetPosition === Position.Right
        ? { x: -1, y: 0 }
        : targetPosition === Position.Top
          ? { x: 0, y: 1 }
          : targetPosition === Position.Bottom
            ? { x: 0, y: -1 }
            : null
  if (byPosition) {
    return byPosition
  }

  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const length = Math.hypot(dx, dy) || 1
  return { x: dx / length, y: dy / length }
}

export function dedupeConsecutivePoints(points) {
  return points.filter((point, index) => {
    if (index === 0) {
      return true
    }

    const previous = points[index - 1]
    return previous.x !== point.x || previous.y !== point.y
  })
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

export function getRelationshipLayout({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  if (
    !Number.isFinite(sourceX) ||
    !Number.isFinite(sourceY) ||
    !Number.isFinite(targetX) ||
    !Number.isFinite(targetY)
  ) {
    return null
  }

  const lineStyle = normalizeLineStyle(data?.lineStyle)
  const controlPoints = normalizeRelationshipControlPoints(data?.controlPoints)
  const resolvedSourcePosition = normalizePosition(sourcePosition, Position.Right)
  const resolvedTargetPosition = normalizePosition(targetPosition, Position.Left)
  const sourceAnchor = { x: sourceX, y: sourceY }
  const targetAnchor = { x: targetX, y: targetY }
  const isManualRouting =
    lineStyle === ASSOCIATION_LINE_STYLE_MANUAL || controlPoints.length > 0

  if (isManualRouting) {
    const pathPoints = dedupeConsecutivePoints([
      sourceAnchor,
      ...controlPoints,
      targetAnchor,
    ])
    const pointBeforeTarget = pathPoints[pathPoints.length - 2] ?? sourceAnchor

    return {
      edgePath: getRoundedPolylinePath(pathPoints, MANUAL_CORNER_RADIUS),
      pathPoints,
      controlPoints,
      lineStyle,
      isManualRouting: true,
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: resolvedSourcePosition,
      targetPosition: resolvedTargetPosition,
      incomingDx: targetAnchor.x - pointBeforeTarget.x,
      incomingDy: targetAnchor.y - pointBeforeTarget.y,
    }
  }

  if (lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT) {
    const [edgePath] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })
    return {
      edgePath,
      pathPoints: [sourceAnchor, targetAnchor],
      controlPoints,
      lineStyle,
      isManualRouting: false,
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: resolvedSourcePosition,
      targetPosition: resolvedTargetPosition,
      incomingDx: targetX - sourceX,
      incomingDy: targetY - sourceY,
    }
  }

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: resolvedSourcePosition,
    targetX,
    targetY,
    targetPosition: resolvedTargetPosition,
    offset: RELATIONSHIP_EDGE_STUB_DISTANCE,
  })
  const incomingDirection = getOrthogonalIncomingDirection(
    sourceX,
    sourceY,
    targetX,
    targetY,
    resolvedTargetPosition,
  )

  return {
    edgePath,
    pathPoints: [sourceAnchor, targetAnchor],
    controlPoints,
    lineStyle,
    isManualRouting: false,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: resolvedSourcePosition,
    targetPosition: resolvedTargetPosition,
    incomingDx: incomingDirection.x,
    incomingDy: incomingDirection.y,
  }
}

function getNodePosition(node) {
  return node?.internals?.positionAbsolute ?? node?.position ?? { x: 0, y: 0 }
}

function getNodeMeasured(node) {
  return node?.measured ?? {
    width: node?.width ?? 0,
    height: node?.height ?? 0,
  }
}

function getFallbackHandlePosition(handleId) {
  if (typeof handleId !== 'string') {
    return null
  }
  if (handleId.startsWith('left-')) {
    return Position.Left
  }
  if (handleId.startsWith('right-')) {
    return Position.Right
  }
  if (handleId.startsWith('top-')) {
    return Position.Top
  }
  if (handleId.startsWith('bottom-')) {
    return Position.Bottom
  }
  return null
}

function getHandleAnchor(node, handleType, handleId) {
  const handles = node?.internals?.handleBounds?.[handleType]
  if (!Array.isArray(handles) || !handleId) {
    return null
  }

  const handle = handles.find((entry) => entry?.id === handleId)
  if (!handle) {
    return null
  }

  const nodePosition = getNodePosition(node)
  const x = Number.isFinite(handle.x) ? handle.x : 0
  const y = Number.isFinite(handle.y) ? handle.y : 0
  const width = Number.isFinite(handle.width) ? handle.width : 0
  const height = Number.isFinite(handle.height) ? handle.height : 0
  const resolvedPosition = normalizePosition(
    handle.position,
    getFallbackHandlePosition(handleId),
  )

  return {
    x: nodePosition.x + x + width / 2,
    y: nodePosition.y + y + height / 2,
    position: resolvedPosition ?? Position.Right,
  }
}

function getFallbackAnchorFromNode(node, handleId) {
  if (!node) {
    return null
  }

  const position = getNodePosition(node)
  const measured = getNodeMeasured(node)
  const width = Math.max(1, Number(measured.width) || 0)
  const height = Math.max(1, Number(measured.height) || 0)
  const side = getFallbackHandlePosition(handleId)
  if (side === Position.Left) {
    return {
      x: position.x,
      y: position.y + height / 2,
      position: Position.Left,
    }
  }
  if (side === Position.Right) {
    return {
      x: position.x + width,
      y: position.y + height / 2,
      position: Position.Right,
    }
  }
  if (side === Position.Top) {
    return {
      x: position.x + width / 2,
      y: position.y,
      position: Position.Top,
    }
  }
  if (side === Position.Bottom) {
    return {
      x: position.x + width / 2,
      y: position.y + height,
      position: Position.Bottom,
    }
  }

  return {
    x: position.x + width / 2,
    y: position.y + height / 2,
    position: Position.Right,
  }
}

export function getRelationshipLayoutFromNodes(
  edge,
  sourceNode,
  targetNode,
  options = {},
) {
  const { allowFallback = true } = options
  if (!edge || !sourceNode || !targetNode) {
    return null
  }

  const sourceAnchor =
    getHandleAnchor(sourceNode, 'source', edge.sourceHandle) ??
    (allowFallback
      ? getFallbackAnchorFromNode(sourceNode, edge.sourceHandle)
      : null)
  const targetAnchor =
    getHandleAnchor(targetNode, 'target', edge.targetHandle) ??
    (allowFallback
      ? getFallbackAnchorFromNode(targetNode, edge.targetHandle)
      : null)
  if (!sourceAnchor || !targetAnchor) {
    return null
  }

  return getRelationshipLayout({
    sourceX: sourceAnchor.x,
    sourceY: sourceAnchor.y,
    targetX: targetAnchor.x,
    targetY: targetAnchor.y,
    sourcePosition: sourceAnchor.position,
    targetPosition: targetAnchor.position,
    data: edge.data,
  })
}
