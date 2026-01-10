import { Position, getSmoothStepPath } from 'reactflow'

const PARALLEL_OFFSET_SPACING = 25
const STEP_SHIFT_SPACING = -20

function getNodeIntersection(intersectionNode, targetNode) {
  const intersectionMeasured = intersectionNode.measured ?? {
    width: intersectionNode.width ?? 0,
    height: intersectionNode.height ?? 0,
  }
  const targetMeasured = targetNode.measured ?? {
    width: targetNode.width ?? 0,
    height: targetNode.height ?? 0,
  }
  const intersectionNodePosition =
    intersectionNode.internals?.positionAbsolute ??
    intersectionNode.position ?? { x: 0, y: 0 }
  const targetPosition =
    targetNode.internals?.positionAbsolute ?? targetNode.position ?? { x: 0, y: 0 }

  const w = Math.max(intersectionMeasured.width, 1) / 2
  const h = Math.max(intersectionMeasured.height, 1) / 2

  const x2 = intersectionNodePosition.x + w
  const y2 = intersectionNodePosition.y + h
  const x1 = targetPosition.x + Math.max(targetMeasured.width, 1) / 2
  const y1 = targetPosition.y + Math.max(targetMeasured.height, 1) / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1))
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2

  return { x, y }
}

function getEdgePosition(node, intersectionPoint) {
  const basePosition =
    node.internals?.positionAbsolute ?? node.position ?? { x: 0, y: 0 }
  const n = { ...basePosition, ...node }
  const measured = node.measured ?? {
    width: node.width ?? 0,
    height: node.height ?? 0,
  }
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
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)

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

function getNodeCenter(node) {
  const width = node?.measured?.width ?? node?.width ?? 0
  const height = node?.measured?.height ?? node?.height ?? 0
  const position =
    node?.internals?.positionAbsolute ?? node?.position ?? { x: 0, y: 0 }

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

export function getAssociationLayout(sourceNode, targetNode, data) {
  if (!sourceNode || !targetNode) {
    return null
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  )
  const { parallelOffset } = getParallelMeta(data)
  const isHorizontal = isHorizontalConnection(sourcePos, targetPos)
  const { offsetX, offsetY } = getParallelLineOffset(parallelOffset, isHorizontal)
  const sourceXOffset = sx + offsetX
  const sourceYOffset = sy + offsetY
  const targetXOffset = tx + offsetX
  const targetYOffset = ty + offsetY
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const positionSign = getPositionSign(sourceCenter, targetCenter, isHorizontal)
  const stepShift = parallelOffset * STEP_SHIFT_SPACING * positionSign
  const centerX =
    (sourceXOffset + targetXOffset) / 2 + (isHorizontal ? stepShift : 0)
  const centerY =
    (sourceYOffset + targetYOffset) / 2 + (isHorizontal ? 0 : stepShift)
  const [edgePath, labelX, labelY] = getSmoothStepPath({
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
  }
}
