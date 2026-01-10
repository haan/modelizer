import { EdgeLabelRenderer, getSmoothStepPath } from 'reactflow'
import { EdgeLabel } from './EdgeLabel.jsx'

function getEndpointLabelTransform(position, x, y) {
  const offset = 8

  switch (position) {
    case 'left':
      return `translate(-100%, -50%) translate(${x - offset}px, ${y}px)`
    case 'right':
      return `translate(0%, -50%) translate(${x + offset}px, ${y}px)`
    case 'top':
      return `translate(-50%, -100%) translate(${x}px, ${y - offset}px)`
    case 'bottom':
      return `translate(-50%, 0%) translate(${x}px, ${y + offset}px)`
    default:
      return `translate(-50%, -50%) translate(${x}px, ${y}px)`
  }
}

export function AssociationEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}) {
  const isSelfEdge = source === target
  let edgePath = ''
  let labelX = 0
  let labelY = 0

  if (isSelfEdge) {
    const dx = sourceX - targetX
    const radiusX = Math.max(Math.abs(dx * 0.6), 40)
    const radiusY = 50
    edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX + 2} ${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = Math.min(sourceY, targetY) - radiusY - 8
  } else {
    ;[edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
  }

  const multiplicityA = data?.multiplicityA ?? ''
  const multiplicityB = data?.multiplicityB ?? ''
  const name = data?.name ?? ''

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
            transform={
              isSelfEdge
                ? `translate(-50%, -50%) translate(${
                    sourceX - 12
                  }px, ${sourceY + 8}px)`
                : getEndpointLabelTransform(sourcePosition, sourceX, sourceY)
            }
            label={multiplicityA}
          />
        ) : null}
        {multiplicityB ? (
          <EdgeLabel
            transform={
              isSelfEdge
                ? `translate(-50%, -50%) translate(${
                    targetX + 12
                  }px, ${targetY + 8}px)`
                : getEndpointLabelTransform(targetPosition, targetX, targetY)
            }
            label={multiplicityB}
          />
        ) : null}
        {name ? (
          <EdgeLabel
            transform={`translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`}
            label={name}
          />
        ) : null}
      </EdgeLabelRenderer>
    </>
  )
}
