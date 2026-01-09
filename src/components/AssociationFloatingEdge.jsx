import { EdgeLabelRenderer, getSmoothStepPath, useStore } from 'reactflow'
import { EdgeLabel } from './EdgeLabel.jsx'
import { getEdgeParams } from './floatingEdgeUtils.js'

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
