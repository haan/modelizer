import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import { CLASS_COLOR_PALETTE, getRandomPaletteColor } from '../classPalette.js'
import { createAttribute, normalizeAttributes } from '../attributes.js'
import { getAssociationLayout } from '../components/flow/utils/associationUtils.js'
import { normalizeEdges } from '../model/edgeUtils.js'
import {
  ASSOCIATION_EDGE_TYPE,
  ASSOCIATION_HELPER_NODE_TYPE,
  ASSOCIATION_NODE_SIZE,
  ASSOCIATIVE_EDGE_TYPE,
  AREA_NODE_TYPE,
  COMPOSITION_EDGE_TYPE,
  CLASS_NODE_TYPE,
  DEFAULT_VIEW,
  HIGHLIGHT_ZOOM,
  NOTE_NODE_TYPE,
  REFLEXIVE_EDGE_TYPE,
  RELATIONSHIP_EDGE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../model/constants.js'

const samePosition = (a, b) => a?.x === b?.x && a?.y === b?.y

const deriveViewPositionsMeta = (node, viewPositions) => {
  const meta = node.data?.viewPositionsMeta
  if (
    meta &&
    typeof meta.conceptual === 'boolean' &&
    typeof meta.logical === 'boolean' &&
    typeof meta.physical === 'boolean'
  ) {
    return {
      conceptual: meta.conceptual,
      logical: meta.logical,
      physical: meta.physical,
    }
  }

  return {
    conceptual: true,
    logical: !samePosition(
      viewPositions[VIEW_LOGICAL],
      viewPositions[VIEW_CONCEPTUAL],
    ),
    physical:
      !samePosition(
        viewPositions[VIEW_PHYSICAL],
        viewPositions[VIEW_CONCEPTUAL],
      ) &&
      !samePosition(
        viewPositions[VIEW_PHYSICAL],
        viewPositions[VIEW_LOGICAL],
      ),
  }
}
import {
  DEFAULT_VIEW_VISIBILITY,
  normalizeVisibility,
  normalizeViewPositions,
  normalizeViewSizes,
} from '../model/viewUtils.js'

const initialNodes = []
const initialEdges = []
const CLASS_HANDLE_IDS = new Set([
  'left-source',
  'left-target',
  'right-source',
  'right-target',
  'top-source',
  'top-target',
  'bottom-source',
  'bottom-target',
])
const ASSOCIATION_HANDLE_ID = 'association-target'

const getAttributeIdFromHandle = (handleId) => {
  if (!handleId || handleId === ASSOCIATION_HANDLE_ID) {
    return null
  }

  if (CLASS_HANDLE_IDS.has(handleId)) {
    return null
  }

  const suffix = handleId.endsWith('-source')
    ? '-source'
    : handleId.endsWith('-target')
      ? '-target'
      : null
  if (!suffix) {
    return null
  }

  const trimmed = handleId.slice(0, -suffix.length)
  if (trimmed.startsWith('left-')) {
    return trimmed.slice('left-'.length)
  }
  if (trimmed.startsWith('right-')) {
    return trimmed.slice('right-'.length)
  }
  return null
}

const isAttributeHandle = (handleId) => Boolean(getAttributeIdFromHandle(handleId))

export function useModelState({
  reactFlowInstance,
  reactFlowWrapper,
  showAccentColors,
  showCompositionAggregation,
  nullDisplayMode,
  onDuplicateEdge,
  activeView = DEFAULT_VIEW,
}) {
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(normalizeEdges(initialEdges))
  const [panelNodes, setPanelNodes] = useState(initialNodes)
  const [panelEdges, setPanelEdges] = useState(normalizeEdges(initialEdges))
  const [modelName, setModelName] = useState('Untitled model')
  const [activeSidebarItem, setActiveSidebarItem] = useState('tables')
  const [isConnecting, setIsConnecting] = useState(false)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)

  const updateNodesAndPanel = useCallback(
    (updater) => {
      const nextNodes = updater(nodesRef.current)
      nodesRef.current = nextNodes
      setNodes(nextNodes)
      setPanelNodes(nextNodes)
    },
    [setNodes, setPanelNodes],
  )

  const updateEdgesAndPanel = useCallback(
    (updater) => {
      const nextEdges = normalizeEdges(updater(edgesRef.current))
      edgesRef.current = nextEdges
      setEdges(nextEdges)
      setPanelEdges(nextEdges)
    },
    [setEdges, setPanelEdges],
  )

  const setModel = useCallback(
    (nextNodes, nextEdges) => {
      nodesRef.current = nextNodes
      edgesRef.current = nextEdges
      setNodes(nextNodes)
      setEdges(nextEdges)
      setPanelNodes(nextNodes)
      setPanelEdges(nextEdges)
    },
    [setEdges, setNodes, setPanelEdges, setPanelNodes],
  )

  const normalizedActiveView =
    activeView === VIEW_LOGICAL || activeView === VIEW_PHYSICAL
      ? activeView
      : VIEW_CONCEPTUAL

  const isVisibleInView = useCallback(
    (visibility) => {
      const normalized = normalizeVisibility(visibility)
      if (normalizedActiveView === VIEW_LOGICAL) {
        return normalized.logical
      }
      if (normalizedActiveView === VIEW_PHYSICAL) {
        return normalized.physical
      }
      return normalized.conceptual
    },
    [normalizedActiveView],
  )

  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((current) => normalizeEdges(applyEdgeChanges(changes, current))),
    [setEdges],
  )

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [edges, nodes])

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((current) => {
        const nextNodes = applyNodeChanges(changes, current)
        const updatedClassIds = new Set()
        const updatedAreaIds = new Set()
        const updatedAreaSizeIds = new Set()
        const updatedNoteIds = new Set()

        changes.forEach((change) => {
          if (change.type === 'position' && change.dragging === false) {
            updatedClassIds.add(change.id)
            updatedAreaIds.add(change.id)
            updatedNoteIds.add(change.id)
          }
          if (change.type === 'dimensions') {
            updatedAreaSizeIds.add(change.id)
          }
        })

        if (
          updatedClassIds.size === 0 &&
          updatedAreaIds.size === 0 &&
          updatedAreaSizeIds.size === 0 &&
          updatedNoteIds.size === 0
        ) {
          return nextNodes
        }

        return nextNodes.map((node) => {
          if (node.type === CLASS_NODE_TYPE && updatedClassIds.has(node.id)) {
            const viewPositions = normalizeViewPositions(
              node.data?.viewPositions,
              node.position,
            )
            const viewPositionsMeta = deriveViewPositionsMeta(node, viewPositions)
            const nextViewPositions = {
              ...viewPositions,
              [normalizedActiveView]: { ...node.position },
            }

            if (
              normalizedActiveView === VIEW_CONCEPTUAL &&
              !viewPositionsMeta.logical
            ) {
              nextViewPositions[VIEW_LOGICAL] = { ...node.position }
            }

            if (
              normalizedActiveView === VIEW_CONCEPTUAL &&
              !viewPositionsMeta.physical
            ) {
              nextViewPositions[VIEW_PHYSICAL] = { ...node.position }
            }

            if (
              normalizedActiveView === VIEW_LOGICAL &&
              !viewPositionsMeta.physical
            ) {
              nextViewPositions[VIEW_PHYSICAL] = { ...node.position }
            }

            return {
              ...node,
              data: {
                ...node.data,
                viewPositions: nextViewPositions,
                viewPositionsMeta: {
                  ...viewPositionsMeta,
                  [normalizedActiveView]: true,
                },
              },
            }
          }

          if (
            node.type === AREA_NODE_TYPE &&
            (updatedAreaIds.has(node.id) || updatedAreaSizeIds.has(node.id))
          ) {
            const viewPositions = normalizeViewPositions(
              node.data?.viewPositions,
              node.position,
            )
            const viewPositionsMeta = deriveViewPositionsMeta(node, viewPositions)
            const fallbackSize = {
              width: node.width ?? node.style?.width ?? 280,
              height: node.height ?? node.style?.height ?? 180,
            }
            const viewSizes = normalizeViewSizes(
              node.data?.viewSizes,
              fallbackSize,
            )
            let nextViewPositions = viewPositions
            if (updatedAreaIds.has(node.id)) {
              nextViewPositions = {
                ...viewPositions,
                [normalizedActiveView]: { ...node.position },
              }

              if (
                normalizedActiveView === VIEW_CONCEPTUAL &&
                !viewPositionsMeta.logical
              ) {
                nextViewPositions[VIEW_LOGICAL] = { ...node.position }
              }

              if (
                normalizedActiveView === VIEW_CONCEPTUAL &&
                !viewPositionsMeta.physical
              ) {
                nextViewPositions[VIEW_PHYSICAL] = { ...node.position }
              }

              if (
                normalizedActiveView === VIEW_LOGICAL &&
                !viewPositionsMeta.physical
              ) {
                nextViewPositions[VIEW_PHYSICAL] = { ...node.position }
              }
            }
            const nextViewSizes = updatedAreaSizeIds.has(node.id)
              ? {
                  ...viewSizes,
                  [normalizedActiveView]: {
                    width: node.width ?? fallbackSize.width,
                    height: node.height ?? fallbackSize.height,
                  },
                }
              : viewSizes
            if (
              updatedAreaSizeIds.has(node.id) &&
              normalizedActiveView === VIEW_CONCEPTUAL
            ) {
              if (!viewPositionsMeta.logical) {
                nextViewSizes[VIEW_LOGICAL] = {
                  width: node.width ?? fallbackSize.width,
                  height: node.height ?? fallbackSize.height,
                }
              }
              if (!viewPositionsMeta.physical) {
                nextViewSizes[VIEW_PHYSICAL] = {
                  width: node.width ?? fallbackSize.width,
                  height: node.height ?? fallbackSize.height,
                }
              }
            }
            if (
              updatedAreaSizeIds.has(node.id) &&
              normalizedActiveView === VIEW_LOGICAL &&
              !viewPositionsMeta.physical
            ) {
              nextViewSizes[VIEW_PHYSICAL] = {
                width: node.width ?? fallbackSize.width,
                height: node.height ?? fallbackSize.height,
              }
            }

            return {
              ...node,
              data: {
                ...node.data,
                viewPositions: nextViewPositions,
                viewSizes: nextViewSizes,
                viewPositionsMeta: updatedAreaIds.has(node.id)
                  ? {
                      ...viewPositionsMeta,
                      [normalizedActiveView]: true,
                    }
                  : viewPositionsMeta,
              },
              style: {
                ...node.style,
                width: node.width ?? fallbackSize.width,
                height: node.height ?? fallbackSize.height,
              },
            }
          }

          if (node.type === NOTE_NODE_TYPE && updatedNoteIds.has(node.id)) {
            const viewPositions = normalizeViewPositions(
              node.data?.viewPositions,
              node.position,
            )
            const viewPositionsMeta = deriveViewPositionsMeta(node, viewPositions)
            const nextViewPositions = {
              ...viewPositions,
              [normalizedActiveView]: { ...node.position },
            }

            if (
              normalizedActiveView === VIEW_CONCEPTUAL &&
              !viewPositionsMeta.logical
            ) {
              nextViewPositions[VIEW_LOGICAL] = { ...node.position }
            }

            if (
              normalizedActiveView === VIEW_CONCEPTUAL &&
              !viewPositionsMeta.physical
            ) {
              nextViewPositions[VIEW_PHYSICAL] = { ...node.position }
            }

            if (
              normalizedActiveView === VIEW_LOGICAL &&
              !viewPositionsMeta.physical
            ) {
              nextViewPositions[VIEW_PHYSICAL] = { ...node.position }
            }

            return {
              ...node,
              data: {
                ...node.data,
                viewPositions: nextViewPositions,
                viewPositionsMeta: {
                  ...viewPositionsMeta,
                  [normalizedActiveView]: true,
                },
              },
            }
          }

          return node
        })
      })
    },
    [normalizedActiveView, setNodes],
  )

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        if (node.type === CLASS_NODE_TYPE) {
          const viewPositions = normalizeViewPositions(
            node.data?.viewPositions,
            node.position,
          )
          const nextPosition = viewPositions[normalizedActiveView]
          return {
            ...node,
            position: nextPosition,
            data: {
              ...node.data,
              viewPositions,
            },
          }
        }

        if (node.type === NOTE_NODE_TYPE) {
          const viewPositions = normalizeViewPositions(
            node.data?.viewPositions,
            node.position,
          )
          const nextPosition = viewPositions[normalizedActiveView]
          return {
            ...node,
            position: nextPosition,
            data: {
              ...node.data,
              viewPositions,
            },
          }
        }

        if (node.type === AREA_NODE_TYPE) {
          const fallbackSize = {
            width: node.width ?? node.style?.width ?? 280,
            height: node.height ?? node.style?.height ?? 180,
          }
          const viewPositions = normalizeViewPositions(
            node.data?.viewPositions,
            node.position,
          )
          const viewSizes = normalizeViewSizes(
            node.data?.viewSizes,
            fallbackSize,
          )
          const nextPosition = viewPositions[normalizedActiveView]
          const nextSize = viewSizes[normalizedActiveView]
          return {
            ...node,
            position: nextPosition,
            width: nextSize.width,
            height: nextSize.height,
            style: {
              ...node.style,
              width: nextSize.width,
              height: nextSize.height,
            },
            data: {
              ...node.data,
              viewPositions,
              viewSizes,
            },
          }
        }

        return node
      }),
    )
  }, [normalizedActiveView, setNodes])

  const isAssociationHelperNode = useCallback(
    (nodeId) => {
      if (!nodeId) {
        return false
      }

      const node =
        reactFlowInstance?.getNode(nodeId) ??
        nodes.find((entry) => entry.id === nodeId)
      return node?.type === ASSOCIATION_HELPER_NODE_TYPE
    },
    [nodes, reactFlowInstance],
  )

  const onConnect = useCallback(
    (params) => {
      const getNodeLabel = (nodeId) => {
        const node =
          reactFlowInstance?.getNode(nodeId) ??
          nodes.find((entry) => entry.id === nodeId)
        return node?.data?.label
      }

      return updateEdgesAndPanel((current) => {
        const connectsToAssociationHelper =
          params.source?.startsWith('assoc-edge-') ||
          params.target?.startsWith('assoc-edge-') ||
          params.sourceHandle === 'association-target' ||
          params.targetHandle === 'association-target' ||
          isAssociationHelperNode(params.source) ||
          isAssociationHelperNode(params.target)
        const isAttributeConnection =
          isAttributeHandle(params.sourceHandle) &&
          isAttributeHandle(params.targetHandle)
        const sourceAttributeId = isAttributeConnection
          ? getAttributeIdFromHandle(params.sourceHandle)
          : null
        const targetAttributeId = isAttributeConnection
          ? getAttributeIdFromHandle(params.targetHandle)
          : null
        if (
          isAttributeConnection &&
          sourceAttributeId &&
          targetAttributeId &&
          sourceAttributeId === targetAttributeId
        ) {
          return current
        }
        const nextType = isAttributeConnection
          ? RELATIONSHIP_EDGE_TYPE
          : connectsToAssociationHelper
            ? ASSOCIATIVE_EDGE_TYPE
            : params.source === params.target
              ? REFLEXIVE_EDGE_TYPE
              : ASSOCIATION_EDGE_TYPE
        const typeData =
          nextType === RELATIONSHIP_EDGE_TYPE
            ? 'relationship'
            : nextType === ASSOCIATIVE_EDGE_TYPE
              ? 'associative'
              : nextType === REFLEXIVE_EDGE_TYPE
                ? 'reflexive'
                : 'association'
        const classLabel =
          nextType === ASSOCIATIVE_EDGE_TYPE
            ? getNodeLabel(
                isAssociationHelperNode(params.source)
                  ? params.target
                  : params.source,
              ) ?? 'Association'
            : null
        const isDuplicate =
          nextType === ASSOCIATION_EDGE_TYPE
            ? false
            : current.some((edge) => {
                if (edge.type !== nextType) {
                  return false
                }

                if (nextType === REFLEXIVE_EDGE_TYPE) {
                  return (
                    edge.source === params.source &&
                    edge.target === params.target
                  )
                }

                if (nextType === ASSOCIATIVE_EDGE_TYPE) {
                  const matchesDirect =
                    edge.source === params.source &&
                    edge.target === params.target
                  const matchesReverse =
                    edge.source === params.target &&
                    edge.target === params.source
                  return matchesDirect || matchesReverse
                }

                if (nextType === RELATIONSHIP_EDGE_TYPE) {
                  const nextSourceAttr = getAttributeIdFromHandle(
                    params.sourceHandle,
                  )
                  const nextTargetAttr = getAttributeIdFromHandle(
                    params.targetHandle,
                  )
                  const existingSourceAttr = getAttributeIdFromHandle(
                    edge.sourceHandle,
                  )
                  const existingTargetAttr = getAttributeIdFromHandle(
                    edge.targetHandle,
                  )
                  if (!nextSourceAttr || !nextTargetAttr) {
                    return false
                  }
                  if (!existingSourceAttr || !existingTargetAttr) {
                    return false
                  }

                  const matchesDirect =
                    edge.source === params.source &&
                    edge.target === params.target &&
                    existingSourceAttr === nextSourceAttr &&
                    existingTargetAttr === nextTargetAttr
                  const matchesReverse =
                    edge.source === params.target &&
                    edge.target === params.source &&
                    existingSourceAttr === nextTargetAttr &&
                    existingTargetAttr === nextSourceAttr

                  return matchesDirect || matchesReverse
                }

                const matchesDirect =
                  edge.source === params.source &&
                  edge.target === params.target
                const matchesReverse =
                  edge.source === params.target &&
                  edge.target === params.source

                return matchesDirect || matchesReverse
              })

        if (isDuplicate) {
          onDuplicateEdge?.({ kind: typeData })
          return current
        }

        const baseEdge = {
          ...params,
          type: nextType,
          data:
            nextType === ASSOCIATIVE_EDGE_TYPE
              ? { name: classLabel, type: typeData, autoName: true }
              : nextType === RELATIONSHIP_EDGE_TYPE
                ? { type: typeData }
                : {
                    multiplicityA: '',
                    multiplicityB: '',
                    name: '',
                    type: typeData,
                    roleA: '',
                    roleB: '',
                  },
        }

        if (nextType !== ASSOCIATION_EDGE_TYPE) {
          return addEdge(baseEdge, current)
        }

        const idSuffix =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${current.length + 1}`
        const nextEdge = { ...baseEdge, id: `edge-${idSuffix}` }
        return [...current, nextEdge]
      })
    },
    [
      isAssociationHelperNode,
      nodes,
      onDuplicateEdge,
      reactFlowInstance,
      updateEdgesAndPanel,
    ],
  )

  const onConnectStart = useCallback(() => {
    setIsConnecting(true)
  }, [])

  const onConnectEnd = useCallback(() => {
    setIsConnecting(false)
  }, [])

  const isValidConnection = useCallback((connection) => {
    if (!connection.sourceHandle || !connection.targetHandle) {
      return false
    }
    if (connection.sourceHandle.endsWith('-target')) {
      return false
    }
    if (connection.targetHandle.endsWith('-source')) {
      return false
    }
    if (
      isAttributeHandle(connection.sourceHandle) &&
      isAttributeHandle(connection.targetHandle)
    ) {
      const sourceAttributeId = getAttributeIdFromHandle(
        connection.sourceHandle,
      )
      const targetAttributeId = getAttributeIdFromHandle(
        connection.targetHandle,
      )
      if (
        sourceAttributeId &&
        targetAttributeId &&
        sourceAttributeId === targetAttributeId
      ) {
        return false
      }
    }
    return true
  }, [])

  const onAddClass = useCallback(() => {
    const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()
    const toFlowPosition =
      reactFlowInstance?.screenToFlowPosition && wrapperBounds
        ? (point) => reactFlowInstance.screenToFlowPosition(point)
        : reactFlowInstance?.project && wrapperBounds
          ? (point) =>
              reactFlowInstance.project({
                x: point.x - wrapperBounds.left,
                y: point.y - wrapperBounds.top,
              })
          : null
    const centerPosition =
      wrapperBounds && toFlowPosition
        ? toFlowPosition({
            x: wrapperBounds.left + wrapperBounds.width / 2,
            y: wrapperBounds.top + wrapperBounds.height / 2,
          })
        : null
    const preferredPosition = centerPosition
    const viewBounds =
      wrapperBounds && toFlowPosition
        ? {
            min: toFlowPosition({
              x: wrapperBounds.left,
              y: wrapperBounds.top,
            }),
            max: toFlowPosition({
              x: wrapperBounds.right,
              y: wrapperBounds.bottom,
            }),
          }
        : null

    const buildNode = (current) => {
      const DEFAULT_NODE_WIDTH = 220
      const DEFAULT_NODE_HEIGHT = 140
      const PADDING = 24
      const STEP = 40
      const MAX_RING = 10
      const classRects = current
        .filter((node) => node.type === CLASS_NODE_TYPE)
        .map((node) => {
          const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH
          const height =
            node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT
          return {
            x: node.position.x,
            y: node.position.y,
            width,
            height,
          }
        })

      const withinBounds = (position) => {
        if (!viewBounds) {
          return true
        }
        return (
          position.x >= viewBounds.min.x + PADDING &&
          position.y >= viewBounds.min.y + PADDING &&
          position.x + DEFAULT_NODE_WIDTH <= viewBounds.max.x - PADDING &&
          position.y + DEFAULT_NODE_HEIGHT <= viewBounds.max.y - PADDING
        )
      }

      const overlaps = (position) =>
        classRects.some((rect) => {
          const right = rect.x + rect.width + PADDING
          const bottom = rect.y + rect.height + PADDING
          const nextRight = position.x + DEFAULT_NODE_WIDTH + PADDING
          const nextBottom = position.y + DEFAULT_NODE_HEIGHT + PADDING
          return (
            position.x < right &&
            nextRight > rect.x &&
            position.y < bottom &&
            nextBottom > rect.y
          )
        })

      const clampToBounds = (position) => {
        if (!viewBounds) {
          return position
        }
        const maxX = viewBounds.max.x - PADDING - DEFAULT_NODE_WIDTH
        const maxY = viewBounds.max.y - PADDING - DEFAULT_NODE_HEIGHT
        return {
          x: Math.min(Math.max(position.x, viewBounds.min.x + PADDING), maxX),
          y: Math.min(Math.max(position.y, viewBounds.min.y + PADDING), maxY),
        }
      }

      const findAvailablePosition = (origin) => {
        if (origin && withinBounds(origin) && !overlaps(origin)) {
          return origin
        }

        if (!origin) {
          return null
        }

        for (let ring = 1; ring <= MAX_RING; ring += 1) {
          const offsets = []
          for (let y = 0; y <= ring; y += 1) {
            offsets.push([ring, y])
          }
          for (let x = ring - 1; x >= -ring; x -= 1) {
            offsets.push([x, ring])
          }
          for (let y = ring - 1; y >= -ring; y -= 1) {
            offsets.push([-ring, y])
          }
          for (let x = -ring + 1; x <= ring; x += 1) {
            offsets.push([x, -ring])
          }
          for (let y = -ring + 1; y < 0; y += 1) {
            offsets.push([ring, y])
          }

          for (const [dx, dy] of offsets) {
            const candidate = {
              x: origin.x + dx * STEP,
              y: origin.y + dy * STEP,
            }
            if (withinBounds(candidate) && !overlaps(candidate)) {
              return candidate
            }
          }
        }

        return null
      }

      const idSuffix =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${current.length + 1}`
      const fallbackPosition = {
        x: 120 + current.length * 30,
        y: 80 + current.length * 30,
      }
      const position =
        findAvailablePosition(preferredPosition) ??
        findAvailablePosition(fallbackPosition) ??
        clampToBounds(preferredPosition ?? fallbackPosition)

      const usedColors = new Set(
        current
          .map((node) => node.data?.color)
          .filter((value) => typeof value === 'string' && value.length > 0),
      )
      const availableColors = CLASS_COLOR_PALETTE.filter(
        (color) => !usedColors.has(color),
      )
      const nextColor =
        availableColors.length > 0
          ? availableColors[Math.floor(Math.random() * availableColors.length)]
          : getRandomPaletteColor()

      const defaultVisibility = {
        ...DEFAULT_VIEW_VISIBILITY,
        conceptual: normalizedActiveView === VIEW_CONCEPTUAL,
      }

      const classCount = current.filter(
        (node) => node.type === CLASS_NODE_TYPE,
      ).length

      return {
        id: `class-${idSuffix}`,
        type: CLASS_NODE_TYPE,
        position,
        data: {
          label: `Class${classCount + 1}`,
          attributes: [],
          color: nextColor,
          visibility: defaultVisibility,
          viewPositions: normalizeViewPositions(null, position),
          viewPositionsMeta: {
            conceptual: normalizedActiveView === VIEW_CONCEPTUAL,
            logical: normalizedActiveView === VIEW_LOGICAL,
            physical: normalizedActiveView === VIEW_PHYSICAL,
          },
        },
      }
    }

    updateNodesAndPanel((current) => {
      const nextNode = buildNode(current)
      return [...current, nextNode]
    })
  }, [normalizedActiveView, reactFlowInstance, reactFlowWrapper, updateNodesAndPanel])

  const onAddNote = useCallback(() => {
    const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()
    const toFlowPosition =
      reactFlowInstance?.screenToFlowPosition && wrapperBounds
        ? (point) => reactFlowInstance.screenToFlowPosition(point)
        : reactFlowInstance?.project && wrapperBounds
          ? (point) =>
              reactFlowInstance.project({
                x: point.x - wrapperBounds.left,
                y: point.y - wrapperBounds.top,
              })
          : null
    const centerPosition =
      wrapperBounds && toFlowPosition
        ? toFlowPosition({
            x: wrapperBounds.left + wrapperBounds.width / 2,
            y: wrapperBounds.top + wrapperBounds.height / 2,
          })
        : null

    updateNodesAndPanel((current) => {
      const noteCount = current.filter(
        (node) => node.type === NOTE_NODE_TYPE,
      ).length
      const idSuffix =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${current.length + 1}`
      const offset = 36 * noteCount
      const position = centerPosition
        ? { x: centerPosition.x + offset, y: centerPosition.y + offset }
        : { x: 120 + offset, y: 80 + offset }
      const defaultVisibility = {
        ...DEFAULT_VIEW_VISIBILITY,
        conceptual: normalizedActiveView === VIEW_CONCEPTUAL,
      }
      const nextNote = {
        id: `note-${idSuffix}`,
        type: NOTE_NODE_TYPE,
        position,
        data: {
          label: `Note ${noteCount + 1}`,
          text: '',
          visibility: defaultVisibility,
          viewPositions: normalizeViewPositions(null, position),
          viewPositionsMeta: {
            conceptual: normalizedActiveView === VIEW_CONCEPTUAL,
            logical: normalizedActiveView === VIEW_LOGICAL,
            physical: normalizedActiveView === VIEW_PHYSICAL,
          },
        },
      }
      return [...current, nextNote]
    })
  }, [
    normalizedActiveView,
    reactFlowInstance,
    reactFlowWrapper,
    updateNodesAndPanel,
  ])

  const onAddArea = useCallback(() => {
    const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()
    const toFlowPosition =
      reactFlowInstance?.screenToFlowPosition && wrapperBounds
        ? (point) => reactFlowInstance.screenToFlowPosition(point)
        : reactFlowInstance?.project && wrapperBounds
          ? (point) =>
              reactFlowInstance.project({
                x: point.x - wrapperBounds.left,
                y: point.y - wrapperBounds.top,
              })
          : null
    const centerPosition =
      wrapperBounds && toFlowPosition
        ? toFlowPosition({
            x: wrapperBounds.left + wrapperBounds.width / 2,
            y: wrapperBounds.top + wrapperBounds.height / 2,
          })
        : null

    updateNodesAndPanel((current) => {
      const areaCount = current.filter(
        (node) => node.type === AREA_NODE_TYPE,
      ).length
      const idSuffix =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${current.length + 1}`
      const offset = 48 * areaCount
      const position = centerPosition
        ? { x: centerPosition.x + offset, y: centerPosition.y + offset }
        : { x: 160 + offset, y: 120 + offset }
      const defaultVisibility = {
        ...DEFAULT_VIEW_VISIBILITY,
        conceptual: normalizedActiveView === VIEW_CONCEPTUAL,
      }
      const nextArea = {
        id: `area-${idSuffix}`,
        type: AREA_NODE_TYPE,
        position,
        width: 280,
        height: 180,
        data: {
          label: `Area ${areaCount + 1}`,
          color: getRandomPaletteColor(),
          visibility: defaultVisibility,
          viewPositions: normalizeViewPositions(null, position),
          viewSizes: normalizeViewSizes(null, { width: 280, height: 180 }),
          viewPositionsMeta: {
            conceptual: normalizedActiveView === VIEW_CONCEPTUAL,
            logical: normalizedActiveView === VIEW_LOGICAL,
            physical: normalizedActiveView === VIEW_PHYSICAL,
          },
        },
        style: { zIndex: -1, width: 280, height: 180 },
      }
      return [...current, nextArea]
    })
  }, [
    normalizedActiveView,
    reactFlowInstance,
    reactFlowWrapper,
    updateNodesAndPanel,
  ])

  const onSyncViewPositions = useCallback(() => {
    if (normalizedActiveView === VIEW_CONCEPTUAL) {
      return
    }

    updateNodesAndPanel((current) =>
      current.map((node) => {
        if (node.type !== CLASS_NODE_TYPE) {
          return node
        }

        const viewPositions = normalizeViewPositions(
          node.data?.viewPositions,
          node.position,
        )
        const viewPositionsMeta = deriveViewPositionsMeta(node, viewPositions)
        const nextViewPositions = { ...viewPositions }

        if (normalizedActiveView === VIEW_LOGICAL) {
          nextViewPositions[VIEW_LOGICAL] = {
            ...viewPositions[VIEW_CONCEPTUAL],
          }
        } else if (normalizedActiveView === VIEW_PHYSICAL) {
          nextViewPositions[VIEW_PHYSICAL] = {
            ...viewPositions[VIEW_LOGICAL],
          }
        }

        const nextPosition = nextViewPositions[normalizedActiveView]

        return {
          ...node,
          position: { ...nextPosition },
          data: {
            ...node.data,
            viewPositions: nextViewPositions,
            viewPositionsMeta: {
              ...viewPositionsMeta,
              [normalizedActiveView]: true,
            },
          },
        }
      }),
    )
  }, [normalizedActiveView, updateNodesAndPanel])

  const onRenameClass = useCallback(
    (nodeId, nextLabel) => {
      updateNodesAndPanel((current) =>
        current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, label: nextLabel } }
            : node,
        ),
      )
      updateEdgesAndPanel((current) =>
        current.map((edge) =>
          edge.type === ASSOCIATIVE_EDGE_TYPE &&
          (edge.source === nodeId || edge.target === nodeId) &&
          edge.data?.autoName !== false
            ? {
                ...edge,
                data: {
                  ...(edge.data ?? {}),
                  name: nextLabel,
                },
              }
            : edge,
        ),
      )
    },
    [updateEdgesAndPanel, updateNodesAndPanel],
  )

  const onRenameNote = useCallback(
    (noteId, nextLabel) => {
      updateNodesAndPanel((current) =>
        current.map((node) =>
          node.id === noteId
            ? { ...node, data: { ...node.data, label: nextLabel } }
            : node,
        ),
      )
    },
    [updateNodesAndPanel],
  )

  const onRenameArea = useCallback(
    (areaId, nextLabel) => {
      updateNodesAndPanel((current) =>
        current.map((node) =>
          node.id === areaId
            ? { ...node, data: { ...node.data, label: nextLabel } }
            : node,
        ),
      )
    },
    [updateNodesAndPanel],
  )

  const onUpdateNoteText = useCallback(
    (noteId, nextText) => {
      updateNodesAndPanel((current) =>
        current.map((node) =>
          node.id === noteId
            ? { ...node, data: { ...node.data, text: nextText } }
            : node,
        ),
      )
    },
    [updateNodesAndPanel],
  )

  const onUpdateNoteVisibility = useCallback(
    (noteId, nextVisibility) => {
      updateNodesAndPanel((current) =>
        current.map((node) => {
          if (node.id !== noteId) {
            return node
          }

          const currentVisibility = normalizeVisibility(node.data?.visibility)
          return {
            ...node,
            data: {
              ...node.data,
              visibility: { ...currentVisibility, ...nextVisibility },
            },
          }
        }),
      )
    },
    [updateNodesAndPanel],
  )

  const onUpdateAreaColor = useCallback(
    (areaId, nextColor) => {
      updateNodesAndPanel((current) =>
        current.map((node) =>
          node.id === areaId
            ? { ...node, data: { ...node.data, color: nextColor } }
            : node,
        ),
      )
    },
    [updateNodesAndPanel],
  )

  const onUpdateAreaVisibility = useCallback(
    (areaId, nextVisibility) => {
      updateNodesAndPanel((current) =>
        current.map((node) => {
          if (node.id !== areaId) {
            return node
          }

          const currentVisibility = normalizeVisibility(node.data?.visibility)
          return {
            ...node,
            data: {
              ...node.data,
              visibility: { ...currentVisibility, ...nextVisibility },
            },
          }
        }),
      )
    },
    [updateNodesAndPanel],
  )

  const onDeleteNote = useCallback(
    (noteId) => {
      updateNodesAndPanel((current) =>
        current.filter((node) => node.id !== noteId),
      )
    },
    [updateNodesAndPanel],
  )

  const onDeleteArea = useCallback(
    (areaId) => {
      updateNodesAndPanel((current) =>
        current.filter((node) => node.id !== areaId),
      )
    },
    [updateNodesAndPanel],
  )

  const onRenameAssociation = useCallback(
    (edgeId, nextName) => {
      updateEdgesAndPanel((current) =>
        current.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...(edge.data ?? {}),
                  name: nextName,
                  ...(edge.type === ASSOCIATIVE_EDGE_TYPE
                    ? { autoName: false }
                    : {}),
                },
              }
            : edge,
        ),
      )
    },
    [updateEdgesAndPanel],
  )

  const onDeleteAssociation = useCallback(
    (edgeId) => {
      const helperNodeId = `assoc-edge-${edgeId}`
      updateEdgesAndPanel((current) =>
        current.filter(
          (edge) =>
            edge.id !== edgeId &&
            edge.source !== helperNodeId &&
            edge.target !== helperNodeId,
        ),
      )
    },
    [updateEdgesAndPanel],
  )

  const onUpdateAssociationMultiplicity = useCallback(
    (edgeId, side, nextValue) => {
      updateEdgesAndPanel((current) =>
        current.map((edge) => {
          if (edge.id !== edgeId) {
            return edge
          }

          const key = side === 'A' ? 'multiplicityA' : 'multiplicityB'
          return {
            ...edge,
            data: {
              ...(edge.data ?? {}),
              [key]: nextValue,
            },
          }
        }),
      )
    },
    [updateEdgesAndPanel],
  )

  const onUpdateAssociationRole = useCallback(
    (edgeId, side, nextValue) => {
      updateEdgesAndPanel((current) =>
        current.map((edge) => {
          if (edge.id !== edgeId) {
            return edge
          }

          const key = side === 'A' ? 'roleA' : 'roleB'
          return {
            ...edge,
            data: {
              ...(edge.data ?? {}),
              [key]: nextValue,
            },
          }
        }),
      )
    },
    [updateEdgesAndPanel],
  )

  const onToggleAssociationComposition = useCallback(
    (edgeId, nextValue) => {
      updateEdgesAndPanel((current) => {
        const nextEdges = current.map((edge) => {
          if (edge.id !== edgeId) {
            return edge
          }
          if (
            edge.type !== ASSOCIATION_EDGE_TYPE &&
            edge.type !== COMPOSITION_EDGE_TYPE
          ) {
            return edge
          }
          if (nextValue && edge.source === edge.target) {
            return edge
          }
          const nextType = nextValue
            ? COMPOSITION_EDGE_TYPE
            : ASSOCIATION_EDGE_TYPE
          return {
            ...edge,
            type: nextType,
            data: {
              ...(edge.data ?? {}),
              type: nextValue ? 'composition' : 'association',
            },
          }
        })
        return normalizeEdges(nextEdges)
      })
    },
    [updateEdgesAndPanel],
  )

  const focusEdge = useCallback(
    (edge) => {
      if (!edge || !reactFlowInstance?.setCenter) {
        return
      }

      const getNodeCenter = (node) => {
        const position =
          node?.positionAbsolute ??
          node?.internals?.positionAbsolute ??
          node?.position
        if (!position) {
          return null
        }
        const width = node?.measured?.width ?? node?.width ?? 0
        const height = node?.measured?.height ?? node?.height ?? 0
        return {
          x: position.x + width / 2,
          y: position.y + height / 2,
        }
      }

      const helperNode = reactFlowInstance.getNode?.(`assoc-edge-${edge.id}`)
      let center = getNodeCenter(helperNode)

      if (!center) {
        const sourceNode =
          reactFlowInstance.getNode?.(edge.source) ??
          nodesRef.current.find((node) => node.id === edge.source)
        const targetNode =
          reactFlowInstance.getNode?.(edge.target) ??
          nodesRef.current.find((node) => node.id === edge.target)
        const sourceCenter = getNodeCenter(sourceNode)
        const targetCenter = getNodeCenter(targetNode)

        if (sourceCenter && targetCenter) {
          center = {
            x: (sourceCenter.x + targetCenter.x) / 2,
            y: (sourceCenter.y + targetCenter.y) / 2,
          }
        } else {
          center = sourceCenter
        }
      }

      if (!center) {
        return
      }

      reactFlowInstance.setCenter(center.x, center.y, {
        zoom: HIGHLIGHT_ZOOM,
        duration: 300,
      })
    },
    [reactFlowInstance],
  )

  const onHighlightAssociation = useCallback(
    (edgeId) => {
      const edgeToFocus = edgesRef.current.find((edge) => edge.id === edgeId)
      focusEdge(edgeToFocus)
      setEdges((current) =>
        current.map((edge) => {
          return {
            ...edge,
            selected: edge.id === edgeId,
            data: edge.data,
          }
        }),
      )
    },
    [focusEdge, setEdges],
  )

  const onReorderClasses = useCallback(
    (nextOrderIds) => {
      updateNodesAndPanel((current) => {
        const byId = new Map(current.map((node) => [node.id, node]))
        const ordered = []
        const seen = new Set()

        nextOrderIds.forEach((id) => {
          const node = byId.get(id)
          if (node) {
            ordered.push(node)
            seen.add(id)
          }
        })

        current.forEach((node) => {
          if (!seen.has(node.id)) {
            ordered.push(node)
          }
        })

        return ordered
      })
    },
    [updateNodesAndPanel],
  )

  const onReorderAttributes = useCallback(
    (nodeId, nextAttributes) => {
      updateNodesAndPanel((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  attributes: normalizeAttributes(nodeId, nextAttributes),
                },
              }
            : node,
        ),
      )
    },
    [updateNodesAndPanel],
  )

  const onUpdateAttribute = useCallback(
    (nodeId, attributeId, nextValue) => {
      const patch =
        typeof nextValue === 'string'
          ? { name: nextValue }
          : nextValue ?? {}
      updateNodesAndPanel((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = Array.isArray(node.data?.attributes)
            ? node.data.attributes
            : normalizeAttributes(nodeId, node.data?.attributes)
          const nextAttributes = currentAttributes.map((attribute) => {
            if (attribute.id !== attributeId) {
              return attribute
            }

            const nextTypeParams = patch.typeParams
              ? { ...attribute.typeParams, ...patch.typeParams }
              : attribute.typeParams
            const nextVisibility = patch.visibility
              ? { ...attribute.visibility, ...patch.visibility }
              : attribute.visibility
            return {
              ...attribute,
              ...patch,
              typeParams: nextTypeParams,
              visibility: nextVisibility,
            }
          })
          return {
            ...node,
            data: {
              ...node.data,
              attributes: nextAttributes,
            },
          }
        }),
      )
    },
    [updateNodesAndPanel],
  )

  const onAddAttribute = useCallback(
    (nodeId) => {
      updateNodesAndPanel((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = normalizeAttributes(
            nodeId,
            node.data?.attributes,
          )
          const nextAttribute = createAttribute(
            nodeId,
            `attribute${currentAttributes.length + 1}`,
          )
          if (normalizedActiveView !== VIEW_CONCEPTUAL) {
            nextAttribute.visibility = {
              ...nextAttribute.visibility,
              conceptual: false,
            }
          }
          currentAttributes.push(nextAttribute)

          return {
            ...node,
            data: {
              ...node.data,
              attributes: currentAttributes,
            },
          }
        }),
      )
    },
    [normalizedActiveView, updateNodesAndPanel],
  )

  const onDeleteAttribute = useCallback(
    (nodeId, attributeId) => {
      updateNodesAndPanel((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = normalizeAttributes(
            nodeId,
            node.data?.attributes,
          )
          const nextAttributes = currentAttributes.filter(
            (attribute) => attribute.id !== attributeId,
          )

          return {
            ...node,
            data: {
              ...node.data,
              attributes: nextAttributes,
            },
          }
        }),
      )
    },
    [updateNodesAndPanel],
  )

  const onUpdateClassColor = useCallback(
    (nodeId, nextColor) => {
      updateNodesAndPanel((current) =>
        current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, color: nextColor } }
            : node,
        ),
      )
    },
    [updateNodesAndPanel],
  )

  const onUpdateClassVisibility = useCallback(
    (nodeId, nextVisibility) => {
      updateNodesAndPanel((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentVisibility = normalizeVisibility(node.data?.visibility)
          return {
            ...node,
            data: {
              ...node.data,
              visibility: { ...currentVisibility, ...nextVisibility },
            },
          }
        }),
      )
    },
    [updateNodesAndPanel],
  )

  const onDeleteClass = useCallback(
    (nodeId) => {
      updateNodesAndPanel((current) =>
        current.filter((node) => node.id !== nodeId),
      )
      updateEdgesAndPanel((current) => {
        const removedAssociationIds = current
          .filter(
            (edge) =>
              (edge.source === nodeId || edge.target === nodeId) &&
              (edge.type === ASSOCIATION_EDGE_TYPE ||
                edge.type === REFLEXIVE_EDGE_TYPE ||
                edge.type === COMPOSITION_EDGE_TYPE),
          )
          .map((edge) => edge.id)
        const helperNodeIds = new Set(
          removedAssociationIds.map((edgeId) => `assoc-edge-${edgeId}`),
        )

        return current.filter(
          (edge) =>
            edge.source !== nodeId &&
            edge.target !== nodeId &&
            !helperNodeIds.has(edge.source) &&
            !helperNodeIds.has(edge.target),
        )
      })
    },
    [updateEdgesAndPanel, updateNodesAndPanel],
  )

  const onHighlightClass = useCallback(
    (nodeId) => {
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          selected: node.id === nodeId,
        })),
      )

      const node =
        reactFlowInstance?.getNode(nodeId) ??
        nodesRef.current.find((entry) => entry.id === nodeId)
      if (!node || !reactFlowInstance?.setCenter) {
        return
      }

      const position =
        node.positionAbsolute ??
        node.internals?.positionAbsolute ??
        node.position
      if (!position) {
        return
      }

      const width = node.measured?.width ?? node.width ?? 0
      const height = node.measured?.height ?? node.height ?? 0
      const centerX = position.x + width / 2
      const centerY = position.y + height / 2

      reactFlowInstance.setCenter(centerX, centerY, {
        zoom: HIGHLIGHT_ZOOM,
        duration: 300,
      })
    },
    [reactFlowInstance, setNodes],
  )

  const onHighlightNote = useCallback(
    (noteId) => {
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          selected: node.id === noteId,
        })),
      )

      const node =
        reactFlowInstance?.getNode(noteId) ??
        nodesRef.current.find((entry) => entry.id === noteId)
      if (!node || !reactFlowInstance?.setCenter) {
        return
      }

      const position =
        node.positionAbsolute ??
        node.internals?.positionAbsolute ??
        node.position
      if (!position) {
        return
      }

      const width = node.measured?.width ?? node.width ?? 0
      const height = node.measured?.height ?? node.height ?? 0
      const centerX = position.x + width / 2
      const centerY = position.y + height / 2

      reactFlowInstance.setCenter(centerX, centerY, {
        zoom: HIGHLIGHT_ZOOM,
        duration: 300,
      })
    },
    [reactFlowInstance, setNodes],
  )

  const onHighlightArea = useCallback(
    (areaId) => {
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          selected: node.id === areaId,
        })),
      )

      const node =
        reactFlowInstance?.getNode(areaId) ??
        nodesRef.current.find((entry) => entry.id === areaId)
      if (!node || !reactFlowInstance?.setCenter) {
        return
      }

      const position =
        node.positionAbsolute ??
        node.internals?.positionAbsolute ??
        node.position
      if (!position) {
        return
      }

      const width = node.measured?.width ?? node.width ?? 0
      const height = node.measured?.height ?? node.height ?? 0
      const centerX = position.x + width / 2
      const centerY = position.y + height / 2

      reactFlowInstance.setCenter(centerX, centerY, {
        zoom: HIGHLIGHT_ZOOM,
        duration: 300,
      })
    },
    [reactFlowInstance, setNodes],
  )

  const clearAssociationHighlight = useCallback(() => {
    setEdges((current) =>
      current.map((edge) => {
        if (!edge.selected) {
          return edge
        }
        return { ...edge, selected: false, data: edge.data }
      }),
    )
  }, [setEdges])

  const onPaneClick = useCallback(() => {
    clearAssociationHighlight()
  }, [clearAssociationHighlight])

  const visibleClassIds = useMemo(() => {
    const ids = new Set()
    nodes.forEach((node) => {
      if (node.type !== CLASS_NODE_TYPE) {
        return
      }
      if (isVisibleInView(node.data?.visibility)) {
        ids.add(node.id)
      }
    })
    return ids
  }, [isVisibleInView, nodes])

  const visibleAttributeIds = useMemo(() => {
    if (normalizedActiveView === VIEW_CONCEPTUAL) {
      return new Set()
    }

    const ids = new Set()
    panelNodes.forEach((node) => {
      if (node.type !== CLASS_NODE_TYPE) {
        return
      }
      const attributes = Array.isArray(node.data?.attributes)
        ? node.data.attributes
        : []
      attributes.forEach((attribute) => {
        const visibility = normalizeVisibility(attribute?.visibility)
        if (isVisibleInView(visibility)) {
          ids.add(`${node.id}:${attribute.id}`)
        }
      })
    })
    return ids
  }, [isVisibleInView, normalizedActiveView, panelNodes])

  const associationEdgeNodes = useMemo(() => {
    if (normalizedActiveView !== VIEW_CONCEPTUAL) {
      return []
    }

    const nodeMap = new Map(nodes.map((node) => [node.id, node]))
    const getNode = (nodeId) =>
      reactFlowInstance?.getNode(nodeId) ?? nodeMap.get(nodeId)
    const getNodeRect = (node) => {
      const width = node?.measured?.width ?? node?.width ?? 0
      const height = node?.measured?.height ?? node?.height ?? 0
      const position =
        node?.internals?.positionAbsolute ??
        node?.positionAbsolute ??
        node?.position ??
        null

      if (!position || !width || !height) {
        return null
      }

      return { x: position.x, y: position.y, width, height }
    }

    return edges
      .filter(
        (edge) =>
          (edge.type === ASSOCIATION_EDGE_TYPE ||
            edge.type === REFLEXIVE_EDGE_TYPE) &&
          visibleClassIds.has(edge.source) &&
          visibleClassIds.has(edge.target),
      )
      .map((edge) => {
        if (edge.type === REFLEXIVE_EDGE_TYPE) {
          const sourceNode = getNode(edge.source)
          if (
            !sourceNode ||
            (sourceNode.type !== CLASS_NODE_TYPE &&
              sourceNode.type !== 'umlClass')
          ) {
            return null
          }

          const rect = getNodeRect(sourceNode)
          if (!rect) {
            return null
          }

          const heightStep = Math.min(40, rect.height / 4)
          const startX = rect.x
          const startY = rect.y + heightStep
          const upY = startY - heightStep * 2

          return {
            id: `assoc-edge-${edge.id}`,
            type: ASSOCIATION_HELPER_NODE_TYPE,
            position: {
              x: startX - ASSOCIATION_NODE_SIZE / 2,
              y: upY - ASSOCIATION_NODE_SIZE / 2,
            },
            width: ASSOCIATION_NODE_SIZE,
            height: ASSOCIATION_NODE_SIZE,
            data: { edgeId: edge.id },
            className: 'association-helper-node',
            style: {
              visibility: 'visible',
              opacity: 1,
              width: ASSOCIATION_NODE_SIZE,
              height: ASSOCIATION_NODE_SIZE,
            },
            draggable: false,
            selectable: false,
            focusable: false,
            connectable: true,
          }
        }

        const sourceNode = getNode(edge.source)
        const targetNode = getNode(edge.target)
        if (
          !sourceNode ||
          !targetNode ||
          (sourceNode.type !== CLASS_NODE_TYPE &&
            sourceNode.type !== 'umlClass') ||
          (targetNode.type !== CLASS_NODE_TYPE &&
            targetNode.type !== 'umlClass')
        ) {
          return null
        }

        const layout = getAssociationLayout(sourceNode, targetNode, edge.data)
        if (!layout) {
          return null
        }

        return {
          id: `assoc-edge-${edge.id}`,
          type: ASSOCIATION_HELPER_NODE_TYPE,
          position: {
            x: layout.labelX - ASSOCIATION_NODE_SIZE / 2,
            y: layout.labelY - ASSOCIATION_NODE_SIZE / 2,
          },
          width: ASSOCIATION_NODE_SIZE,
          height: ASSOCIATION_NODE_SIZE,
          data: { edgeId: edge.id },
          className: 'association-helper-node',
          style: {
            visibility: 'visible',
            opacity: 1,
            width: ASSOCIATION_NODE_SIZE,
            height: ASSOCIATION_NODE_SIZE,
          },
          draggable: false,
          selectable: false,
          focusable: false,
          connectable: true,
        }
      })
      .filter(Boolean)
  }, [edges, nodes, normalizedActiveView, reactFlowInstance, visibleClassIds])

  const flowEdges = useMemo(() => {
    if (normalizedActiveView !== VIEW_CONCEPTUAL) {
      return edges.filter((edge) => {
        if (edge.type !== RELATIONSHIP_EDGE_TYPE) {
          return false
        }

        if (!visibleClassIds.has(edge.source) || !visibleClassIds.has(edge.target)) {
          return false
        }

        const sourceAttributeId = getAttributeIdFromHandle(edge.sourceHandle)
        const targetAttributeId = getAttributeIdFromHandle(edge.targetHandle)
        if (!sourceAttributeId || !targetAttributeId) {
          return false
        }

        if (!visibleAttributeIds.has(`${edge.source}:${sourceAttributeId}`)) {
          return false
        }

        if (!visibleAttributeIds.has(`${edge.target}:${targetAttributeId}`)) {
          return false
        }

        return true
      })
    }

    const visibleAssociationEdges = edges.filter((edge) => {
      if (
        edge.type !== ASSOCIATION_EDGE_TYPE &&
        edge.type !== REFLEXIVE_EDGE_TYPE &&
        edge.type !== COMPOSITION_EDGE_TYPE
      ) {
        return false
      }

      if (
        edge.type === COMPOSITION_EDGE_TYPE &&
        !showCompositionAggregation
      ) {
        return false
      }

      return (
        visibleClassIds.has(edge.source) && visibleClassIds.has(edge.target)
      )
    })
    const visibleAssociationIds = new Set(
      visibleAssociationEdges.map((edge) => edge.id),
    )
    const visibleHelperIds = new Set(
      visibleAssociationEdges.map((edge) => `assoc-edge-${edge.id}`),
    )

    const visibleAssociativeEdges = edges.filter((edge) => {
      if (edge.type !== ASSOCIATIVE_EDGE_TYPE) {
        return false
      }

      const helperId = edge.source?.startsWith('assoc-edge-')
        ? edge.source
        : edge.target?.startsWith('assoc-edge-')
          ? edge.target
          : null
      if (!helperId || !visibleHelperIds.has(helperId)) {
        return false
      }

      const classId =
        helperId === edge.source ? edge.target : edge.source
      if (!classId || !visibleClassIds.has(classId)) {
        return false
      }

      const baseAssociationId = helperId.replace('assoc-edge-', '')
      return visibleAssociationIds.has(baseAssociationId)
    })

    return [...visibleAssociationEdges, ...visibleAssociativeEdges]
  }, [
    edges,
    normalizedActiveView,
    showCompositionAggregation,
    visibleAttributeIds,
    visibleClassIds,
  ])

  const flowNodes = useMemo(() => {
    const decoratedNodes = nodes
      .filter((node) => {
        if (
          node.type === CLASS_NODE_TYPE ||
          node.type === AREA_NODE_TYPE ||
          node.type === NOTE_NODE_TYPE
        ) {
          return isVisibleInView(node.data?.visibility)
        }
        return true
      })
      .map((node) => {
        if (node.type === CLASS_NODE_TYPE) {
          return {
            ...node,
            data: {
              ...node.data,
              showAccentColors,
              showCompositionAggregation,
              nullDisplayMode,
              activeView: normalizedActiveView,
            },
          }
        }

        if (node.type === AREA_NODE_TYPE) {
          const width =
            node.style?.width ?? node.width ?? node.measured?.width ?? undefined
          const height =
            node.style?.height ??
            node.height ??
            node.measured?.height ??
            undefined
          return {
            ...node,
            style: {
              ...node.style,
              zIndex: -1,
              ...(width ? { width } : {}),
              ...(height ? { height } : {}),
            },
          }
        }

        return node
      })
    return [...decoratedNodes, ...associationEdgeNodes]
  }, [
    nullDisplayMode,
    associationEdgeNodes,
    isVisibleInView,
    nodes,
    normalizedActiveView,
    showAccentColors,
    showCompositionAggregation,
  ])

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    modelName,
    setModelName,
    activeSidebarItem,
    setActiveSidebarItem,
    isConnecting,
    onConnect,
    onConnectStart,
    onConnectEnd,
    isValidConnection,
    onAddClass,
    onAddNote,
    onAddArea,
    onSyncViewPositions,
    onRenameClass,
    onRenameNote,
    onRenameArea,
    onRenameAssociation,
    onDeleteAssociation,
    onDeleteNote,
    onUpdateNoteVisibility,
    onDeleteArea,
    onUpdateAreaVisibility,
    onUpdateAssociationMultiplicity,
    onUpdateAssociationRole,
    onToggleAssociationComposition,
    onHighlightAssociation,
    onHighlightNote,
    onHighlightArea,
    onReorderClasses,
    onReorderAttributes,
    onUpdateAttribute,
    onUpdateNoteText,
    onUpdateAreaColor,
    onAddAttribute,
    onDeleteAttribute,
    onUpdateClassColor,
    onUpdateClassVisibility,
    onDeleteClass,
    onHighlightClass,
    onPaneClick,
    flowNodes,
    flowEdges,
    panelNodes,
    panelEdges,
    setModel,
  }
}
