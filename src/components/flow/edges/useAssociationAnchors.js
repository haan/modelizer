import { useStore } from '@xyflow/react'
import { getAssociationEndpointAllocations } from '../utils/associationUtils.js'

// All edge components share one allocation per React Flow store snapshot.
// A WeakMap avoids retaining old snapshots and keeps separate export canvases isolated.
const allocations = new WeakMap()

export function getAssociationAnchorsFromState(state, id) {
  if (!allocations.has(state)) {
    allocations.set(state, getAssociationEndpointAllocations(state.edges, key => state.nodeLookup.get(key)))
  }
  return allocations.get(state).get(id)
}

const samePoint = (a, b) => a?.x === b?.x && a?.y === b?.y
const sameAnchors = (a, b) => samePoint(a?.source, b?.source) && samePoint(a?.target, b?.target)

export function useAssociationAnchors(id) {
  return useStore(state => getAssociationAnchorsFromState(state, id), sameAnchors)
}
