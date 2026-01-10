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

const FLOATING_EDGE_TYPE = 'associationFloating'

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
    },
  },
  {
    id: 'class-2',
    position: { x: 480, y: 220 },
    type: 'umlClass',
    data: { label: 'Account', attributes: ['id', 'status', 'userId'] },
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
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

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
          },
        },
      ]
    })
  }, [reactFlowInstance, setNodes])

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-content font-bold">
              M
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Modelizer</h1>
              <p className="text-sm opacity-70">Database modeling workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-sm">Load</button>
            <button className="btn btn-primary btn-sm">Save</button>
          </div>
        </header>

        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeView === 'conceptual' ? 'tab-active' : ''}`}
            onClick={() => setActiveView('conceptual')}
            type="button"
          >
            Conceptual
          </button>
          <button
            className={`tab ${activeView === 'logical' ? 'tab-active' : ''}`}
            onClick={() => setActiveView('logical')}
            type="button"
          >
            Logical
          </button>
          <button
            className={`tab ${activeView === 'physical' ? 'tab-active' : ''}`}
            onClick={() => setActiveView('physical')}
            type="button"
          >
            Physical
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
          <aside className="rounded-box bg-base-100 p-4 shadow">
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
              Tools
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={onAddClass}
                type="button"
              >
                Add class
              </button>
              <button className="btn btn-sm">Add relationship</button>
            </div>
          </aside>

          <main className="rounded-box bg-base-100 p-4 shadow">
            <div
              className={`group/flow h-[680px] w-full rounded-xl border ${
                isConnecting ? 'is-connecting' : ''
              }`}
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
                fitView
              >
                <Controls />
                <Background gap={16} size={1} />
              </ReactFlow>
            </div>
          </main>

          <aside className="rounded-box bg-base-100 p-4 shadow">
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
              Inspector
            </h2>
            <p className="mt-4 text-sm opacity-70">
              Select a class or relationship to edit details.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default App
