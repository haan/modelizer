import { getStraightPath } from 'reactflow'

export function AssociativeAssociation({
  id,
  sourceX,
  sourceY,
  sourceHandle,
  sourcePosition,
  targetX,
  targetY,
  style,
  markerEnd,
  selected,
}) {
  const sourceSide =
    sourceHandle?.split('-')[0] ?? (sourcePosition ?? '').toString()
  const sourceOffsets = {
    top: { x: 0, y: 7 },
    right: { x: -7, y: 0 },
    bottom: { x: 0, y: -7 },
    left: { x: 7, y: 0 },
  }
  const { x: sourceOffsetX = 0, y: sourceOffsetY = 0 } =
    sourceOffsets[sourceSide] ?? {}
  const [edgePath] = getStraightPath({
    sourceX: sourceX + sourceOffsetX,
    sourceY: sourceY + sourceOffsetY,
    targetX,
    targetY: targetY + 8,
  })
  const strokeClass = selected ? 'text-primary' : 'text-base-content/70'

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
