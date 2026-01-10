import { getStraightPath } from 'reactflow'

export function AssociativeAssociation({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
  selected,
}) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })
  const strokeClass = selected ? 'text-primary' : 'text-base-content'

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path fill-none ${strokeClass}`}
        d={edgePath}
        markerEnd={markerEnd}
        stroke="currentColor"
        style={{ ...style, strokeDasharray: '6 4' }}
      />
      <path
        className="react-flow__edge-interaction"
        d={edgePath}
        fill="none"
      />
    </>
  )
}
