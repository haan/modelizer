import { useCallback, useMemo, useState } from 'react'
import {
  addEdge,
  applyEdgeChanges,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import { CLASS_COLOR_PALETTE, getRandomPaletteColor } from '../classPalette.js'
import { createAttribute, normalizeAttributes } from '../attributes.js'
import { getAssociationLayout } from '../components/flow/associationUtils.js'
import { normalizeEdges } from '../model/edgeUtils.js'
import {
  ASSOCIATION_EDGE_TYPE,
  ASSOCIATION_HELPER_NODE_TYPE,
  ASSOCIATION_NODE_SIZE,
  ASSOCIATIVE_EDGE_TYPE,
  CLASS_NODE_TYPE,
  HIGHLIGHT_ZOOM,
  REFLEXIVE_EDGE_TYPE,
} from '../model/constants.js'

const initialNodes = []
const initialEdges = []

export function useModelState({
  reactFlowInstance,
  reactFlowWrapper,
  showAccentColors,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(normalizeEdges(initialEdges))
  const [modelName, setModelName] = useState('Untitled model')
  const [activeSidebarItem, setActiveSidebarItem] = useState('tables')
  const [isConnecting, setIsConnecting] = useState(false)

  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((current) => normalizeEdges(applyEdgeChanges(changes, current))),
    [setEdges],
  )

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

      return setEdges((current) => {
        const connectsToAssociationHelper =
          params.source?.startsWith('assoc-edge-') ||
          params.target?.startsWith('assoc-edge-') ||
          params.sourceHandle === 'association-target' ||
          params.targetHandle === 'association-target' ||
          isAssociationHelperNode(params.source) ||
          isAssociationHelperNode(params.target)
        const nextType = connectsToAssociationHelper
          ? ASSOCIATIVE_EDGE_TYPE
          : params.source === params.target
            ? REFLEXIVE_EDGE_TYPE
            : ASSOCIATION_EDGE_TYPE
        const typeData =
          nextType === ASSOCIATIVE_EDGE_TYPE
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
        const baseEdge = {
          ...params,
          type: nextType,
          data:
            nextType === ASSOCIATIVE_EDGE_TYPE
              ? { name: classLabel, type: typeData, autoName: true }
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
          return normalizeEdges(addEdge(baseEdge, current))
        }

        const idSuffix =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${current.length + 1}`
        const nextEdge = { ...baseEdge, id: `edge-${idSuffix}` }
        return normalizeEdges([...current, nextEdge])
      })
    },
    [isAssociationHelperNode, nodes, reactFlowInstance, setEdges],
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
    return true
  }, [])

  const onAddClass = useCallback(() => {
    const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()
    const centerPosition =
      wrapperBounds && reactFlowInstance
        ? {
            x: wrapperBounds.width / 2,
            y: wrapperBounds.height / 2,
          }
        : null

    const preferredPosition =
      centerPosition && reactFlowInstance?.screenToFlowPosition
        ? reactFlowInstance.screenToFlowPosition(centerPosition)
        : centerPosition && reactFlowInstance?.project
          ? reactFlowInstance.project(centerPosition)
          : null

    setNodes((current) => {
      const idSuffix =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${current.length + 1}`
      const position =
        preferredPosition ?? {
          x: 120 + current.length * 30,
          y: 80 + current.length * 30,
        }

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

      return [
        ...current,
        {
          id: `class-${idSuffix}`,
          type: CLASS_NODE_TYPE,
          position,
          data: {
            label: `Class${current.length + 1}`,
            attributes: [],
            color: nextColor,
          },
        },
      ]
    })
  }, [reactFlowInstance, reactFlowWrapper, setNodes])

  const onRenameClass = useCallback(
    (nodeId, nextLabel) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, label: nextLabel } }
            : node,
        ),
      )
      setEdges((current) =>
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
    [setEdges, setNodes],
  )

  const onRenameAssociation = useCallback(
    (edgeId, nextName) => {
      setEdges((current) =>
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
    [setEdges],
  )

  const onDeleteAssociation = useCallback(
    (edgeId) => {
      const helperNodeId = `assoc-edge-${edgeId}`
      setEdges((current) =>
        normalizeEdges(
          current.filter(
            (edge) =>
              edge.id !== edgeId &&
              edge.source !== helperNodeId &&
              edge.target !== helperNodeId,
          ),
        ),
      )
    },
    [setEdges],
  )

  const onUpdateAssociationMultiplicity = useCallback(
    (edgeId, side, nextValue) => {
      setEdges((current) =>
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
    [setEdges],
  )

  const onUpdateAssociationRole = useCallback(
    (edgeId, side, nextValue) => {
      setEdges((current) =>
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
    [setEdges],
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
          nodes.find((node) => node.id === edge.source)
        const targetNode =
          reactFlowInstance.getNode?.(edge.target) ??
          nodes.find((node) => node.id === edge.target)
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
    [nodes, reactFlowInstance],
  )

  const onHighlightAssociation = useCallback(
    (edgeId) => {
      const edgeToFocus = edges.find((edge) => edge.id === edgeId)
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
    [edges, focusEdge, setEdges],
  )

  const onReorderClasses = useCallback(
    (nextOrderIds) => {
      setNodes((current) => {
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
    [setNodes],
  )

  const onReorderAttributes = useCallback(
    (nodeId, nextAttributes) => {
      setNodes((current) =>
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
    [setNodes],
  )

  const onUpdateAttribute = useCallback(
    (nodeId, attributeId, nextValue) => {
      const patch =
        typeof nextValue === 'string'
          ? { name: nextValue }
          : nextValue ?? {}
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = normalizeAttributes(
            nodeId,
            node.data?.attributes,
          )
          const nextAttributes = currentAttributes.map((attribute) => {
            if (attribute.id !== attributeId) {
              return attribute
            }

            const nextTypeParams = patch.typeParams
              ? { ...attribute.typeParams, ...patch.typeParams }
              : attribute.typeParams
            return {
              ...attribute,
              ...patch,
              typeParams: nextTypeParams,
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
    [setNodes],
  )

  const onAddAttribute = useCallback(
    (nodeId) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = normalizeAttributes(
            nodeId,
            node.data?.attributes,
          )
          currentAttributes.push(
            createAttribute(
              nodeId,
              `attribute${currentAttributes.length + 1}`,
            ),
          )

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
    [setNodes],
  )

  const onDeleteAttribute = useCallback(
    (nodeId, attributeId) => {
      setNodes((current) =>
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
    [setNodes],
  )

  const onUpdateClassColor = useCallback(
    (nodeId, nextColor) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, color: nextColor } }
            : node,
        ),
      )
    },
    [setNodes],
  )

  const onDeleteClass = useCallback(
    (nodeId) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId))
      setEdges((current) => {
        const removedAssociationIds = current
          .filter(
            (edge) =>
              (edge.source === nodeId || edge.target === nodeId) &&
              (edge.type === ASSOCIATION_EDGE_TYPE ||
                edge.type === REFLEXIVE_EDGE_TYPE),
          )
          .map((edge) => edge.id)
        const helperNodeIds = new Set(
          removedAssociationIds.map((edgeId) => `assoc-edge-${edgeId}`),
        )

        return normalizeEdges(
          current.filter(
            (edge) =>
              edge.source !== nodeId &&
              edge.target !== nodeId &&
              !helperNodeIds.has(edge.source) &&
              !helperNodeIds.has(edge.target),
          ),
        )
      })
    },
    [setEdges, setNodes],
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
        nodes.find((entry) => entry.id === nodeId)
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
    [nodes, reactFlowInstance, setNodes],
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

  const associationEdgeNodes = useMemo(() => {
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
          edge.type === ASSOCIATION_EDGE_TYPE ||
          edge.type === REFLEXIVE_EDGE_TYPE,
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
  }, [edges, nodes, reactFlowInstance])

  const flowNodes = useMemo(() => {
    const decoratedNodes = nodes.map((node) =>
      node.type === CLASS_NODE_TYPE
        ? {
            ...node,
            data: { ...node.data, showAccentColors },
          }
        : node,
    )
    return [...decoratedNodes, ...associationEdgeNodes]
  }, [associationEdgeNodes, nodes, showAccentColors])

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
    onRenameClass,
    onRenameAssociation,
    onDeleteAssociation,
    onUpdateAssociationMultiplicity,
    onUpdateAssociationRole,
    onHighlightAssociation,
    onReorderClasses,
    onReorderAttributes,
    onUpdateAttribute,
    onAddAttribute,
    onDeleteAttribute,
    onUpdateClassColor,
    onDeleteClass,
    onHighlightClass,
    onPaneClick,
    flowNodes,
  }
}
