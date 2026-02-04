import { getSmoothStepPath, Position } from 'reactflow'
import { RELATIONSHIP_EDGE_STUB_DISTANCE } from '../../../model/constants.js'

export function Relationship({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  selected,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    offset: RELATIONSHIP_EDGE_STUB_DISTANCE,
  })
  const strokeClass = selected ? 'text-primary' : 'text-base-content/70'
  const arrowSize = 10
  const arrowWidth = 6
  const direction =
    targetPosition === Position.Left
      ? { x: 1, y: 0 }
      : targetPosition === Position.Right
        ? { x: -1, y: 0 }
        : targetPosition === Position.Top
          ? { x: 0, y: 1 }
          : targetPosition === Position.Bottom
            ? { x: 0, y: -1 }
            : (() => {
                const dx = targetX - sourceX
                const dy = targetY - sourceY
                const length = Math.hypot(dx, dy) || 1
                return { x: dx / length, y: dy / length }
              })()
  const perp = { x: -direction.y, y: direction.x }
  const base = {
    x: targetX - direction.x * arrowSize,
    y: targetY - direction.y * arrowSize,
  }
  const left = {
    x: base.x + perp.x * arrowWidth,
    y: base.y + perp.y * arrowWidth,
  }
  const right = {
    x: base.x - perp.x * arrowWidth,
    y: base.y - perp.y * arrowWidth,
  }
  const arrowPath = `M ${left.x} ${left.y} L ${targetX} ${targetY} L ${right.x} ${right.y}`

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
    </>
  )
}
