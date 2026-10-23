import { getEndpointLabelTransform } from '../utils/associationLabelTransforms.js'
import { EdgeLabelRenderer, useInternalNode } from '@xyflow/react'
import { AssociationLabel } from '../labels/AssociationLabel.jsx'
import { MultiplicityLabel } from '../labels/MultiplicityLabel.jsx'
import { getAssociationLayout } from '../utils/associationUtils.js'
import { ASSOCIATION_LINE_STYLE_STRAIGHT } from '../../../model/constants.js'
import { EdgeControlPoints } from './EdgeControlPoints.jsx'
import { useParallelLabels } from './useParallelLabels.js'
import { useAssociationAnchors } from './useAssociationAnchors.js'

export function Composition({
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
  const name = data?.name ?? ''
  const controlPoints = Array.isArray(data?.controlPoints) ? data.controlPoints : []
  const onMoveControlPoint = data?.onMoveControlPoint
  const onDeleteControlPoint = data?.onDeleteControlPoint
  const onControlPointDragStart = data?.onControlPointDragStart
  const onControlPointDragEnd = data?.onControlPointDragEnd
  const strokeClass = selected ? 'text-primary' : 'text-base-content'
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
    incomingDx,
    incomingDy,
    isManualRouting,
  } = layout
  const isStraightLine = data?.lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT
  const isHorizontal =
    targetPos === 'left' || targetPos === 'right'
  const diamondWidth =
    isManualRouting || isStraightLine ? 14 : isHorizontal ? 14 : 10
  const diamondHeight =
    isManualRouting || isStraightLine ? 10 : isHorizontal ? 10 : 14
  const diamondHalfWidth = diamondWidth / 2
  const diamondHalfHeight = diamondHeight / 2
  const diamondOffset =
    isManualRouting || isStraightLine ? diamondWidth / 2 : 7
  let diamondX = targetX
  let diamondY = targetY
  if (isManualRouting) {
    const dx = incomingDx
    const dy = incomingDy
    const length = Math.hypot(dx, dy) || 1
    const ux = dx / length
    const uy = dy / length
    diamondX = targetX - ux * diamondOffset
    diamondY = targetY - uy * diamondOffset
  } else if (isStraightLine) {
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const length = Math.hypot(dx, dy) || 1
    const ux = dx / length
    const uy = dy / length
    diamondX = targetX - ux * diamondOffset
    diamondY = targetY - uy * diamondOffset
  } else {
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
  }
  const diamondRotationDeg = (() => {
    if (!isManualRouting && !isStraightLine) {
      return 0
    }

    const dx = isManualRouting ? incomingDx : targetX - sourceX
    const dy = isManualRouting ? incomingDy : targetY - sourceY
    if (dx === 0 && dy === 0) {
      return 0
    }

    return (Math.atan2(dy, dx) * 180) / Math.PI
  })()

  return (
    <>
      {/* Composite opaque geometry first, so the line cannot show through the diamond. */}
      <g className={strokeClass} opacity={selected ? 1 : 0.7}>
        <path
          id={id}
          className="react-flow__edge-path fill-none"
          d={edgePath}
          markerEnd={markerEnd}
          stroke="currentColor"
          style={style}
        />
        <polygon
          transform={`translate(${diamondX}, ${diamondY}) rotate(${diamondRotationDeg})`}
          points={`0,${-diamondHalfHeight} ${diamondHalfWidth},0 0,${diamondHalfHeight} ${-diamondHalfWidth},0`}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          pointerEvents="none"
          aria-hidden="true"
        />
      </g>
      <path className="react-flow__edge-interaction" d={edgePath} fill="none" />
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
