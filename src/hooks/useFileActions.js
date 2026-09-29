import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeAttributes } from '../attributes.js'
import {
  CLASS_NODE_TYPE,
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
import { normalizeAnnotations } from './useAnnotations.js'
import { parseModelFile, pickModelFile } from '../model/modelOpening.js'
import { sanitizeFileName } from '../model/fileUtils.js'
import { importJavaModelizer } from '../model/javaModelizerImport.js'
import {
  normalizeVisibility,
  normalizeViewPositions,
  normalizeViewSizes,
} from '../model/viewUtils.js'

const getNodeFallbackSize = (node, fallback = { width: 0, height: 0 }) => ({
  width: node?.width ?? node?.style?.width ?? fallback.width,
  height: node?.height ?? node?.style?.height ?? fallback.height,
})

const normalizeNodeForPayload = (node) => {
  if (!node || typeof node !== 'object') {
    return node
  }

  // Strip ReactFlow-internal computed properties that must not affect dirty-state
  // comparisons: positionAbsolute is added after setNodes(), width/height are
  // measured from the DOM for class/note nodes and vary between renders.
  const {
    positionAbsolute: _pa,
    dragging: _dragging,
    resizing: _resizing,
    width: _width,
    height: _height,
    ...nodeData
  } = node

  const baseNode = {
    ...nodeData,
    selected: false,
  }

  if (
    node.type !== CLASS_NODE_TYPE &&
    node.type !== NOTE_NODE_TYPE &&
    node.type !== AREA_NODE_TYPE
  ) {
    return baseNode
  }

  const viewPositions = normalizeViewPositions(
    node.data?.viewPositions,
    node.position,
  )
  const conceptualPosition = viewPositions[VIEW_CONCEPTUAL]
  const nextNode = {
    ...baseNode,
    position: { ...conceptualPosition },
    data: {
      ...(node.data ?? {}),
      viewPositions,
    },
  }

  if (node.type !== AREA_NODE_TYPE) {
    return nextNode
  }

  const viewSizes = normalizeViewSizes(
    node.data?.viewSizes,
    getNodeFallbackSize(node, { width: 280, height: 180 }),
  )
  const conceptualSize = viewSizes[VIEW_CONCEPTUAL]

  return {
    ...nextNode,
    width: conceptualSize.width,
    height: conceptualSize.height,
    style: {
      ...(node.style ?? {}),
      width: conceptualSize.width,
      height: conceptualSize.height,
    },
    data: {
      ...nextNode.data,
      viewSizes,
    },
  }
}

const normalizeEdgeForPayload = (edge) => {
  if (!edge || typeof edge !== 'object') {
    return edge
  }

  return {
    ...edge,
    selected: false,
  }
}

export const buildHashPayload = (payload) => ({
  version: payload?.version ?? MODEL_VERSION,
  modelName:
    typeof payload?.modelName === 'string' && payload.modelName.trim()
      ? payload.modelName
      : 'Untitled model',
  nodes: Array.isArray(payload?.nodes)
    ? payload.nodes.map(normalizeNodeForPayload)
    : [],
  edges: Array.isArray(payload?.edges)
    ? payload.edges.map(normalizeEdgeForPayload)
    : [],
  annotations: payload?.annotations ?? {
    conceptual: { items: [] },
    logical: { items: [] },
    physical: { items: [] },
  },
})

export const isSamePosition = (a, b) =>
  a?.x === b?.x && a?.y === b?.y

export const isSameNode = (prev, next) => {
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

export const isSameEdge = (prev, next) => {
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

export const hasMeaningfulNodeChange = (prevNodes, nextNodes) => {
  if (prevNodes.length !== nextNodes.length) {
    return true
  }
  const prevById = new Map(prevNodes.map((node) => [node.id, node]))
  return nextNodes.some((node) => !isSameNode(prevById.get(node.id), node))
}

export const hasMeaningfulEdgeChange = (prevEdges, nextEdges) => {
  if (prevEdges.length !== nextEdges.length) {
    return true
  }
  const prevById = new Map(prevEdges.map((edge) => [edge.id, edge]))
  return nextEdges.some((edge) => !isSameEdge(prevById.get(edge.id), edge))
}

export const getHiddenContentState = ({
  nodes = [],
  edges = [],
  annotations = null,
  showNotes = true,
  showAreas = true,
  showCompositionAggregation = false,
  showAnnotations = true,
} = {}) => {
  const hasNotes = nodes.some((node) => node.type === NOTE_NODE_TYPE)
  const hasAreas = nodes.some((node) => node.type === AREA_NODE_TYPE)
  const hasCompositions = edges.some(
    (edge) =>
      edge.type === COMPOSITION_EDGE_TYPE ||
      edge.data?.type === 'composition' ||
      edge.sourceHandle === 'composition-source',
  )
  const hasAnnotations =
    annotations != null &&
    typeof annotations === 'object' &&
    Object.values(annotations).some(
      (view) => Array.isArray(view?.items) && view.items.length > 0,
    )

  return {
    hiddenNotes: hasNotes && !showNotes,
    hiddenAreas: hasAreas && !showAreas,
    hiddenCompositions: hasCompositions && !showCompositionAggregation,
    hiddenAnnotations: hasAnnotations && !showAnnotations,
  }
}

function prepareLoadedModel(payload) {
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
        position: viewPositions[VIEW_CONCEPTUAL] ?? node?.position,
        data: {
          ...data,
          label: typeof data.label === 'string' ? data.label : '',
          logicalName:
            typeof data.logicalName === 'string' ? data.logicalName : '',
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
      const nextPosition = viewPositions[VIEW_CONCEPTUAL] ?? node?.position
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
      const nextPosition = viewPositions[VIEW_CONCEPTUAL] ?? node?.position

      return {
        ...node,
        id: nodeId,
        type: nodeType,
        selected: false,
        position: nextPosition,
        width: viewSizes[VIEW_CONCEPTUAL].width,
        height: viewSizes[VIEW_CONCEPTUAL].height,
        style: {
          ...node?.style,
          width: viewSizes[VIEW_CONCEPTUAL].width,
          height: viewSizes[VIEW_CONCEPTUAL].height,
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
  const nextAnnotations = normalizeAnnotations(payload?.annotations)
  const nextBasePayload = buildHashPayload({
    version: payload?.version ?? MODEL_VERSION,
    modelName: nextModelName,
    nodes: nextNodes,
    edges: nextEdges,
    annotations: nextAnnotations,
  })
  return { nextNodes, nextEdges, nextModelName, nextAnnotations, nextBasePayload }
}

export function useFileActions({
  nodes,
  edges,
  annotations,
  annotationsDirtySignal,
  modelName,
  setModel,
  setNodes,
  setEdges,
  setModelName,
  setActiveSidebarItem,
  showNotes = true,
  showAreas = true,
  showCompositionAggregation = false,
  showAnnotations = true,
  onHiddenContent,
  onImportWarning,
  onLoadAnnotations,
  onNewModelCreated,
  onModelLoaded,
  onFileError,
}) {
  const [isDirty, setIsDirty] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const fileHandleRef = useRef(null)
  const prevNodesRef = useRef(nodes)
  const prevEdgesRef = useRef(edges)
  const prevModelNameRef = useRef(modelName)
  const lastSavedRef = useRef(
    JSON.stringify(
      buildHashPayload({
        version: MODEL_VERSION,
        modelName: 'Untitled model',
        nodes: [],
        edges: [],
        annotations: null,
      }),
      null,
      2,
    ),
  )
  const confirmActionRef = useRef(null)
  const [isOpening, setIsOpening] = useState(false)
  const openingRef = useRef(false)
  const openGeneration = useRef(0)
  const pickerCleanupRef = useRef(null)
  const dirtyRef = useRef(isDirty)
  useEffect(() => { dirtyRef.current = isDirty }, [isDirty])
  useEffect(() => () => {
    openGeneration.current += 1
    pickerCleanupRef.current?.()
  }, [])

  const cancelPendingOpen = useCallback(() => {
    openGeneration.current += 1
    pickerCleanupRef.current?.()
    pickerCleanupRef.current = null
    openingRef.current = false
    setIsOpening(false)
  }, [])

  const buildModelPayload = useCallback(() => {
    return buildHashPayload({
      version: MODEL_VERSION,
      modelName: modelName || 'Untitled model',
      nodes,
      edges,
      annotations,
    })
  }, [annotations, edges, modelName, nodes])

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
    const prevModelName = prevModelNameRef.current
    prevNodesRef.current = nodes
    prevEdgesRef.current = edges
    prevModelNameRef.current = modelName

    const didModelNameChange = prevModelName !== modelName
    if (didModelNameChange) {
      setIsDirty(getSerializedModelForDirty() !== lastSavedRef.current)
      return
    }

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
  }, [edges, getSerializedModelForDirty, isDragging, modelName, nodes])

  useEffect(() => {
    if (annotationsDirtySignal === 0) return
    setIsDirty(getSerializedModelForDirty() !== lastSavedRef.current)
  }, [annotationsDirtySignal, getSerializedModelForDirty])

  const applyLoadedModel = useCallback(
    (payload, handle, prepared) => {
      const {
        nextNodes, nextEdges, nextModelName, nextAnnotations, nextBasePayload,
      } = prepared ?? prepareLoadedModel(payload)
      if (setModel) {
        setModel(nextNodes, nextEdges, nextModelName)
      } else {
        setNodes(nextNodes)
        setEdges(nextEdges)
        setModelName(nextModelName, { skipHistory: true })
      }
      onLoadAnnotations?.(nextAnnotations)
      setActiveSidebarItem('tables')
      fileHandleRef.current = handle ?? null
      lastSavedRef.current = JSON.stringify(nextBasePayload, null, 2)
      setIsDirty(false)
      onModelLoaded?.({ nodes: nextNodes, edges: nextEdges })

      if (onHiddenContent) {
        const {
          hiddenNotes,
          hiddenAreas,
          hiddenCompositions,
          hiddenAnnotations,
        } =
          getHiddenContentState({
            nodes: nextNodes,
            edges: nextEdges,
            annotations: nextAnnotations,
            showNotes,
            showAreas,
            showCompositionAggregation,
            showAnnotations,
          })
        if (
          hiddenNotes ||
          hiddenAreas ||
          hiddenCompositions ||
          hiddenAnnotations
        ) {
          onHiddenContent({
            hiddenNotes,
            hiddenAreas,
            hiddenCompositions,
            hiddenAnnotations,
          })
        }
      }
    },
    [
      setActiveSidebarItem,
      setEdges,
      setModel,
      setModelName,
      setNodes,
      showAreas,
      showNotes,
      showCompositionAggregation,
      showAnnotations,
      onHiddenContent,
      onLoadAnnotations,
      onModelLoaded,
    ],
  )

  const requestDiscardChanges = useCallback(
    (action) => {
      if (confirmActionRef.current) return
      if (!dirtyRef.current) {
        action()
        return
      }
      confirmActionRef.current = action
      setIsConfirmDialogOpen(true)
    },
    [],
  )

  const onConfirmDiscardChanges = useCallback(() => {
    setIsConfirmDialogOpen(false)
    const action = confirmActionRef.current
    confirmActionRef.current = null
    action?.()
  }, [])

  const onCancelDiscardChanges = useCallback(() => {
    confirmActionRef.current = null
    cancelPendingOpen()
  }, [cancelPendingOpen])

  const onConfirmDialogOpenChange = useCallback((open) => {
    setIsConfirmDialogOpen(open)
    if (!open) {
      confirmActionRef.current = null
      cancelPendingOpen()
    }
  }, [cancelPendingOpen])

  const onNewModel = useCallback(() => {
    if (setModel) {
      setModel([], normalizeEdges([]), 'Untitled model')
    } else {
      setNodes([])
      setEdges(normalizeEdges([]))
      setModelName('Untitled model', { skipHistory: true })
    }
    setActiveSidebarItem('tables')
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
    if (confirmActionRef.current) return
    cancelPendingOpen()
    requestDiscardChanges(onNewModel)
  }, [cancelPendingOpen, onNewModel, requestDiscardChanges])

  const startOpen = useCallback(async (file, droppedHandle = null) => {
    if (openingRef.current || confirmActionRef.current) return
    openingRef.current = true
    setIsOpening(true)
    const generation = ++openGeneration.current
    const current = () => openGeneration.current === generation
    const finish = () => {
      if (!current()) return
      openingRef.current = false
      setIsOpening(false)
      pickerCleanupRef.current = null
    }
    let awaitingConfirmation = false
    try {
      const selection = file
        ? { file, handle: await droppedHandle }
        : await pickModelFile((cleanup) => { pickerCleanupRef.current = cleanup })
      if (!current() || !selection) return
      if (selection.handle?.kind === 'directory') {
        throw new Error('Drop a .mdlz file, not a folder.')
      }
      let text
      try {
        text = await selection.file.text()
      } catch {
        throw new Error('The file could not be read. Please select it again.')
      }
      if (!current()) return
      const payload = parseModelFile(text)
      const prepared = prepareLoadedModel(payload)
      const commit = () => {
        if (!current()) return
        try {
          applyLoadedModel(payload, selection.handle, prepared)
        } finally {
          finish()
        }
      }
      awaitingConfirmation = dirtyRef.current
      requestDiscardChanges(commit)
    } catch (error) {
      if (current() && error?.name !== 'AbortError') {
        onFileError?.(error?.message || 'The model could not be opened.')
      }
    } finally {
      if (!awaitingConfirmation) finish()
    }
  }, [applyLoadedModel, onFileError, requestDiscardChanges])

  const onOpenModel = useCallback(() => startOpen(), [startOpen])
  const onOpenModelFile = useCallback((file, handle) => startOpen(file, handle), [startOpen])

  const onImportJavaModelizer = useCallback(async () => {
    if (confirmActionRef.current) return
    cancelPendingOpen()
    const runImport = async () => {
      const canPickOpen =
        typeof window !== 'undefined' && 'showOpenFilePicker' in window
      let fileText
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
  }, [applyLoadedModel, cancelPendingOpen, onImportWarning, requestDiscardChanges])

  const onImportMySql = useCallback(async () => {
    if (confirmActionRef.current) return
    cancelPendingOpen()
    const runImport = async () => {
      const canPickOpen =
        typeof window !== 'undefined' && 'showOpenFilePicker' in window
      let fileText
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
  }, [applyLoadedModel, cancelPendingOpen, onImportWarning, requestDiscardChanges])


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
    isOpening,
    onOpenModelFile,
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
