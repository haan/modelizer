import { getStraightPath, useStore } from '@xyflow/react'
import { getAssociationLayout } from '../utils/associationUtils.js'
import { getReflexiveAssociationLayout } from '../utils/reflexiveAssociationUtils.js'
import { getAssociationAnchorsFromState } from './useAssociationAnchors.js'

function getAttachment(state, helperId) {
  if (!helperId?.startsWith('assoc-edge-')) return null
  const base = state.edges.find(edge => edge.id === helperId.slice('assoc-edge-'.length))
  if (!base) return null
  const sourceNode = state.nodeLookup.get(base.source)
  if (base.type === 'reflexiveAssociation') {
    return getReflexiveAssociationLayout(sourceNode, base.data)?.helperAnchor ?? null
  }
  const layout = getAssociationLayout(sourceNode, state.nodeLookup.get(base.target), base.data,
    getAssociationAnchorsFromState(state, base.id))
  return layout ? { x: layout.labelX, y: layout.labelY } : null
}

const samePoint = (a, b) => a?.x === b?.x && a?.y === b?.y

export function AssociativeAssociation({
  id,
  source,
  target,
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
  // Derive attachment from the rendered path too: offscreen exports remeasure
  // classes locally and may not share the editor's helper-node coordinates.
  const sourceAttachment = useStore(state => getAttachment(state, source), samePoint)
  const targetAttachment = useStore(state => getAttachment(state, target), samePoint)
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
    sourceX: sourceAttachment?.x ?? sourceX + sourceOffsetX,
    sourceY: sourceAttachment?.y ?? sourceY + sourceOffsetY,
    targetX: targetAttachment?.x ?? targetX,
    targetY: targetAttachment?.y ?? targetY + 8,
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
