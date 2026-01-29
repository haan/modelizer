import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeAttributes } from '../attributes.js'
import {
  CLASS_NODE_TYPE,
  DEFAULT_VIEW,
  MODEL_FILE_EXTENSION,
  MODEL_VERSION,
  AREA_NODE_TYPE,
  NOTE_NODE_TYPE,
  COMPOSITION_EDGE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../model/constants.js'
import { normalizeEdges } from '../model/edgeUtils.js'
import { sanitizeFileName } from '../model/fileUtils.js'
import { importJavaModelizer } from '../model/javaModelizerImport.js'
import {
  normalizeVisibility,
  normalizeViewPositions,
  normalizeViewSizes,
} from '../model/viewUtils.js'

const buildHashPayload = (payload) => ({
  version: payload?.version ?? MODEL_VERSION,
  modelName:
    typeof payload?.modelName === 'string' && payload.modelName.trim()
      ? payload.modelName
      : 'Untitled model',
  nodes: Array.isArray(payload?.nodes) ? payload.nodes : [],
  edges: Array.isArray(payload?.edges) ? payload.edges : [],
})

const isSamePosition = (a, b) =>
  a?.x === b?.x && a?.y === b?.y

const isSameNode = (prev, next) => {
  if (!prev || !next) {
    return false
  }
  if (prev.type !== next.type) {
    return false
  }
  if (!isSamePosition(prev.position, next.position)) {
    return false
  }
  if (prev.width !== next.width || prev.height !== next.height) {
    return false
  }
  if (prev.data !== next.data) {
    return false
  }
  if (prev.style !== next.style) {
    return false
  }
  return true
}

const isSameEdge = (prev, next) => {
  if (!prev || !next) {
    return false
  }
  if (prev.type !== next.type) {
    return false
  }
  if (prev.source !== next.source || prev.target !== next.target) {
    return false
  }
  if (prev.sourceHandle !== next.sourceHandle) {
    return false
  }
  if (prev.targetHandle !== next.targetHandle) {
    return false
  }
  if (prev.data !== next.data) {
    return false
  }
  if (prev.style !== next.style) {
    return false
  }
  if (prev.markerEnd !== next.markerEnd) {
    return false
  }
  if (prev.markerStart !== next.markerStart) {
    return false
  }
  return true
}

const hasMeaningfulNodeChange = (prevNodes, nextNodes) => {
  if (prevNodes.length !== nextNodes.length) {
    return true
  }
  const prevById = new Map(prevNodes.map((node) => [node.id, node]))
  return nextNodes.some((node) => !isSameNode(prevById.get(node.id), node))
}

const hasMeaningfulEdgeChange = (prevEdges, nextEdges) => {
  if (prevEdges.length !== nextEdges.length) {
    return true
  }
  const prevById = new Map(prevEdges.map((edge) => [edge.id, edge]))
  return nextEdges.some((edge) => !isSameEdge(prevById.get(edge.id), edge))
}

export function useFileActions({
  nodes,
  edges,
  modelName,
  setModel,
  setNodes,
  setEdges,
  setModelName,
  setActiveSidebarItem,
  activeView = DEFAULT_VIEW,
  showNotes = true,
  showAreas = true,
  showCompositionAggregation = false,
  onHiddenContent,
  onImportWarning,
  onNewModelCreated,
  onModelLoaded,
}) {
  const [isDirty, setIsDirty] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const fileHandleRef = useRef(null)
  const prevNodesRef = useRef(nodes)
  const prevEdgesRef = useRef(edges)
  const normalizedActiveView =
    activeView === VIEW_LOGICAL || activeView === VIEW_PHYSICAL
      ? activeView
      : VIEW_CONCEPTUAL
  const lastSavedRef = useRef(
    JSON.stringify(
      buildHashPayload({
        version: MODEL_VERSION,
        modelName: 'Untitled model',
        nodes: [],
        edges: [],
      }),
      null,
      2,
    ),
  )
  const confirmActionRef = useRef(null)

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

  const getSerializedModelForDirty = useCallback(
    () => JSON.stringify(buildModelPayload(), null, 2),
    [buildModelPayload],
  )
  const isDragging = useMemo(
    () => nodes.some((node) => node.dragging || node.resizing),
    [nodes],
  )

  useEffect(() => {
    const prevNodes = prevNodesRef.current
    const prevEdges = prevEdgesRef.current
    prevNodesRef.current = nodes
    prevEdgesRef.current = edges

    if (isDragging) {
      return
    }
    if (
      !hasMeaningfulNodeChange(prevNodes, nodes) &&
      !hasMeaningfulEdgeChange(prevEdges, edges)
    ) {
      return
    }
    setIsDirty(getSerializedModelForDirty() !== lastSavedRef.current)
  }, [edges, getSerializedModelForDirty, isDragging, nodes])

  const applyLoadedModel = useCallback(
    (payload, handle) => {
      const nextNodes = (payload?.nodes ?? []).map((node, index) => {
        const nodeId = node?.id ?? `class-${Date.now()}-${index}`
        const data = node?.data ?? {}
        const nodeType = node?.type ?? CLASS_NODE_TYPE

        if (nodeType === CLASS_NODE_TYPE) {
          const viewPositions = normalizeViewPositions(
            data.viewPositions,
            node?.position,
          )
          const visibility = normalizeVisibility(data.visibility)
          const attributes = normalizeAttributes(nodeId, data.attributes)

          return {
            ...node,
            id: nodeId,
            type: nodeType,
            selected: false,
            position: viewPositions[normalizedActiveView] ?? node?.position,
            data: {
              ...data,
              label: typeof data.label === 'string' ? data.label : '',
              attributes,
              visibility,
              viewPositions,
            },
          }
        }

        if (nodeType === NOTE_NODE_TYPE) {
          const visibility = normalizeVisibility(data.visibility)
          const viewPositions = normalizeViewPositions(
            data.viewPositions,
            node?.position,
          )
          const nextPosition = viewPositions[normalizedActiveView] ?? node?.position
          return {
            ...node,
            id: nodeId,
            type: nodeType,
            selected: false,
            position: nextPosition,
            data: {
              ...data,
              label: typeof data.label === 'string' ? data.label : '',
              text: typeof data.text === 'string' ? data.text : '',
              visibility,
              viewPositions,
            },
          }
        }

        if (nodeType === AREA_NODE_TYPE) {
          const width = typeof node?.width === 'number' ? node.width : 280
          const height = typeof node?.height === 'number' ? node.height : 180
          const visibility = normalizeVisibility(data.visibility)
          const viewPositions = normalizeViewPositions(
            data.viewPositions,
            node?.position,
          )
          const viewSizes = normalizeViewSizes(data.viewSizes, {
            width,
            height,
          })
          const nextPosition = viewPositions[normalizedActiveView] ?? node?.position

          return {
            ...node,
            id: nodeId,
            type: nodeType,
            selected: false,
            position: nextPosition,
            width: viewSizes[normalizedActiveView].width,
            height: viewSizes[normalizedActiveView].height,
            style: {
              ...node?.style,
              width:
                node?.style?.width ?? viewSizes[normalizedActiveView].width,
              height:
                node?.style?.height ?? viewSizes[normalizedActiveView].height,
            },
            data: {
              ...data,
              label: typeof data.label === 'string' ? data.label : '',
              color: typeof data.color === 'string' ? data.color : '',
              visibility,
              viewPositions,
              viewSizes,
            },
          }
        }

        return {
          ...node,
          id: nodeId,
          type: nodeType,
          selected: false,
          data,
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
      const nextBasePayload = buildHashPayload({
        version: payload?.version ?? MODEL_VERSION,
        modelName: nextModelName,
        nodes: nextNodes,
        edges: nextEdges,
      })
      if (setModel) {
        setModel(nextNodes, nextEdges)
      } else {
        setNodes(nextNodes)
        setEdges(nextEdges)
      }
      setModelName(nextModelName)
      setActiveSidebarItem('tables')
      fileHandleRef.current = handle ?? null
      lastSavedRef.current = JSON.stringify(nextBasePayload, null, 2)
      setIsDirty(false)
      onModelLoaded?.({ nodes: nextNodes, edges: nextEdges })

      if (onHiddenContent) {
        const hasNotes = nextNodes.some((node) => node.type === NOTE_NODE_TYPE)
        const hasAreas = nextNodes.some((node) => node.type === AREA_NODE_TYPE)
        const hasCompositions = nextEdges.some(
          (edge) =>
            edge.type === COMPOSITION_EDGE_TYPE ||
            edge.sourceHandle === 'composition-source',
        )
        const hiddenNotes = hasNotes && !showNotes
        const hiddenAreas = hasAreas && !showAreas
        const hiddenCompositions = hasCompositions && !showCompositionAggregation
        if (hiddenNotes || hiddenAreas || hiddenCompositions) {
          onHiddenContent({ hiddenNotes, hiddenAreas, hiddenCompositions })
        }
      }
    },
    [
      normalizedActiveView,
      setActiveSidebarItem,
      setEdges,
      setModel,
      setModelName,
      setNodes,
      showAreas,
      showNotes,
      showCompositionAggregation,
      onHiddenContent,
      onModelLoaded,
    ],
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

  const onConfirmDialogOpenChange = useCallback((open) => {
    setIsConfirmDialogOpen(open)
    if (!open) {
      confirmActionRef.current = null
    }
  }, [])

  const onNewModel = useCallback(() => {
    if (setModel) {
      setModel([], normalizeEdges([]))
    } else {
      setNodes([])
      setEdges(normalizeEdges([]))
    }
    setActiveSidebarItem('tables')
    setModelName('Untitled model')
    fileHandleRef.current = null
    lastSavedRef.current = JSON.stringify(
      {
        ...buildHashPayload({
          version: MODEL_VERSION,
          modelName: 'Untitled model',
          nodes: [],
          edges: [],
        }),
      },
      null,
      2,
    )
    setIsDirty(false)
    onNewModelCreated?.()
  }, [
    onNewModelCreated,
    setActiveSidebarItem,
    setEdges,
    setModel,
    setModelName,
    setNodes,
  ])

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

  const onImportJavaModelizer = useCallback(async () => {
    const runImport = async () => {
      const canPickOpen =
        typeof window !== 'undefined' && 'showOpenFilePicker' in window
      let fileText = null
      let fileName = null

      if (canPickOpen) {
        try {
          const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [
              {
                description: 'Java Modelizer Model',
                accept: { 'application/json': ['.mod'] },
              },
            ],
          })
          const file = await handle.getFile()
          fileName = file?.name ?? null
          fileText = await file.text()
        } catch (error) {
          if (error?.name === 'AbortError') {
            return
          }
          console.error('Failed to import model', error)
          return
        }
      } else {
        fileText = await new Promise((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.mod,application/json'
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) {
              resolve(null)
              return
            }
            fileName = file.name
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

      const payload = importJavaModelizer(fileText, fileName)
      if (!payload) {
        return
      }

      applyLoadedModel(payload, null)
      const unmatchedCount =
        payload?.importWarnings?.unmatchedAttributeTypes ?? 0
      if (unmatchedCount > 0) {
        onImportWarning?.(unmatchedCount)
      }
    }

    requestDiscardChanges(() => {
      runImport()
    })
  }, [applyLoadedModel, onImportWarning, requestDiscardChanges])

  const onImportMySql = useCallback(async () => {
    const runImport = async () => {
      const canPickOpen =
        typeof window !== 'undefined' && 'showOpenFilePicker' in window
      let fileText = null
      let fileName = null

      if (canPickOpen) {
        try {
          const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [
              {
                description: 'MySQL file',
                accept: { 'text/sql': ['.sql'] },
              },
            ],
          })
          const file = await handle.getFile()
          fileName = file?.name ?? null
          fileText = await file.text()
        } catch (error) {
          if (error?.name === 'AbortError') {
            return
          }
          console.error('Failed to import SQL', error)
          return
        }
      } else {
        fileText = await new Promise((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.sql,text/sql'
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) {
              resolve(null)
              return
            }
            fileName = file.name
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

      const { importMySql } = await import('../model/mysqlImport.js')
      const payload = await importMySql(fileText, fileName)
      if (!payload) {
        return
      }

      applyLoadedModel(payload, null)
      const unmatchedCount =
        payload?.importWarnings?.unmatchedAttributeTypes ?? 0
      if (unmatchedCount > 0) {
        onImportWarning?.(unmatchedCount)
      }
    }

    requestDiscardChanges(() => {
      runImport()
    })
  }, [applyLoadedModel, onImportWarning, requestDiscardChanges])


  const onSaveModelAs = useCallback(async () => {
    const basePayload = buildModelPayload()
    const serialized = JSON.stringify(basePayload, null, 2)
    const serializedForDirty = JSON.stringify(basePayload, null, 2)
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
        lastSavedRef.current = serializedForDirty
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
    lastSavedRef.current = serializedForDirty
    setIsDirty(false)
  }, [buildModelPayload, modelName])

  const onSaveModel = useCallback(async () => {
    if (fileHandleRef.current?.createWritable) {
      const basePayload = buildModelPayload()
      const serialized = JSON.stringify(basePayload, null, 2)
      const serializedForDirty = JSON.stringify(basePayload, null, 2)
      try {
        const writable = await fileHandleRef.current.createWritable()
        await writable.write(serialized)
        await writable.close()
        lastSavedRef.current = serializedForDirty
        setIsDirty(false)
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Failed to save model', error)
        }
      }
      return
    }

    onSaveModelAs()
  }, [buildModelPayload, onSaveModelAs])

  return {
    isDirty,
    isConfirmDialogOpen,
    onConfirmDialogOpenChange,
    onConfirmDiscardChanges,
    onCancelDiscardChanges,
    onRequestNewModel,
    onOpenModel,
    onSaveModel,
    onSaveModelAs,
    onImportJavaModelizer,
    onImportMySql,
  }
}
