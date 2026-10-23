import {
  ASSOCIATION_EDGE_TYPE,
  COMPOSITION_EDGE_TYPE,
  ASSOCIATION_LINE_STYLE_MANUAL,
  ASSOCIATION_LINE_STYLE_STRAIGHT,
} from '../../../model/constants.js'

const isAutomaticOrthogonal = (edge) =>
  edge.data?.lineStyle !== ASSOCIATION_LINE_STYLE_MANUAL &&
  edge.data?.lineStyle !== ASSOCIATION_LINE_STYLE_STRAIGHT &&
  !edge.data?.controlPoints?.length

// Read the rendered edges, rather than persisting extra layout metadata in the model.
export function getOrthogonalPeer(edges, id, source, target) {
  const group = edges.filter(edge => !edge.hidden &&
    (edge.type === ASSOCIATION_EDGE_TYPE || edge.type === COMPOSITION_EDGE_TYPE) &&
    ((edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)))
  if (source === target || group.length !== 2 || !group.some(edge => edge.id === id) ||
    !group.every(edge => edge.data?.parallelCount === 2 && isAutomaticOrthogonal(edge))) {
    return null
  }
  return group.find(edge => edge.id !== id)
}

const isHorizontalSide = side => side === 'left' || side === 'right'
const oppositeSide = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' }

function middleOrientation(layout) {
  // Mixed faces have an L bend rather than a shared middle segment. Leave these
  // and user-routed edges to their existing label placement.
  if (layout.isManualRouting || oppositeSide[layout.sourcePos] !== layout.targetPos) return null
  if (isHorizontalSide(layout.sourcePos)) {
    return Math.abs(layout.sourceY - layout.targetY) < 0.001 ? 'horizontal' : 'vertical'
  }
  return Math.abs(layout.sourceX - layout.targetX) < 0.001 ? 'vertical' : 'horizontal'
}

export function getParallelLabelPlacement(layout, peer) {
  if (!layout || !peer) return null
  const orientation = middleOrientation(layout)
  if (!orientation || orientation !== middleOrientation(peer)) return null
  const horizontal = orientation === 'horizontal'
  const delta = horizontal ? layout.labelY - peer.labelY : layout.labelX - peer.labelX
  if (Math.abs(delta) < 0.001) return null
  const outward = Math.sign(delta)
  const x = layout.labelX + (horizontal ? 0 : outward * 2)
  let y = layout.labelY - (horizontal ? 1 : 0)
  if (!horizontal) {
    // On staggered classes, keep both names in the shared vertical section,
    // away from the other connection's endpoint labels when there is room.
    const sharedStart = Math.max(Math.min(layout.sourceY, layout.targetY), Math.min(peer.sourceY, peer.targetY))
    const sharedEnd = Math.min(Math.max(layout.sourceY, layout.targetY), Math.max(peer.sourceY, peer.targetY))
    if (sharedEnd - sharedStart >= 42) y = (sharedStart + sharedEnd) / 2
  }
  return {
    nameTransform: horizontal
      ? `translate(-50%, -100%) translate(${x}px, ${y}px)`
      : `translate(${outward < 0 ? -100 : 0}%, -50%) translate(${x}px, ${y}px)`,
  }
}
