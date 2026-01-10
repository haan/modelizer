import { useCallback, useEffect, useRef, useState } from 'react'
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
import { InfoPanel, Navbar, Sidebar } from './components/layout/index.js'

const FLOATING_EDGE_TYPE = 'associationFloating'
const MIN_INFO_WIDTH = 350

function makeUniqueEdgeId(usedIds, edge, sequence) {
  const baseSource = edge.source ?? 'edge'
  const baseTarget = edge.target ?? 'edge'
  let nextId = `edge-${baseSource}-${baseTarget}-${sequence}`

  while (usedIds.has(nextId)) {
    sequence += 1
    nextId = `edge-${baseSource}-${baseTarget}-${sequence}`
  }

  return nextId
}

function ensureEdgeIds(edges) {
  const usedIds = new Set()
  let sequence = 0

  return edges.map((edge) => {
    const rawId = edge.id ? String(edge.id) : ''
    if (rawId && !usedIds.has(rawId)) {
      usedIds.add(rawId)
      return edge
    }

    const nextId = makeUniqueEdgeId(usedIds, edge, sequence)
    usedIds.add(nextId)
    sequence += 1
    return { ...edge, id: nextId }
  })
}

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
    if (edge.type !== FLOATING_EDGE_TYPE) {
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
    if (edge.type !== FLOATING_EDGE_TYPE) {
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
  return recomputeFloatingEdgeParallels(ensureEdgeIds(edges))
}

const initialNodes = [
  {
    id: 'class-1',
    position: { x: 120, y: 80 },
    type: 'umlClass',
    data: {
      label: 'User',
      attributes: ['id', 'email', 'createdAt', 'updatedAt', 'status', 'role'],
      color: getPaletteColor(0),
    },
  },
  {
    id: 'class-2',
    position: { x: 480, y: 220 },
    type: 'umlClass',
    data: {
      label: 'Account',
      attributes: ['id', 'status', 'userId'],
      color: getPaletteColor(1),
    },
  },
]

const initialEdges = [
  {
    id: 'rel-1',
    source: 'class-1',
    target: 'class-2',
    type: 'associationFloating',
    data: { multiplicityA: '0..*', multiplicityB: '0..1', name: 'owns' },
  },
]

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(normalizeEdges(initialEdges))
  const [activeView, setActiveView] = useState('conceptual')
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

  useEffect(() => {
    const nextType =
      activeView === 'conceptual' ? FLOATING_EDGE_TYPE : 'association'
    setEdges((current) => {
      let changed = false
      const next = current.map((edge) => {
        if (
          edge.type === 'association' ||
          edge.type === 'associationFloating'
        ) {
          if (edge.type !== nextType) {
            changed = true
            return { ...edge, type: nextType }
          }
        }
        return edge
      })
      const updated = changed ? next : current
      return normalizeEdges(updated)
    })
  }, [activeView, setEdges])

  const onConnect = useCallback(
    (params) =>
      setEdges((current) => {
        const nextType =
          params.source === params.target
            ? 'associationReflexive'
            : activeView === 'conceptual'
              ? FLOATING_EDGE_TYPE
              : 'association'
        const baseEdge = {
          ...params,
          type: nextType,
          data: { multiplicityA: '1', multiplicityB: '1', name: 'test' },
        }

        if (nextType !== FLOATING_EDGE_TYPE) {
          return normalizeEdges(addEdge(baseEdge, current))
        }

        const idSuffix =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${current.length + 1}`
        const nextEdge = { ...baseEdge, id: `edge-${idSuffix}` }
        return normalizeEdges([...current, nextEdge])
      }),
    [activeView, setEdges],
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

  const isValidConnection = useCallback(
    (connection) => Boolean(connection.sourceHandle && connection.targetHandle),
    [],
  )

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
          type: 'umlClass',
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
                  attributes: nextAttributes,
                },
              }
            : node,
        ),
      )
    },
    [setNodes],
  )

  const onUpdateAttribute = useCallback(
    (nodeId, attributeIndex, nextValue) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = Array.isArray(node.data?.attributes)
            ? [...node.data.attributes]
            : []
          if (
            attributeIndex < 0 ||
            attributeIndex >= currentAttributes.length
          ) {
            return node
          }

          currentAttributes[attributeIndex] = nextValue
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

  const onAddAttribute = useCallback(
    (nodeId) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

          const currentAttributes = Array.isArray(node.data?.attributes)
            ? [...node.data.attributes]
            : []
          currentAttributes.push(`attribute${currentAttributes.length + 1}`)

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

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            activeItem={activeSidebarItem}
            onSelect={setActiveSidebarItem}
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
                nodes={nodes}
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
                connectionRadius={24}
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
