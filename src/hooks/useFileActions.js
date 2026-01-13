import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeAttributes } from '../attributes.js'
import {
  CLASS_NODE_TYPE,
  DEFAULT_VIEW,
  MODEL_FILE_EXTENSION,
  MODEL_VERSION,
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../model/constants.js'
import { normalizeEdges } from '../model/edgeUtils.js'
import { sanitizeFileName } from '../model/fileUtils.js'
import {
  normalizeVisibility,
  normalizeViewPositions,
} from '../model/viewUtils.js'

export function useFileActions({
  nodes,
  edges,
  modelName,
  setNodes,
  setEdges,
  setModelName,
  setActiveSidebarItem,
  activeView = DEFAULT_VIEW,
}) {
  const [isDirty, setIsDirty] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const fileHandleRef = useRef(null)
  const normalizedActiveView =
    activeView === VIEW_LOGICAL || activeView === VIEW_PHYSICAL
      ? activeView
      : VIEW_CONCEPTUAL
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

  const applyLoadedModel = useCallback(
    (payload, handle, serialized) => {
      const nextNodes = (payload?.nodes ?? []).map((node, index) => {
        const nodeId = node?.id ?? `class-${Date.now()}-${index}`
        const data = node?.data ?? {}
        const viewPositions = normalizeViewPositions(
          data.viewPositions,
          node?.position,
        )
        const visibility = normalizeVisibility(data.visibility)
        const attributes = normalizeAttributes(nodeId, data.attributes)

        return {
          ...node,
          id: nodeId,
          type: node?.type ?? CLASS_NODE_TYPE,
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
    [normalizedActiveView, setActiveSidebarItem, setEdges, setModelName, setNodes],
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
  }, [setActiveSidebarItem, setEdges, setModelName, setNodes])

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
    onLoadExample,
  }
}
