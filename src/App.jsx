import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
  addEdge,
  applyEdgeChanges,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import { edgeTypes, nodeTypes } from './flowTypes.js'
import { getPaletteColor, getRandomPaletteColor } from './classPalette.js'
import { createAttribute, normalizeAttributes } from './attributes.js'
import { InfoPanel, Navbar, Sidebar } from './components/layout/index.js'
import { getAssociationLayout } from './components/flow/associationUtils.js'

const ASSOCIATION_EDGE_TYPE = 'association'
const ASSOCIATIVE_EDGE_TYPE = 'associativeAssociation'
const REFLEXIVE_EDGE_TYPE = 'reflexiveAssociation'
const ASSOCIATION_HELPER_NODE_TYPE = 'associationHelper'
const CLASS_NODE_TYPE = 'class'
const MIN_INFO_WIDTH = 350
const ASSOCIATION_NODE_SIZE = 24

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
    if (edge.type !== ASSOCIATION_EDGE_TYPE) {
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
    if (edge.type !== ASSOCIATION_EDGE_TYPE) {
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

function normalizeEdges(edges) {
  return recomputeFloatingEdgeParallels(edges)
}

const initialNodes = []

const initialEdges = []

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(normalizeEdges(initialEdges))
  const [activeSidebarItem, setActiveSidebarItem] = useState('tables')
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [infoWidth, setInfoWidth] = useState(360)
  const resizeState = useRef(null)

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!resizeState.current) {
        return
      }

      const { startX, startWidth } = resizeState.current
      const nextWidth = Math.max(
        MIN_INFO_WIDTH,
        startWidth + (event.clientX - startX),
      )
      setInfoWidth(nextWidth)
    }

    const handlePointerUp = () => {
      resizeState.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  const onResizeStart = useCallback((event) => {
    event.preventDefault()
    resizeState.current = { startX: event.clientX, startWidth: infoWidth }
  }, [infoWidth])

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
        const baseEdge = {
          ...params,
          type: nextType,
          data: {
            multiplicityA: '1',
            multiplicityB: '1',
            name: 'test',
            type: typeData,
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
    [isAssociationHelperNode, reactFlowInstance, setEdges],
  )

  const onConnectStart = useCallback(() => {
    setIsConnecting(true)
  }, [])

  const onConnectEnd = useCallback(() => {
    setIsConnecting(false)
  }, [])

  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((current) => normalizeEdges(applyEdgeChanges(changes, current))),
    [setEdges],
  )

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

      return [
        ...current,
        {
          id: `class-${idSuffix}`,
          type: CLASS_NODE_TYPE,
          position,
          data: {
            label: `Class${current.length + 1}`,
            attributes: [],
            color: getRandomPaletteColor(),
          },
        },
      ]
    })
  }, [reactFlowInstance, setNodes])

  const onRenameClass = useCallback(
    (nodeId, nextLabel) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, label: nextLabel } }
            : node,
        ),
      )
    },
    [setNodes],
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
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = normalizeAttributes(
            nodeId,
            node.data?.attributes,
          )
          const nextAttributes = currentAttributes.map((attribute) =>
            attribute.id === attributeId
              ? { ...attribute, name: nextValue }
              : attribute,
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

  const associationEdgeNodes = useMemo(() => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]))
    const getNode = (nodeId) =>
      reactFlowInstance?.getNode(nodeId) ?? nodeMap.get(nodeId)

    return edges
      .filter((edge) => edge.type === ASSOCIATION_EDGE_TYPE)
      .map((edge) => {
        const sourceNode = getNode(edge.source)
        const targetNode = getNode(edge.target)
        if (
          !sourceNode ||
          !targetNode ||
          (sourceNode.type !== CLASS_NODE_TYPE && sourceNode.type !== 'umlClass') ||
          (targetNode.type !== CLASS_NODE_TYPE && targetNode.type !== 'umlClass')
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

  const flowNodes = useMemo(
    () => [...nodes, ...associationEdgeNodes],
    [nodes, associationEdgeNodes],
  )

  const onSidebarSelect = useCallback(
    (item) => {
      if (item === 'new') {
        setNodes([])
        setEdges(normalizeEdges([]))
        setActiveSidebarItem('tables')
        return
      }
      setActiveSidebarItem(item)
    },
    [setEdges, setNodes],
  )

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            activeItem={activeSidebarItem}
            onSelect={onSidebarSelect}
          />
          <InfoPanel
            width={infoWidth}
            onResizeStart={onResizeStart}
            activeItem={activeSidebarItem}
            nodes={nodes}
            onAddClass={onAddClass}
            onRenameClass={onRenameClass}
            onReorderClasses={onReorderClasses}
            onReorderAttributes={onReorderAttributes}
            onUpdateAttribute={onUpdateAttribute}
            onAddAttribute={onAddAttribute}
            onUpdateClassColor={onUpdateClassColor}
          />
          <main className="flex-1 min-w-0 bg-base-100">
            <div
              className={`group/flow h-full w-full ${isConnecting ? 'is-connecting' : ''}`}
              ref={reactFlowWrapper}
            >
              <ReactFlow
                nodes={flowNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                isValidConnection={isValidConnection}
                connectionMode={ConnectionMode.Loose}
                connectionLineType={ConnectionLineType.SmoothStep}
                connectionRadius={40}
              >
                <Controls />
                <Background gap={16} size={1} />
              </ReactFlow>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
