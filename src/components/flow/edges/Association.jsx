import { getEndpointLabelTransform, getRoleLabelTransform } from '../utils/associationLabelTransforms.js'
import { EdgeLabelRenderer, useInternalNode } from '@xyflow/react'
import { AssociationLabel } from '../labels/AssociationLabel.jsx'
import { MultiplicityLabel } from '../labels/MultiplicityLabel.jsx'
import { RoleLabel } from '../labels/RoleLabel.jsx'
import { getAssociationLayout } from '../utils/associationUtils.js'
import { EdgeControlPoints } from './EdgeControlPoints.jsx'
import { useParallelLabels } from './useParallelLabels.js'
import { useAssociationAnchors } from './useAssociationAnchors.js'

export function Association({
  id,
  source,
  target,
  markerEnd,
  style,
  data,
  selected,
}) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  const anchors = useAssociationAnchors(id)
  const layout = getAssociationLayout(sourceNode, targetNode, data, anchors)
  const parallelLabels = useParallelLabels(id, source, target, data, sourceNode, targetNode, layout)
  if (!layout) {
    return null
  }

  const multiplicityA = data?.multiplicityA ?? ''
  const multiplicityB = data?.multiplicityB ?? ''
  const roleA = data?.roleA ?? ''
  const roleB = data?.roleB ?? ''
  const name = data?.name ?? ''
  const controlPoints = Array.isArray(data?.controlPoints) ? data.controlPoints : []
  const onMoveControlPoint = data?.onMoveControlPoint
  const onDeleteControlPoint = data?.onDeleteControlPoint
  const onControlPointDragStart = data?.onControlPointDragStart
  const onControlPointDragEnd = data?.onControlPointDragEnd
  const strokeClass = selected ? 'text-primary' : 'text-base-content/70'
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
      <path
        className="react-flow__edge-interaction"
        d={edgePath}
        fill="none"
      />
      <EdgeControlPoints
        edgeId={id}
        controlPoints={controlPoints}
        selected={selected}
        onMoveControlPoint={onMoveControlPoint}
        onDeleteControlPoint={onDeleteControlPoint}
        onControlPointDragStart={onControlPointDragStart}
        onControlPointDragEnd={onControlPointDragEnd}
      />
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
        {roleA ? (
          <RoleLabel
            transform={getRoleLabelTransform(sourcePos, sourceX, sourceY)}
            label={roleA}
          />
        ) : null}
        {roleB ? (
          <RoleLabel
            transform={getRoleLabelTransform(targetPos, targetX, targetY)}
            label={roleB}
          />
        ) : null}
        {name ? (
          <AssociationLabel
            transform={parallelLabels?.nameTransform ?? `translate(-50%, -100%) translate(${labelX}px, ${labelY - 1}px)`}
            className={parallelLabels ? 'whitespace-nowrap' : ''}
            label={name}
          />
        ) : null}
      </EdgeLabelRenderer>
    </>
  )
}
