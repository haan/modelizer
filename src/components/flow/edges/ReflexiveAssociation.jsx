import { EdgeLabelRenderer, useStore } from 'reactflow'
import { AssociationLabel } from '../labels/AssociationLabel.jsx'
import { MultiplicityLabel } from '../labels/MultiplicityLabel.jsx'
import { RoleLabel } from '../labels/RoleLabel.jsx'
import { getReflexiveAssociationLayout } from '../utils/reflexiveAssociationUtils.js'
import { ReflexiveResizeHandles } from './ReflexiveResizeHandles.jsx'

function getStartMultiplicityTransform(side, x, y) {
  if (side === 'right') {
    return `translate(0%, -100%) translate(${x}px, ${y - 1}px)`
  }
  return `translate(-100%, -100%) translate(${x}px, ${y - 1}px)`
}

function getEndMultiplicityTransform(side, x, y) {
  if (side === 'right') {
    return `translate(0%, -100%) translate(${x + 1}px, ${y}px)`
  }
  return `translate(-100%, -100%) translate(${x - 1}px, ${y}px)`
}

function getStartRoleTransform(side, x, y) {
  if (side === 'right') {
    return `translate(0%, 0%) translate(${x}px, ${y + 1}px)`
  }
  return `translate(-100%, 0%) translate(${x}px, ${y + 1}px)`
}

export function ReflexiveAssociation({
  id,
  source,
  markerEnd,
  style,
  data,
  selected,
}) {
  const node = useStore((state) => state.nodeInternals.get(source))
  const layout = getReflexiveAssociationLayout(node, data)
  if (!layout) {
    return null
  }

  const side = layout.side
  const isRight = side === 'right'
  const startX = layout.startAnchor.x
  const startY = layout.startAnchor.y
  const endX = layout.endAnchor.x
  const endY = layout.endAnchor.y
  const roleBX = layout.topSegmentCenter.x
  const roleBY = layout.topSegmentCenter.y
  const associationNameX = isRight
    ? layout.outerSegmentCenter.x + 4
    : layout.outerSegmentCenter.x - 4
  const associationNameY = layout.outerSegmentCenter.y

  const multiplicityA = data?.multiplicityA ?? ''
  const multiplicityB = data?.multiplicityB ?? ''
  const roleA = data?.roleA ?? ''
  const roleB = data?.roleB ?? ''
  const name = data?.name ?? ''
  const onMoveReflexiveHandle = data?.onMoveReflexiveHandle
  const onControlPointDragStart = data?.onControlPointDragStart
  const onControlPointDragEnd = data?.onControlPointDragEnd
  const strokeClass = selected ? 'text-primary' : 'text-base-content/70'

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path fill-none ${strokeClass}`}
        d={layout.edgePath}
        markerEnd={markerEnd}
        stroke="currentColor"
        style={style}
      />
      <path
        className="react-flow__edge-interaction"
        d={layout.edgePath}
        fill="none"
      />
      <ReflexiveResizeHandles
        edgeId={id}
        selected={selected}
        handles={layout.resizeHandles}
        onMoveHandle={onMoveReflexiveHandle}
        onDragStart={onControlPointDragStart}
        onDragEnd={onControlPointDragEnd}
      />
      <EdgeLabelRenderer>
        {multiplicityA ? (
          <MultiplicityLabel
            transform={getStartMultiplicityTransform(side, startX, startY)}
            label={multiplicityA}
          />
        ) : null}
        {multiplicityB ? (
          <MultiplicityLabel
            transform={getEndMultiplicityTransform(side, endX, endY)}
            label={multiplicityB}
          />
        ) : null}
        {roleA ? (
          <RoleLabel
            transform={getStartRoleTransform(side, startX, startY)}
            label={roleA}
          />
        ) : null}
        {roleB ? (
          <RoleLabel
            transform={`translate(-50%, -100%) translate(${roleBX}px, ${roleBY - 2}px)`}
            label={roleB}
          />
        ) : null}
        {name ? (
          <AssociationLabel
            transform={
              isRight
                ? `translate(0%, -50%) translate(${associationNameX}px, ${associationNameY}px)`
                : `translate(-100%, -50%) translate(${associationNameX}px, ${associationNameY}px)`
            }
            className={isRight ? 'text-left' : 'text-right'}
            label={name}
          />
        ) : null}
      </EdgeLabelRenderer>
    </>
  )
}
