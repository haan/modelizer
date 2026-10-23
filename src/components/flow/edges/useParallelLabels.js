import { useStore } from '@xyflow/react'
import { getAssociationLayout } from '../utils/associationUtils.js'
import { getOrthogonalPeer, getParallelLabelPlacement } from '../utils/parallelLabelUtils.js'
import { useAssociationAnchors } from './useAssociationAnchors.js'

export function useParallelLabels(id, source, target, data, sourceNode, targetNode, layout) {
  const peer = useStore(state => data?.parallelCount === 2
    ? getOrthogonalPeer(state.edges, id, source, target)
    : null)
  const peerAnchors = useAssociationAnchors(peer?.id)
  if (!peer || !layout) return null
  const reversed = peer.source !== source
  const peerLayout = getAssociationLayout(
    reversed ? targetNode : sourceNode,
    reversed ? sourceNode : targetNode,
    peer.data,
    peerAnchors,
  )
  if (!peerLayout) return null
  // Compare endpoints at the same class, even when source/target are reversed.
  const alignedPeer = reversed ? {
    ...peerLayout,
    sourceX: peerLayout.targetX,
    sourceY: peerLayout.targetY,
    sourcePos: peerLayout.targetPos,
    targetX: peerLayout.sourceX,
    targetY: peerLayout.sourceY,
    targetPos: peerLayout.sourcePos,
  } : peerLayout
  return getParallelLabelPlacement(layout, alignedPeer)
}
