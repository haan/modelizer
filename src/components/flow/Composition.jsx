import { EdgeLabelRenderer, useStore } from 'reactflow'
import { AssociationLabel } from './AssociationLabel.jsx'
import { MultiplicityLabel } from './MultiplicityLabel.jsx'
import { getAssociationLayout } from './associationUtils.js'

function getEndpointLabelTransform(position, x, y) {
  const offset = 0

  switch (position) {
    case 'left':
      return `translate(-100%, 0%) translate(${x - offset}px, ${y + 1}px)`
    case 'right':
      return `translate(0%, 0%) translate(${x + offset}px, ${y + 1}px)`
    case 'top':
      return `translate(0%, -100%) translate(${x + 1}px, ${y - offset}px)`
    case 'bottom':
      return `translate(0%, 0%) translate(${x + 1}px, ${y + offset}px)`
    default:
      return `translate(-50%, -50%) translate(${x}px, ${y}px)`
  }
}

function getDiamondTransform(x, y) {
  return `translate(-50%, -50%) translate(${x}px, ${y}px)`
}

export function Composition({
  id,
  source,
  target,
  markerEnd,
  style,
  data,
  selected,
}) {
  const sourceNode = useStore((state) => state.nodeInternals.get(source))
  const targetNode = useStore((state) => state.nodeInternals.get(target))

  const layout = getAssociationLayout(sourceNode, targetNode, data)
  if (!layout) {
    return null
  }

  const multiplicityA = data?.multiplicityA ?? ''
  const multiplicityB = data?.multiplicityB ?? ''
  const name = data?.name ?? ''
  const strokeClass = selected ? 'text-primary' : 'text-base-content/70'
  const diamondClass = selected ? 'text-primary' : 'text-base-content'
  const {
    edgePath,
    labelX,
    labelY,
    sourcePos,
    targetPos,
    sourceX,
    sourceY,
    targetX,
    targetY,
  } = layout
  const isHorizontal =
    targetPos === 'left' || targetPos === 'right'
  const diamondWidth = isHorizontal ? 14 : 10
  const diamondHeight = isHorizontal ? 10 : 14
  const diamondHalfWidth = diamondWidth / 2
  const diamondHalfHeight = diamondHeight / 2
  const diamondOffset = 7
  let diamondX = targetX
  let diamondY = targetY

  switch (targetPos) {
    case 'left':
      diamondX = targetX - diamondOffset
      break
    case 'right':
      diamondX = targetX + diamondOffset
      break
    case 'top':
      diamondY = targetY - diamondOffset
      break
    case 'bottom':
      diamondY = targetY + diamondOffset
      break
    default: {
      const diamondVectorX = sourceX - targetX
      const diamondVectorY = sourceY - targetY
      const diamondLength = Math.hypot(diamondVectorX, diamondVectorY) || 1
      diamondX =
        targetX + (diamondVectorX / diamondLength) * diamondOffset
      diamondY =
        targetY + (diamondVectorY / diamondLength) * diamondOffset
    }
  }

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path fill-none ${strokeClass}`}
        d={edgePath}
        markerEnd={markerEnd}
        stroke="currentColor"
        style={style}
      />
      <path className="react-flow__edge-interaction" d={edgePath} fill="none" />
      <EdgeLabelRenderer>
        {multiplicityA ? (
          <MultiplicityLabel
            transform={getEndpointLabelTransform(
              sourcePos,
              sourceX,
              sourceY,
            )}
            label={multiplicityA}
          />
        ) : null}
        {multiplicityB ? (
          <MultiplicityLabel
            transform={getEndpointLabelTransform(
              targetPos,
              targetX,
              targetY,
            )}
            label={multiplicityB}
          />
        ) : null}
        {name ? (
          <AssociationLabel
            transform={`translate(-50%, -100%) translate(${labelX}px, ${labelY - 1}px)`}
            label={name}
          />
        ) : null}
        <div
          style={{ transform: getDiamondTransform(diamondX, diamondY) }}
          className={`nodrag nopan absolute ${diamondClass}`}
        >
          <svg
            width={diamondWidth}
            height={diamondHeight}
            viewBox={`0 0 ${diamondWidth} ${diamondHeight}`}
            className="block"
            aria-hidden="true"
          >
            <polygon
              points={`${diamondHalfWidth},0 ${diamondWidth},${diamondHalfHeight} ${diamondHalfWidth},${diamondHeight} 0,${diamondHalfHeight}`}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
              fillOpacity="1"
              strokeOpacity="1"
            />
          </svg>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
