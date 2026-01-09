import { EdgeLabelRenderer, getSmoothStepPath, Position, useStore } from 'reactflow'
import { EdgeLabel } from './EdgeLabel.jsx'

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

function getEndpointLabelTransform(position, x, y) {
  const offset = 0

  switch (position) {
    case 'left':
      return `translate(-100%, 0%) translate(${x - offset}px, ${y}px)`
    case 'right':
      return `translate(0%, 0%) translate(${x + offset}px, ${y}px)`
    case 'top':
      return `translate(0%, -100%) translate(${x}px, ${y - offset}px)`
    case 'bottom':
      return `translate(0%, 0%) translate(${x}px, ${y + offset}px)`
    default:
      return `translate(-50%, -50%) translate(${x}px, ${y}px)`
  }
}

export function AssociationFloatingEdge({ id, source, target, markerEnd, style, data }) {
  const sourceNode = useStore((state) => state.nodeInternals.get(source))
  const targetNode = useStore((state) => state.nodeInternals.get(target))

  if (!sourceNode || !targetNode) {
    return null
  }

  const multiplicityA = data?.multiplicityA ?? ''
  const multiplicityB = data?.multiplicityB ?? ''
  const name = data?.name ?? ''
  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  )
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  })

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path fill-none stroke-[var(--color-base-content)] [stroke-width:1]"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        {multiplicityA ? (
          <EdgeLabel
            transform={getEndpointLabelTransform(sourcePos, sx, sy)}
            label={multiplicityA}
          />
        ) : null}
        {multiplicityB ? (
          <EdgeLabel
            transform={getEndpointLabelTransform(targetPos, tx, ty)}
            label={multiplicityB}
          />
        ) : null}
        {name ? (
          <EdgeLabel
            transform={`translate(-50%, -100%) translate(${labelX}px, ${labelY}px)`}
            label={name}
          />
        ) : null}
      </EdgeLabelRenderer>
    </>
  )
}
