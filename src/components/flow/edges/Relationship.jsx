import { Position } from 'reactflow'
import { EdgeControlPoints } from './EdgeControlPoints.jsx'
import { getRelationshipLayout } from '../utils/relationshipUtils.js'

export function Relationship({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  selected,
}) {
  const layout = getRelationshipLayout({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  })
  if (!layout) {
    return null
  }

  const controlPoints = layout.controlPoints
  const onMoveControlPoint = data?.onMoveControlPoint
  const onDeleteControlPoint = data?.onDeleteControlPoint
  const onMoveControlPointWithAnchors = (
    edgeId,
    controlPointIndex,
    nextPoint,
  ) =>
    onMoveControlPoint?.(edgeId, controlPointIndex, nextPoint, {
      sourceAnchor: { x: layout.sourceX, y: layout.sourceY },
      targetAnchor: { x: layout.targetX, y: layout.targetY },
    })
  const strokeClass = selected ? 'text-primary' : 'text-base-content/70'
  const arrowSize = 10
  const arrowWidth = 6
  const {
    edgePath,
    targetX: layoutTargetX,
    targetY: layoutTargetY,
    targetPosition: layoutTargetPosition,
    incomingDx,
    incomingDy,
  } = layout
  const hasIncomingVector =
    Number.isFinite(incomingDx) &&
    Number.isFinite(incomingDy) &&
    (incomingDx !== 0 || incomingDy !== 0)
  const direction =
    hasIncomingVector
      ? (() => {
          const length = Math.hypot(incomingDx, incomingDy) || 1
          return { x: incomingDx / length, y: incomingDy / length }
        })()
      : layoutTargetPosition === Position.Left
      ? { x: 1, y: 0 }
      : layoutTargetPosition === Position.Right
        ? { x: -1, y: 0 }
        : layoutTargetPosition === Position.Top
          ? { x: 0, y: 1 }
          : layoutTargetPosition === Position.Bottom
            ? { x: 0, y: -1 }
            : (() => {
                const dx = layoutTargetX - sourceX
                const dy = layoutTargetY - sourceY
                const length = Math.hypot(dx, dy) || 1
                return { x: dx / length, y: dy / length }
              })()
  const perp = { x: -direction.y, y: direction.x }
  const base = {
    x: layoutTargetX - direction.x * arrowSize,
    y: layoutTargetY - direction.y * arrowSize,
  }
  const left = {
    x: base.x + perp.x * arrowWidth,
    y: base.y + perp.y * arrowWidth,
  }
  const right = {
    x: base.x - perp.x * arrowWidth,
    y: base.y - perp.y * arrowWidth,
  }
  const arrowPath = `M ${left.x} ${left.y} L ${layoutTargetX} ${layoutTargetY} L ${right.x} ${right.y}`

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path fill-none ${strokeClass}`}
        d={edgePath}
        stroke="currentColor"
        style={style}
      />
      <path
        className={`react-flow__edge-path fill-none ${strokeClass}`}
        d={arrowPath}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />
      <path
        className="react-flow__edge-interaction"
        d={edgePath}
        fill="none"
      />
      <EdgeControlPoints
        edgeId={id}
        controlPoints={controlPoints}
        selected={selected}
        onMoveControlPoint={onMoveControlPointWithAnchors}
        onDeleteControlPoint={onDeleteControlPoint}
      />
    </>
  )
}
