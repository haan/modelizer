import { getStraightPath } from 'reactflow'

export function AssociativeAssociation({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
}) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <path
      id={id}
      className="react-flow__edge-path fill-none stroke-[var(--color-base-content)] [stroke-width:1]"
      d={edgePath}
      markerEnd={markerEnd}
      style={{ ...style, strokeDasharray: '6 4' }}
    />
  )
}
