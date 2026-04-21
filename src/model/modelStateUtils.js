import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from './constants.js'

const samePosition = (a, b) => a?.x === b?.x && a?.y === b?.y

export function deriveViewPositionsMeta(node, viewPositions) {
  const meta = node.data?.viewPositionsMeta
  if (
    meta &&
    typeof meta.conceptual === 'boolean' &&
    typeof meta.logical === 'boolean' &&
    typeof meta.physical === 'boolean'
  ) {
    return {
      conceptual: meta.conceptual,
      logical: meta.logical,
      physical: meta.physical,
    }
  }

  return {
    conceptual: true,
    logical: !samePosition(
      viewPositions[VIEW_LOGICAL],
      viewPositions[VIEW_CONCEPTUAL],
    ),
    physical:
      !samePosition(
        viewPositions[VIEW_PHYSICAL],
        viewPositions[VIEW_CONCEPTUAL],
      ) &&
      !samePosition(
        viewPositions[VIEW_PHYSICAL],
        viewPositions[VIEW_LOGICAL],
      ),
  }
}

const CLASS_HANDLE_IDS = new Set([
  'left-source',
  'left-target',
  'right-source',
  'right-target',
  'top-source',
  'top-target',
  'bottom-source',
  'bottom-target',
])
const ASSOCIATION_HANDLE_ID = 'association-target'

export function getAttributeIdFromHandle(handleId) {
  if (!handleId || handleId === ASSOCIATION_HANDLE_ID) {
    return null
  }

  if (CLASS_HANDLE_IDS.has(handleId)) {
    return null
  }

  const suffix = handleId.endsWith('-source')
    ? '-source'
    : handleId.endsWith('-target')
      ? '-target'
      : null
  if (!suffix) {
    return null
  }

  const trimmed = handleId.slice(0, -suffix.length)
  if (trimmed.startsWith('left-')) {
    return trimmed.slice('left-'.length)
  }
  if (trimmed.startsWith('right-')) {
    return trimmed.slice('right-'.length)
  }
  return null
}

export const isAttributeHandle = (handleId) =>
  Boolean(getAttributeIdFromHandle(handleId))

const RELATIONSHIP_SIDE_LEFT = 'left'
const RELATIONSHIP_SIDE_RIGHT = 'right'

export function getRelationshipHandleSide(handleId) {
  if (typeof handleId !== 'string') {
    return null
  }

  if (handleId.startsWith(`${RELATIONSHIP_SIDE_LEFT}-`)) {
    return RELATIONSHIP_SIDE_LEFT
  }
  if (handleId.startsWith(`${RELATIONSHIP_SIDE_RIGHT}-`)) {
    return RELATIONSHIP_SIDE_RIGHT
  }

  return null
}

export function resolveRelationshipSideByAimX(position, aimX, currentSide) {
  if (
    !position ||
    !Number.isFinite(position.leftX) ||
    !Number.isFinite(position.rightX)
  ) {
    return currentSide ?? RELATIONSHIP_SIDE_RIGHT
  }
  if (!Number.isFinite(aimX)) {
    return currentSide ?? RELATIONSHIP_SIDE_RIGHT
  }

  const leftDistance = Math.abs(aimX - position.leftX)
  const rightDistance = Math.abs(aimX - position.rightX)
  if (leftDistance === rightDistance) {
    if (
      currentSide === RELATIONSHIP_SIDE_LEFT ||
      currentSide === RELATIONSHIP_SIDE_RIGHT
    ) {
      return currentSide
    }

    return Number.isFinite(position.centerX) && aimX >= position.centerX
      ? RELATIONSHIP_SIDE_RIGHT
      : RELATIONSHIP_SIDE_LEFT
  }

  return rightDistance < leftDistance
    ? RELATIONSHIP_SIDE_RIGHT
    : RELATIONSHIP_SIDE_LEFT
}

export function getDistanceSquaredToSegment(point, segmentStart, segmentEnd) {
  const vx = segmentEnd.x - segmentStart.x
  const vy = segmentEnd.y - segmentStart.y
  const wx = point.x - segmentStart.x
  const wy = point.y - segmentStart.y
  const segmentLengthSquared = vx * vx + vy * vy

  if (segmentLengthSquared === 0) {
    const dx = point.x - segmentStart.x
    const dy = point.y - segmentStart.y
    return dx * dx + dy * dy
  }

  const t = Math.max(
    0,
    Math.min(1, (wx * vx + wy * vy) / segmentLengthSquared),
  )
  const projectionX = segmentStart.x + t * vx
  const projectionY = segmentStart.y + t * vy
  const dx = point.x - projectionX
  const dy = point.y - projectionY
  return dx * dx + dy * dy
}

export function getClosestSegmentIndex(pathPoints, point) {
  if (!Array.isArray(pathPoints) || pathPoints.length < 2) {
    return 0
  }

  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const distance = getDistanceSquaredToSegment(
      point,
      pathPoints[index],
      pathPoints[index + 1],
    )
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

const CONTROL_POINT_SNAP_THRESHOLD = 10

export function getSnappedCoordinate(value, neighbors, axis) {
  if (!Number.isFinite(value) || !Array.isArray(neighbors) || neighbors.length === 0) {
    return value
  }

  let snappedValue = value
  let bestDistance = CONTROL_POINT_SNAP_THRESHOLD + 1

  neighbors.forEach((neighbor) => {
    const neighborValue = axis === 'x' ? neighbor?.x : neighbor?.y
    if (!Number.isFinite(neighborValue)) {
      return
    }

    const distance = Math.abs(value - neighborValue)
    if (distance <= CONTROL_POINT_SNAP_THRESHOLD && distance < bestDistance) {
      snappedValue = neighborValue
      bestDistance = distance
    }
  })

  return snappedValue
}

export function getControlPointSnapNeighbors({
  controlPoints,
  controlPointIndex,
  sourceAnchor,
  targetAnchor,
}) {
  const axisNeighbors = [
    controlPoints[controlPointIndex - 1],
    controlPoints[controlPointIndex + 1],
  ].filter(Boolean)
  const yNeighbors = [...axisNeighbors]
  const isFirstControlPoint = controlPointIndex === 0
  const isLastControlPoint = controlPointIndex === controlPoints.length - 1

  if (isFirstControlPoint && sourceAnchor) {
    yNeighbors.push(sourceAnchor)
  }
  if (isLastControlPoint && targetAnchor) {
    yNeighbors.push(targetAnchor)
  }

  return {
    xNeighbors: axisNeighbors,
    yNeighbors,
  }
}
