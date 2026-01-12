import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import ReactFlow, {
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import { toPng } from 'html-to-image'
import { edgeTypes, nodeTypes } from './flowTypes.js'
import { CLASS_COLOR_PALETTE, getRandomPaletteColor } from './classPalette.js'
import { createAttribute, normalizeAttributes } from './attributes.js'
import { MODEL_EXAMPLES } from './examples.js'
import { InfoPanel, Navbar, Sidebar } from './components/layout/index.js'
import { getAssociationLayout } from './components/flow/associationUtils.js'

const ASSOCIATION_EDGE_TYPE = 'association'
const ASSOCIATIVE_EDGE_TYPE = 'associativeAssociation'
const REFLEXIVE_EDGE_TYPE = 'reflexiveAssociation'
const ASSOCIATION_HELPER_NODE_TYPE = 'associationHelper'
const CLASS_NODE_TYPE = 'class'
const MIN_INFO_WIDTH = 350
const HIGHLIGHT_ZOOM = 1.4
const ASSOCIATION_NODE_SIZE = 1
const MODEL_FILE_EXTENSION = '.mdlz'
const MODEL_VERSION = 1

const sanitizeFileName = (value) => {
  if (!value) {
    return ''
  }

  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
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
  const [modelName, setModelName] = useState('Untitled model')
  const [activeSidebarItem, setActiveSidebarItem] = useState('tables')
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [infoWidth, setInfoWidth] = useState(360)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(false)
  const [showBackground, setShowBackground] = useState(true)
  const [showAccentColors, setShowAccentColors] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const fileHandleRef = useRef(null)
  const lastSavedRef = useRef(
    JSON.stringify(
      {
        version: MODEL_VERSION,
        modelName: 'Untitled model',
        nodes: [],
        edges: [],
      },
      null,
      2,
    ),
  )
  const confirmActionRef = useRef(null)
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

  const buildModelPayload = useCallback(() => {
    const cleanedNodes = nodes.map((node) => ({
      ...node,
      selected: false,
    }))
    const cleanedEdges = edges.map((edge) => ({
      ...edge,
      selected: false,
    }))

    return {
      version: MODEL_VERSION,
      modelName: modelName || 'Untitled model',
      nodes: cleanedNodes,
      edges: cleanedEdges,
    }
  }, [edges, modelName, nodes])

  const getSerializedModel = useCallback(
    () => JSON.stringify(buildModelPayload(), null, 2),
    [buildModelPayload],
  )

  useEffect(() => {
    setIsDirty(getSerializedModel() !== lastSavedRef.current)
  }, [getSerializedModel])

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
          const nextAttributes = currentAttributes.map((attribute) =>
            attribute.id === attributeId
              ? { ...attribute, ...patch }
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

  const applyLoadedModel = useCallback(
    (payload, handle, serialized) => {
      const nextNodes = (payload?.nodes ?? []).map((node, index) => {
        const nodeId = node?.id ?? `class-${Date.now()}-${index}`
        const data = node?.data ?? {}

        return {
          ...node,
          id: nodeId,
          type: node?.type ?? CLASS_NODE_TYPE,
          selected: false,
          data: {
            ...data,
            label: typeof data.label === 'string' ? data.label : '',
            attributes: normalizeAttributes(nodeId, data.attributes),
          },
        }
      })
      const nextEdges = normalizeEdges(
        (payload?.edges ?? []).map((edge, index) => ({
          ...edge,
          id: edge?.id ?? `edge-${Date.now()}-${index}`,
          selected: false,
          data: edge?.data ?? {},
        })),
      )
      const nextModelName =
        typeof payload?.modelName === 'string' && payload.modelName.trim()
          ? payload.modelName
          : 'Untitled model'
      const nextSerialized =
        serialized ??
        JSON.stringify(
          {
            version: payload?.version ?? MODEL_VERSION,
            modelName: nextModelName,
            nodes: nextNodes,
            edges: nextEdges,
          },
          null,
          2,
        )

      setNodes(nextNodes)
      setEdges(nextEdges)
      setModelName(nextModelName)
      setActiveSidebarItem('tables')
      fileHandleRef.current = handle ?? null
      lastSavedRef.current = nextSerialized
      setIsDirty(false)
    },
    [setEdges, setModelName, setNodes],
  )

  const requestDiscardChanges = useCallback(
    (action) => {
      if (!isDirty) {
        action()
        return
      }
      confirmActionRef.current = action
      setIsConfirmDialogOpen(true)
    },
    [isDirty],
  )

  const onConfirmDiscardChanges = useCallback(() => {
    setIsConfirmDialogOpen(false)
    const action = confirmActionRef.current
    confirmActionRef.current = null
    action?.()
  }, [])

  const onCancelDiscardChanges = useCallback(() => {
    confirmActionRef.current = null
  }, [])

  const onNewModel = useCallback(() => {
    setNodes([])
    setEdges(normalizeEdges([]))
    setActiveSidebarItem('tables')
    setModelName('Untitled model')
    fileHandleRef.current = null
    lastSavedRef.current = JSON.stringify(
      {
        version: MODEL_VERSION,
        modelName: 'Untitled model',
        nodes: [],
        edges: [],
      },
      null,
      2,
    )
    setIsDirty(false)
  }, [setEdges, setNodes])

  const onRequestNewModel = useCallback(() => {
    requestDiscardChanges(onNewModel)
  }, [onNewModel, requestDiscardChanges])

  const onOpenModel = useCallback(async () => {
    const runOpen = async () => {
      const canPickOpen =
        typeof window !== 'undefined' && 'showOpenFilePicker' in window
      let fileHandle = null
      let fileText = null

      if (canPickOpen) {
        try {
          const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [
              {
                description: 'Modelizer Model',
                accept: { 'application/json': [MODEL_FILE_EXTENSION] },
              },
            ],
          })
          fileHandle = handle
          const file = await handle.getFile()
          fileText = await file.text()
        } catch (error) {
          if (error?.name === 'AbortError') {
            return
          }
          console.error('Failed to open model', error)
          return
        }
      } else {
        fileText = await new Promise((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = `${MODEL_FILE_EXTENSION},application/json`
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) {
              resolve(null)
              return
            }
            file
              .text()
              .then(resolve)
              .catch(() => resolve(null))
          }
          input.click()
        })
      }

      if (!fileText) {
        return
      }

      let parsed
      try {
        parsed = JSON.parse(fileText)
      } catch (error) {
        console.error('Invalid model file', error)
        return
      }

      if (!parsed || typeof parsed !== 'object') {
        return
      }

      applyLoadedModel(parsed, fileHandle)
    }

    requestDiscardChanges(() => {
      runOpen()
    })
  }, [applyLoadedModel, requestDiscardChanges])

  const onLoadExample = useCallback(
    (example) => {
      if (!example?.model) {
        return
      }

      requestDiscardChanges(() => {
        applyLoadedModel(example.model, null)
      })
    },
    [applyLoadedModel, requestDiscardChanges],
  )

  const onSaveModelAs = useCallback(async () => {
    const serialized = getSerializedModel()
    const normalizedName = sanitizeFileName(modelName || 'Untitled model')
    const fileName = normalizedName
      ? `${normalizedName}${MODEL_FILE_EXTENSION}`
      : `untitled-model${MODEL_FILE_EXTENSION}`
    const canPickSave =
      typeof window !== 'undefined' && 'showSaveFilePicker' in window

    if (canPickSave) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'Modelizer Model',
              accept: { 'application/json': [MODEL_FILE_EXTENSION] },
            },
          ],
        })
        const writable = await handle.createWritable()
        await writable.write(serialized)
        await writable.close()
        fileHandleRef.current = handle
        lastSavedRef.current = serialized
        setIsDirty(false)
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Failed to save model', error)
        }
      }
      return
    }

    const blob = new Blob([serialized], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    lastSavedRef.current = serialized
    setIsDirty(false)
  }, [getSerializedModel, modelName])

  const onSaveModel = useCallback(async () => {
    if (fileHandleRef.current?.createWritable) {
      const serialized = getSerializedModel()
      try {
        const writable = await fileHandleRef.current.createWritable()
        await writable.write(serialized)
        await writable.close()
        lastSavedRef.current = serialized
        setIsDirty(false)
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Failed to save model', error)
        }
      }
      return
    }

    onSaveModelAs()
  }, [getSerializedModel, onSaveModelAs])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      if (isEditable) {
        return
      }

      const key = event.key?.toLowerCase()
      if (event.ctrlKey || event.metaKey) {
        if (key === 's') {
          event.preventDefault()
          onSaveModel()
        }
        if (key === 'o') {
          event.preventDefault()
          onOpenModel()
        }
        if (key === 'n') {
          event.preventDefault()
          onRequestNewModel()
        }
      }

      if (key === 'delete' || key === 'backspace') {
        const selectedNodes = nodes.filter((node) => node.selected)
        if (selectedNodes.length > 0) {
          event.preventDefault()
          selectedNodes.forEach((node) => onDeleteClass(node.id))
          return
        }

        const selectedEdges = edges.filter((edge) => edge.selected)
        if (selectedEdges.length > 0) {
          event.preventDefault()
          selectedEdges.forEach((edge) => onDeleteAssociation(edge.id))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    edges,
    nodes,
    onDeleteAssociation,
    onDeleteClass,
    onOpenModel,
    onRequestNewModel,
    onSaveModel,
  ])

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

  const onExportPng = useCallback(async () => {
    if (!reactFlowWrapper.current) {
      return
    }

    const containerRect = reactFlowWrapper.current.getBoundingClientRect()
    if (!containerRect.width || !containerRect.height) {
      return
    }

    const imageWidth = Math.round(containerRect.width)
    const imageHeight = Math.round(containerRect.height)
    const viewport =
      reactFlowInstance?.getViewport?.() ?? { x: 0, y: 0, zoom: 1 }
    const viewportElement =
      reactFlowWrapper.current.querySelector('.react-flow__viewport')
    if (!viewportElement) {
      return
    }

    const backgroundColor = '#ffffff'

    try {
      const dataUrl = await toPng(viewportElement, {
        backgroundColor,
        filter: (node) =>
          !(node instanceof Element) ||
          !node.closest('[data-no-export="true"]'),
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      })

      const normalizedName = (modelName ?? 'Untitled model')
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
      const fileName = normalizedName
        ? `${normalizedName}.png`
        : 'untitled-model.png'
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = fileName
      link.click()
    } catch (error) {
      console.error('Failed to export PNG', error)
    }
  }, [modelName, reactFlowInstance])

  const onSidebarSelect = useCallback(
    (item) => {
      if (item === 'new') {
        onRequestNewModel()
        return
      }
      if (item === 'open') {
        onOpenModel()
        return
      }
      if (item === 'save') {
        onSaveModel()
        return
      }
      if (item === 'export') {
        onExportPng()
        return
      }
      setActiveSidebarItem(item)
    },
    [onExportPng, onOpenModel, onRequestNewModel, onSaveModel],
  )

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="flex min-h-screen flex-col">
        <Navbar
          modelName={modelName}
          onRenameModel={setModelName}
          onNewModel={onRequestNewModel}
          onOpenModel={onOpenModel}
          onSaveModel={onSaveModel}
          onSaveModelAs={onSaveModelAs}
          onExportPng={onExportPng}
          examples={MODEL_EXAMPLES}
          onLoadExample={onLoadExample}
          showMiniMap={showMiniMap}
          showBackground={showBackground}
          showAccentColors={showAccentColors}
          onToggleMiniMap={() => setShowMiniMap((current) => !current)}
          onToggleBackground={() => setShowBackground((current) => !current)}
          onToggleAccentColors={() =>
            setShowAccentColors((current) => !current)
          }
          isDirty={isDirty}
        />
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
          edges={edges}
          onAddClass={onAddClass}
          onRenameClass={onRenameClass}
          onReorderClasses={onReorderClasses}
          onReorderAttributes={onReorderAttributes}
          onUpdateAttribute={onUpdateAttribute}
          onAddAttribute={onAddAttribute}
          onDeleteAttribute={onDeleteAttribute}
          onUpdateClassColor={onUpdateClassColor}
          onDeleteClass={onDeleteClass}
          onHighlightClass={onHighlightClass}
          showAccentColors={showAccentColors}
          onRenameAssociation={onRenameAssociation}
          onDeleteAssociation={onDeleteAssociation}
          onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
          onUpdateAssociationRole={onUpdateAssociationRole}
          onHighlightAssociation={onHighlightAssociation}
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
                onPaneClick={onPaneClick}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                isValidConnection={isValidConnection}
                connectionMode={ConnectionMode.Loose}
                connectionLineType={ConnectionLineType.Straight}
                connectionRadius={40}
                defaultEdgeOptions={{ interactionWidth: 20 }}
              >
                <Controls />
                {showMiniMap ? <MiniMap /> : null}
                {showBackground ? <Background gap={16} size={1} /> : null}
              </ReactFlow>
            </div>
          </main>
        </div>
      </div>
      <AlertDialog.Root
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          setIsConfirmDialogOpen(open)
          if (!open) {
            confirmActionRef.current = null
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <AlertDialog.Title className="text-sm font-semibold">
              Discard changes?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-xs text-base-content/70">
              Your unsaved changes will be lost.
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className="inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium text-base-content/70 transition-colors hover:bg-base-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={onCancelDiscardChanges}
                >
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  className="inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium text-red-700 transition-colors hover:bg-base-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={onConfirmDiscardChanges}
                >
                  Discard
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

export default App
