import {
  ASSOCIATION_EDGE_TYPE,
  COMPOSITION_EDGE_TYPE,
  REFLEXIVE_EDGE_TYPE,
} from './constants.js'

function getFloatingGroupKey(edge) {
  if (!edge.source || !edge.target) {
    return null
  }

  const [first, second] =
    edge.source < edge.target
      ? [edge.source, edge.target]
      : [edge.target, edge.source]

  return `${first}|${second}`
}

function recomputeFloatingEdgeParallels(edges) {
  const groups = new Map()

  edges.forEach((edge) => {
    if (
      edge.type !== ASSOCIATION_EDGE_TYPE &&
      edge.type !== COMPOSITION_EDGE_TYPE
    ) {
      return
    }

    const key = getFloatingGroupKey(edge)
    if (!key) {
      return
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups.get(key).push(edge)
  })

  const metaById = new Map()
  groups.forEach((group) => {
    const ordered = [...group].sort((a, b) =>
      String(a.id).localeCompare(String(b.id)),
    )
    ordered.forEach((edge, index) => {
      metaById.set(edge.id, {
        parallelIndex: index,
        parallelCount: ordered.length,
      })
    })
  })

  let didChange = false
  const nextEdges = edges.map((edge) => {
    if (
      edge.type !== ASSOCIATION_EDGE_TYPE &&
      edge.type !== COMPOSITION_EDGE_TYPE
    ) {
      return edge
    }

    const meta = metaById.get(edge.id)
    if (!meta) {
      return edge
    }

    const currentIndex = edge.data?.parallelIndex
    const currentCount = edge.data?.parallelCount
    if (currentIndex !== meta.parallelIndex || currentCount !== meta.parallelCount) {
      didChange = true
    }

    return {
      ...edge,
      data: {
        ...(edge.data ?? {}),
        parallelIndex: meta.parallelIndex,
        parallelCount: meta.parallelCount,
      },
    }
  })

  return didChange ? nextEdges : edges
}

export function normalizeEdges(edges) {
  const withParallels = recomputeFloatingEdgeParallels(edges)
  return recomputeReflexiveEdgeIndices(withParallels)
}

function recomputeReflexiveEdgeIndices(edges) {
  const groups = new Map()

  edges.forEach((edge) => {
    if (edge.type !== REFLEXIVE_EDGE_TYPE) {
      return
    }

    if (!edge.source) {
      return
    }

    if (!groups.has(edge.source)) {
      groups.set(edge.source, [])
    }

    groups.get(edge.source).push(edge)
  })

  const metaById = new Map()
  groups.forEach((group) => {
    const ordered = [...group].sort((a, b) => {
      const aIndex = Number.isFinite(a.data?.reflexiveIndex)
        ? a.data.reflexiveIndex
        : Number.POSITIVE_INFINITY
      const bIndex = Number.isFinite(b.data?.reflexiveIndex)
        ? b.data.reflexiveIndex
        : Number.POSITIVE_INFINITY

      if (aIndex !== bIndex) {
        return aIndex - bIndex
      }

      return String(a.id).localeCompare(String(b.id))
    })

    ordered.forEach((edge, index) => {
      metaById.set(edge.id, {
        reflexiveIndex: index,
        reflexiveCount: ordered.length,
      })
    })
  })

  let didChange = false
  const nextEdges = edges.map((edge) => {
    if (edge.type !== REFLEXIVE_EDGE_TYPE) {
      return edge
    }

    const meta = metaById.get(edge.id)
    if (!meta) {
      return edge
    }

    const currentIndex = edge.data?.reflexiveIndex
    const currentCount = edge.data?.reflexiveCount
    if (
      currentIndex !== meta.reflexiveIndex ||
      currentCount !== meta.reflexiveCount
    ) {
      didChange = true
    }

    return {
      ...edge,
      data: {
        ...(edge.data ?? {}),
        reflexiveIndex: meta.reflexiveIndex,
        reflexiveCount: meta.reflexiveCount,
      },
    }
  })

  return didChange ? nextEdges : edges
}
