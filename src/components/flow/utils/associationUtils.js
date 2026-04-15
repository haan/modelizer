import { Position, getSmoothStepPath, getStraightPath } from 'reactflow'
import {
  ASSOCIATION_LINE_STYLE_MANUAL,
  ASSOCIATION_LINE_STYLE_STRAIGHT,
} from '../../../model/constants.js'

const PARALLEL_OFFSET_SPACING = 25
const STEP_SHIFT_SPACING = -20
const SNAP_AXIS_THRESHOLD = 10
const MANUAL_STUB_LENGTH = 18
const MANUAL_CORNER_RADIUS = 5

function normalizeControlPoints(value) {
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

function getNodePosition(node) {
  return node.internals?.positionAbsolute ?? node.position ?? { x: 0, y: 0 }
}

function getNodeMeasured(node) {
  return node.measured ?? {
    width: node.width ?? 0,
    height: node.height ?? 0,
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getNodeIntersectionByPoint(intersectionNode, targetPoint) {
  const intersectionMeasured = getNodeMeasured(intersectionNode)
  const intersectionNodePosition = getNodePosition(intersectionNode)

  const w = Math.max(intersectionMeasured.width, 1) / 2
  const h = Math.max(intersectionMeasured.height, 1) / 2

  const x2 = intersectionNodePosition.x + w
  const y2 = intersectionNodePosition.y + h
  const x1 = Number.isFinite(targetPoint?.x) ? targetPoint.x : x2
  const y1 = Number.isFinite(targetPoint?.y) ? targetPoint.y : y2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const denominator = Math.abs(xx1) + Math.abs(yy1)
  if (denominator === 0) {
    return { x: x2, y: y2 }
  }
  const a = 1 / denominator
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2

  return { x, y }
}

function getEdgePosition(node, intersectionPoint) {
  const basePosition = getNodePosition(node)
  const n = { ...basePosition, ...node }
  const measured = getNodeMeasured(node)
  const width = Math.max(measured.width, 1)
  const height = Math.max(measured.height, 1)
  const nx = Math.round(n.x)
  const ny = Math.round(n.y)
  const px = Math.round(intersectionPoint.x)
  const py = Math.round(intersectionPoint.y)

  if (px <= nx + 1) {
    return Position.Left
  }
  if (px >= nx + width - 1) {
    return Position.Right
  }
  if (py <= ny + 1) {
    return Position.Top
  }
  if (py >= n.y + height - 1) {
    return Position.Bottom
  }

  return Position.Top
}

function getEdgeParams(source, target) {
  const sourceCenter = getNodeCenter(target)
  const targetCenter = getNodeCenter(source)
  const sourceIntersectionPoint = getNodeIntersectionByPoint(source, sourceCenter)
  const targetIntersectionPoint = getNodeIntersectionByPoint(target, targetCenter)

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint)
  const targetPos = getEdgePosition(target, targetIntersectionPoint)

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  }
}

function getManualEdgeParams(source, target, controlPoints) {
  const sourceAimPoint = controlPoints[0] ?? getNodeCenter(target)
  const targetAimPoint =
    controlPoints[controlPoints.length - 1] ?? getNodeCenter(source)

  const getManualAnchorByPoint = (node, point) => {
    const measured = getNodeMeasured(node)
    const width = Math.max(measured.width, 1)
    const height = Math.max(measured.height, 1)
    const position = getNodePosition(node)
    const centerX = position.x + width / 2
    const centerY = position.y + height / 2
    const pointX = Number.isFinite(point?.x) ? point.x : centerX
    const pointY = Number.isFinite(point?.y) ? point.y : centerY
    const dx = pointX - centerX
    const dy = pointY - centerY

    if (Math.abs(dx) >= Math.abs(dy)) {
      const isRightSide = dx >= 0
      return {
        x: isRightSide ? position.x + width : position.x,
        y: clamp(pointY, position.y, position.y + height),
        position: isRightSide ? Position.Right : Position.Left,
      }
    }

    const isBottomSide = dy >= 0
    return {
      x: clamp(pointX, position.x, position.x + width),
      y: isBottomSide ? position.y + height : position.y,
      position: isBottomSide ? Position.Bottom : Position.Top,
    }
  }

  const sourceAnchor = getManualAnchorByPoint(source, sourceAimPoint)
  const targetAnchor = getManualAnchorByPoint(target, targetAimPoint)

  return {
    sx: sourceAnchor.x,
    sy: sourceAnchor.y,
    tx: targetAnchor.x,
    ty: targetAnchor.y,
    sourcePos: sourceAnchor.position,
    targetPos: targetAnchor.position,
  }
}

function getNodeCenter(node) {
  const measured = getNodeMeasured(node ?? {})
  const width = measured.width ?? 0
  const height = measured.height ?? 0
  const position = getNodePosition(node ?? {})

  return { x: position.x + width / 2, y: position.y + height / 2 }
}

function getParallelMeta(data) {
  const parallelCount = data?.parallelCount ?? 1
  const parallelIndex = data?.parallelIndex ?? 0
  const parallelOffset =
    parallelCount > 1 ? parallelIndex - (parallelCount - 1) / 2 : 0

  return { parallelCount, parallelIndex, parallelOffset }
}

function isHorizontalConnection(sourcePos, targetPos) {
  return (
    sourcePos === Position.Left ||
    sourcePos === Position.Right ||
    targetPos === Position.Left ||
    targetPos === Position.Right
  )
}

function getParallelLineOffset(parallelOffset, isHorizontal) {
  if (parallelOffset === 0) {
    return { offsetX: 0, offsetY: 0 }
  }

  const offsetDistance = parallelOffset * PARALLEL_OFFSET_SPACING

  return {
    offsetX: isHorizontal ? 0 : offsetDistance,
    offsetY: isHorizontal ? offsetDistance : 0,
  }
}

function getPositionSign(sourceCenter, targetCenter, isHorizontal) {
  const primaryOrder = isHorizontal
    ? sourceCenter.x <= targetCenter.x
      ? [sourceCenter, targetCenter]
      : [targetCenter, sourceCenter]
    : sourceCenter.y <= targetCenter.y
      ? [sourceCenter, targetCenter]
      : [targetCenter, sourceCenter]
  const secondaryDelta = isHorizontal
    ? primaryOrder[1].y - primaryOrder[0].y
    : primaryOrder[1].x - primaryOrder[0].x

  return Math.sign(secondaryDelta) || 1
}

function getPerpendicularDirection(position) {
  switch (position) {
    case Position.Left:
      return { x: -1, y: 0 }
    case Position.Right:
      return { x: 1, y: 0 }
    case Position.Top:
      return { x: 0, y: -1 }
    case Position.Bottom:
      return { x: 0, y: 1 }
    default:
      return { x: 0, y: 0 }
  }
}

function getStubPoint(anchor, position, length) {
  const direction = getPerpendicularDirection(position)
  return {
    x: anchor.x + direction.x * length,
    y: anchor.y + direction.y * length,
  }
}

function getClampedStubLength(anchor, referencePoint) {
  const distance = Math.hypot(
    referencePoint.x - anchor.x,
    referencePoint.y - anchor.y,
  )
  return Math.min(MANUAL_STUB_LENGTH, distance / 2)
}

function dedupeConsecutivePoints(points) {
  return points.filter((point, index) => {
    if (index === 0) {
      return true
    }

    const previous = points[index - 1]
    return previous.x !== point.x || previous.y !== point.y
  })
}

function getRoundedPolylinePath(points, cornerRadius = 0) {
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

function getPolylineMidpointByLength(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { x: 0, y: 0 }
  }
  if (points.length === 1) {
    return { x: points[0].x, y: points[0].y }
  }

  const segmentLengths = []
  let totalLength = 0

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    const length = Math.hypot(end.x - start.x, end.y - start.y)
    segmentLengths.push(length)
    totalLength += length
  }

  if (totalLength === 0) {
    return { x: points[0].x, y: points[0].y }
  }

  const halfLength = totalLength / 2
  let distance = 0
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index]
    if (distance + segmentLength < halfLength) {
      distance += segmentLength
      continue
    }

    const start = points[index]
    const end = points[index + 1]
    if (segmentLength === 0) {
      return { x: start.x, y: start.y }
    }

    const t = (halfLength - distance) / segmentLength
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    }
  }

  const lastPoint = points[points.length - 1]
  return { x: lastPoint.x, y: lastPoint.y }
}

export function getAssociationLayout(sourceNode, targetNode, data) {
  if (!sourceNode || !targetNode) {
    return null
  }

  const controlPoints = normalizeControlPoints(data?.controlPoints)
  const isManualLineStyle = data?.lineStyle === ASSOCIATION_LINE_STYLE_MANUAL
  const isManualRouting = isManualLineStyle || controlPoints.length > 0

  if (isManualRouting) {
    const { sx, sy, tx, ty, sourcePos, targetPos } = getManualEdgeParams(
      sourceNode,
      targetNode,
      controlPoints,
    )
    const sourceAnchor = { x: sx, y: sy }
    const targetAnchor = { x: tx, y: ty }
    const sourceReferencePoint = controlPoints[0] ?? targetAnchor
    const targetReferencePoint =
      controlPoints[controlPoints.length - 1] ?? sourceAnchor
    const sourceStub = getStubPoint(
      sourceAnchor,
      sourcePos,
      getClampedStubLength(sourceAnchor, sourceReferencePoint),
    )
    const targetStub = getStubPoint(
      targetAnchor,
      targetPos,
      getClampedStubLength(targetAnchor, targetReferencePoint),
    )
    const pathPoints = dedupeConsecutivePoints([
      sourceAnchor,
      sourceStub,
      ...controlPoints,
      targetStub,
      targetAnchor,
    ])
    const midpoint = getPolylineMidpointByLength(pathPoints)
    const pointBeforeTarget = pathPoints[pathPoints.length - 2] ?? pathPoints[0]
    const incomingDx = tx - pointBeforeTarget.x
    const incomingDy = ty - pointBeforeTarget.y

    return {
      edgePath: getRoundedPolylinePath(pathPoints, MANUAL_CORNER_RADIUS),
      labelX: midpoint.x,
      labelY: midpoint.y,
      sourcePos,
      targetPos,
      sourceX: sx,
      sourceY: sy,
      targetX: tx,
      targetY: ty,
      pathPoints,
      incomingDx,
      incomingDy,
      isManualRouting: true,
    }
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  )
  const { parallelOffset } = getParallelMeta(data)
  const isHorizontal = isHorizontalConnection(sourcePos, targetPos)
  const { offsetX, offsetY } = getParallelLineOffset(parallelOffset, isHorizontal)
  let sourceXOffset = sx + offsetX
  let sourceYOffset = sy + offsetY
  let targetXOffset = tx + offsetX
  let targetYOffset = ty + offsetY
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const deltaX = Math.abs(sourceCenter.x - targetCenter.x)
  const deltaY = Math.abs(sourceCenter.y - targetCenter.y)
  const snapHorizontal = deltaY <= SNAP_AXIS_THRESHOLD
  const snapVertical = deltaX <= SNAP_AXIS_THRESHOLD
  const positionSign = getPositionSign(sourceCenter, targetCenter, isHorizontal)
  const isPerfectHorizontal =
    snapHorizontal ||
    Math.round(sourceCenter.y) === Math.round(targetCenter.y)
  const isPerfectVertical =
    snapVertical ||
    Math.round(sourceCenter.x) === Math.round(targetCenter.x)
  if (snapHorizontal) {
    const avgY = (sourceYOffset + targetYOffset) / 2
    sourceYOffset = avgY
    targetYOffset = avgY
  }
  if (snapVertical) {
    const avgX = (sourceXOffset + targetXOffset) / 2
    sourceXOffset = avgX
    targetXOffset = avgX
  }

  const stepShift = isPerfectHorizontal || isPerfectVertical
    ? 0
    : parallelOffset * STEP_SHIFT_SPACING * positionSign
  const centerX =
    (sourceXOffset + targetXOffset) / 2 +
    (isHorizontal ? stepShift : 0) +
    (snapVertical ? sourceCenter.x - targetCenter.x : 0)
  const centerY =
    (sourceYOffset + targetYOffset) / 2 +
    (isHorizontal ? 0 : stepShift) +
    (snapHorizontal ? sourceCenter.y - targetCenter.y : 0)
  const isStraightLine = data?.lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT
  let edgePath
  let labelX
  let labelY

  if (isStraightLine) {
    const [straightEdgePath] = getStraightPath({
      sourceX: sourceXOffset,
      sourceY: sourceYOffset,
      targetX: targetXOffset,
      targetY: targetYOffset,
    })
    edgePath = straightEdgePath
    labelX = (sourceXOffset + targetXOffset) / 2
    labelY = (sourceYOffset + targetYOffset) / 2
  } else {
    const [orthogonalEdgePath, rawLabelX, rawLabelY] = getSmoothStepPath({
      sourceX: sourceXOffset,
      sourceY: sourceYOffset,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: targetXOffset,
      targetY: targetYOffset,
      centerX,
      centerY,
      offset: 0,
    })
    edgePath = orthogonalEdgePath
    labelX = snapHorizontal || snapVertical
      ? (sourceXOffset + targetXOffset) / 2
      : rawLabelX
    labelY = snapHorizontal || snapVertical
      ? (sourceYOffset + targetYOffset) / 2
      : rawLabelY
  }

  const pathPoints = [
    { x: sourceXOffset, y: sourceYOffset },
    { x: targetXOffset, y: targetYOffset },
  ]

  return {
    edgePath,
    labelX,
    labelY,
    sourcePos,
    targetPos,
    sourceX: sourceXOffset,
    sourceY: sourceYOffset,
    targetX: targetXOffset,
    targetY: targetYOffset,
    pathPoints,
    incomingDx: targetXOffset - sourceXOffset,
    incomingDy: targetYOffset - sourceYOffset,
    isManualRouting: false,
  }
}
