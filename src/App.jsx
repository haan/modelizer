import FileErrorDialog from './components/dialogs/FileErrorDialog.jsx'
import ModelContentDialog from './components/dialogs/ModelContentDialog.jsx'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
} from '@xyflow/react'
import { edgeTypes, nodeTypes } from './flowTypes.js'
import AssociationLabelMask from './components/flow/labels/AssociationLabelMask.jsx'
import {
  ConfirmDiscardDialog,
  DeleteDialog,
  DuplicateDialog,
  ImportWarningDialog,
} from './components/dialogs/index.js'
import { InfoPanel, Navbar, Sidebar } from './components/layout/index.js'
import { useFileActions } from './hooks/useFileActions.js'
import { useModelFileDrop } from './hooks/useModelFileDrop.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useTheme } from './hooks/useTheme.js'
import { useModelState } from './hooks/useModelState.js'
import DefaultValuesPanel from './components/flow/overlays/DefaultValuesPanel.jsx'
import AnnotationLayer from './components/annotations/AnnotationLayer.jsx'
import AnnotationToolbox from './components/annotations/AnnotationToolbox.jsx'
import PngExportDialog from './components/dialogs/PngExportDialog.jsx'
import { useAnnotations } from './hooks/useAnnotations.js'
import { sanitizeFileName } from './model/fileUtils.js'
import { getClassDisplayName } from './model/viewUtils.js'
import {
  ASSOCIATION_EDGE_TYPE,
  ASSOCIATIVE_EDGE_TYPE,
  CLASS_NODE_TYPE,
  COMPOSITION_EDGE_TYPE,
  DEFAULT_VIEW,
  NOTE_NODE_TYPE,
  AREA_NODE_TYPE,
  REFLEXIVE_EDGE_TYPE,
  RELATIONSHIP_EDGE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_PHYSICAL,
} from './model/constants.js'

const MIN_INFO_WIDTH = 370
const STORAGE_KEYS = {
  showBackground: 'modelizer.showBackground',
  showAccentColors: 'modelizer.showAccentColors',
  showConceptualOperationsCompartment:
    'modelizer.showConceptualOperationsCompartment',
  nullDisplayMode: 'modelizer.nullDisplayMode',
  confirmDelete: 'modelizer.confirmDelete',
  includeAccentColorsInExport: 'modelizer.includeAccentColorsInExport',
  viewSpecificSettingsOnly: 'modelizer.viewSpecificSettingsOnly',
  showFullscreen: 'modelizer.showFullscreen',
  showCompositionAggregation: 'modelizer.showCompositionAggregation',
  showNotes: 'modelizer.showNotes',
  showAreas: 'modelizer.showAreas',
  showAnnotations: 'modelizer.showAnnotations',
}

const readStoredBool = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback
  }
  try {
    const value = window.localStorage.getItem(key)
    if (value === null) {
      return fallback
    }
    if (value === 'true') {
      return true
    }
    if (value === 'false') {
      return false
    }
  } catch (error) {
    console.warn('Failed to read preference', key, error)
  }
  return fallback
}

const writeStoredBool = (key, value) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(key, value ? 'true' : 'false')
  } catch (error) {
    console.warn('Failed to store preference', key, error)
  }
}

const readStoredString = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback
  }
  try {
    const value = window.localStorage.getItem(key)
    return value ?? fallback
  } catch (error) {
    console.warn('Failed to read preference', key, error)
    return fallback
  }
}

const writeStoredString = (key, value) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    console.warn('Failed to store preference', key, error)
  }
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [annotationsVisible, setAnnotationsVisible] = useState(true)
  // Stable ref-based bridge to break the circular dependency between useModelState
  // and useAnnotations: each hook needs something the other produces.
  const annotationsSnapshotRef = useRef(null)
  const annotationsRestoreRef = useRef(null)
  const getAnnotationsSnapshot = useCallback(() => annotationsSnapshotRef.current?.(), [])
  const onRestoreAnnotations = useCallback((a) => annotationsRestoreRef.current?.(a), [])
  const [infoWidth, setInfoWidth] = useState(370)
  const [showBackground, setShowBackground] = useState(() =>
    readStoredBool(STORAGE_KEYS.showBackground, true),
  )
  const [showAccentColors, setShowAccentColors] = useState(() =>
    readStoredBool(STORAGE_KEYS.showAccentColors, true),
  )
  const [showConceptualOperationsCompartment, setShowConceptualOperationsCompartment] =
    useState(() =>
      readStoredBool(STORAGE_KEYS.showConceptualOperationsCompartment, false),
    )
  const [nullDisplayMode, setNullDisplayMode] = useState(() =>
    readStoredString(STORAGE_KEYS.nullDisplayMode, 'not-null'),
  )
  const [confirmDelete, setConfirmDelete] = useState(() =>
    readStoredBool(STORAGE_KEYS.confirmDelete, true),
  )
  const [includeAccentColorsInExport, setIncludeAccentColorsInExport] = useState(() =>
    readStoredBool(STORAGE_KEYS.includeAccentColorsInExport, true),
  )
  const [viewSpecificSettingsOnly, setViewSpecificSettingsOnly] = useState(() =>
    readStoredBool(STORAGE_KEYS.viewSpecificSettingsOnly, false),
  )
  const [showFullscreen, setShowFullscreen] = useState(() =>
    readStoredBool(STORAGE_KEYS.showFullscreen, false),
  )
  const [showCompositionAggregation, setShowCompositionAggregation] = useState(() =>
    readStoredBool(STORAGE_KEYS.showCompositionAggregation, false),
  )
  const [showNotes, setShowNotes] = useState(() =>
    readStoredBool(STORAGE_KEYS.showNotes, false),
  )
  const [showAreas, setShowAreas] = useState(() =>
    readStoredBool(STORAGE_KEYS.showAreas, false),
  )
  const [showAnnotations, setShowAnnotations] = useState(() =>
    readStoredBool(STORAGE_KEYS.showAnnotations, false),
  )
  const [activeView, setActiveView] = useState(DEFAULT_VIEW)
  const [openClassId, setOpenClassId] = useState('')
  const [autoEditClassId, setAutoEditClassId] = useState('')
  const [autoEditAttributeId, setAutoEditAttributeId] = useState('')
  const [openAttributeId, setOpenAttributeId] = useState('')
  const [openAssociationId, setOpenAssociationId] = useState('')
  const [openRelationshipId, setOpenRelationshipId] = useState('')
  const [duplicateDialog, setDuplicateDialog] = useState({
    open: false,
    kind: 'association',
  })
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    kind: 'selection',
  })
  const [importWarningDialog, setImportWarningDialog] = useState({
    open: false,
    count: 0,
  })
  const [hiddenContentReport, setHiddenContentReport] = useState(null)
  const [fileError, setFileError] = useState({ open: false, message: '' })
  const onFileError = useCallback((message, details = {}) => {
    setFileError({ open: true, message, ...details })
  }, [])
  const resizeState = useRef(null)
  const deleteActionRef = useRef(null)

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

  const onDuplicateEdge = useCallback(({ kind }) => {
    setDuplicateDialog({ open: true, kind: kind ?? 'association' })
  }, [])

  const onImportWarning = useCallback((count) => {
    setImportWarningDialog({ open: true, count })
  }, [])

  const onHiddenContent = useCallback(report => setHiddenContentReport(report), [])
  const onRevealContent = useCallback(category => {
    if (category === 'notes') setShowNotes(true)
    if (category === 'areas') setShowAreas(true)
    if (category === 'compositions') setShowCompositionAggregation(true)
    if (category === 'annotations') { setShowAnnotations(true); setAnnotationsVisible(true) }
  }, [])

  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showBackground, showBackground)
  }, [showBackground])

  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showAccentColors, showAccentColors)
  }, [showAccentColors])

  useEffect(() => {
    writeStoredBool(
      STORAGE_KEYS.showConceptualOperationsCompartment,
      showConceptualOperationsCompartment,
    )
  }, [showConceptualOperationsCompartment])

  useEffect(() => {
    writeStoredString(STORAGE_KEYS.nullDisplayMode, nullDisplayMode)
  }, [nullDisplayMode])

  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.confirmDelete, confirmDelete)
  }, [confirmDelete])

  useEffect(() => {
    writeStoredBool(
      STORAGE_KEYS.includeAccentColorsInExport,
      includeAccentColorsInExport,
    )
  }, [includeAccentColorsInExport])
  useEffect(() => {
    writeStoredBool(
      STORAGE_KEYS.viewSpecificSettingsOnly,
      viewSpecificSettingsOnly,
    )
  }, [viewSpecificSettingsOnly])
  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showFullscreen, showFullscreen)
  }, [showFullscreen])
  useEffect(() => {
    writeStoredBool(
      STORAGE_KEYS.showCompositionAggregation,
      showCompositionAggregation,
    )
  }, [showCompositionAggregation])
  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showNotes, showNotes)
  }, [showNotes])
  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showAreas, showAreas)
  }, [showAreas])
  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showAnnotations, showAnnotations)
  }, [showAnnotations])

  const onDuplicateDialogOpenChange = useCallback((open) => {
    if (!open) {
      setDuplicateDialog((current) => ({ ...current, open: false }))
    }
  }, [])

  const onImportWarningOpenChange = useCallback((open) => {
    if (!open) {
      setImportWarningDialog((current) => ({ ...current, open: false }))
    }
  }, [])

  const resetViewport = useCallback(() => {
    if (!reactFlowInstance) {
      return
    }
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 })
  }, [reactFlowInstance])

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setModel,
    panelNodes,
    panelEdges,
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
    onEdgeDoubleClick,
    isValidConnection,
    onAddClass: addClass,
    onAddNote,
    onAddArea,
    onSyncViewPositions,
    onRenameClass,
    onUpdateClassLogicalName,
    onRenameNote,
    onRenameArea,
    onRenameAssociation,
    onDeleteAssociation: deleteAssociation,
    onDeleteNote: deleteNote,
    onDeleteArea: deleteArea,
    onUpdateAssociationMultiplicity,
    onUpdateAssociationRole,
    onUpdateAssociationComment,
    onUpdateAssociationLineStyle,
    onResetAssociationRouting,
    onUpdateRelationshipLineStyle,
    onResetRelationshipRouting,
    onToggleAssociationComposition,
    onUpdateAssociationWhole,
    onHighlightAssociation,
    onHighlightNote,
    onHighlightArea,
    onReorderClasses,
    onReorderAttributes,
    onUpdateAttribute,
    onUpdateNoteText,
    onUpdateNoteVisibility,
    onUpdateAreaColor,
    onUpdateAreaVisibility,
    onAddAttribute: addAttribute,
    onDeleteAttribute: deleteAttribute,
    onUpdateClassColor,
    onUpdateClassVisibility,
    onDeleteClass: deleteClass,
    onHighlightClass,
    onPaneClick,
    flowNodes,
    flowEdges,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    pushHistorySnapshot,
    onNodeDragStart,
    onNodeDragStop,
  } = useModelState({
    reactFlowInstance,
    reactFlowWrapper,
    showAccentColors,
    showConceptualOperationsCompartment,
    showCompositionAggregation,
    nullDisplayMode,
    onDuplicateEdge,
    activeView,
    getAnnotationsSnapshot,
    onRestoreAnnotations,
  })

  const {
    annotations,
    displayAnnotations,
    selectedId,
    selectedItem,
    updateSelected: onSelectedAnnotationChange,
    beginStyleEdit: onAnnotationStyleEditStart,
    endStyleEdit: onAnnotationStyleEditEnd,
    onSelectItem: onSelectAnnotation,
    onItemPointerDown: onAnnotationItemPointerDown,
    onDeleteSelected: onDeleteSelectedAnnotation,
    onDuplicateSelected: onDuplicateSelectedAnnotation,
    onPointerCancel: onAnnotationPointerCancel,
    activeTool: activeAnnotationTool,
    penSettings,
    markerSettings,
    textSettings,
    eraserSettings,
    currentStroke,
    pendingText,
    selectedTextId,
    editingTextId,
    isTemporaryPanMode,
    dirtySignal: annotationsDirtySignal,
    getAnnotationsSnapshot: getAnnotationsSnapshotFn,
    setTool: onSetAnnotationTool,
    updatePenSettings: onPenSettingsChange,
    updateMarkerSettings: onMarkerSettingsChange,
    updateTextSettings: onTextSettingsChange,
    updateEraserSettings: onEraserSettingsChange,
    onPointerDown: onAnnotationPointerDown,
    onPointerMove: onAnnotationPointerMove,
    onPointerUp: onAnnotationPointerUp,
    onCommitText: onAnnotationCommitText,
    onCommitTextEdit: onAnnotationCommitTextEdit,
    onTextPointerDown: onAnnotationTextPointerDown,
    onTextDoubleClick: onAnnotationTextDoubleClick,
    onClearAnnotations,
    onLoadAnnotations,
  } = useAnnotations({
    activeView,
    reactFlowInstance,
    pushHistorySnapshot,
    enabled: showAnnotations && annotationsVisible,
  })

  // Wire stable ref callbacks after every render so useModelState can read/restore
  // annotation state without a hard circular dependency between the two hooks.
  useLayoutEffect(() => {
    annotationsSnapshotRef.current = getAnnotationsSnapshotFn
    annotationsRestoreRef.current = onLoadAnnotations
  })

  const onAddClass = useCallback(() => {
    const classId = addClass?.()
    if (!classId) {
      return
    }

    setActiveSidebarItem('tables')
    setOpenClassId(classId)
    setAutoEditClassId(classId)
    requestAnimationFrame(() => {
      setAutoEditClassId('')
    })
    setOpenAttributeId('')
  }, [
    addClass,
    setActiveSidebarItem,
    setOpenAttributeId,
    setOpenClassId,
    setAutoEditClassId,
  ])

  const onAddAttribute = useCallback(
    (nodeId) => {
      const createdAttributeId = addAttribute?.(nodeId)
      if (!createdAttributeId) {
        return
      }

      setActiveSidebarItem('tables')
      setOpenClassId(nodeId)
      setOpenAttributeId(createdAttributeId)
      setAutoEditAttributeId(createdAttributeId)
    },
    [addAttribute, setActiveSidebarItem],
  )

  const onAutoEditAttributeConsumed = useCallback(() => {
    setAutoEditAttributeId('')
  }, [])

  const onFlowNodeClick = useCallback(
    (event, node) => {
      const target = event.target
      if (target instanceof Element && target.closest('.react-flow__handle')) {
        return
      }

      if (node?.type !== CLASS_NODE_TYPE) {
        return
      }

      const attributeId =
        target instanceof Element
          ? target.closest('[data-attribute-id]')?.getAttribute('data-attribute-id') ?? ''
          : ''
      setActiveSidebarItem('tables')
      setOpenClassId(node.id)
      if (attributeId) {
        setOpenAttributeId(attributeId)
      }
    },
    [setActiveSidebarItem, setOpenAttributeId, setOpenClassId],
  )

  const onFlowEdgeClick = useCallback(
    (_event, edge) => {
      if (
        !edge ||
        (edge.type !== ASSOCIATION_EDGE_TYPE &&
          edge.type !== COMPOSITION_EDGE_TYPE &&
          edge.type !== ASSOCIATIVE_EDGE_TYPE &&
          edge.type !== REFLEXIVE_EDGE_TYPE &&
          edge.type !== RELATIONSHIP_EDGE_TYPE)
      ) {
        return
      }

      setActiveSidebarItem('refs')
      if (edge.type === RELATIONSHIP_EDGE_TYPE) {
        setOpenRelationshipId(edge.id)
      } else {
        setOpenAssociationId(edge.id)
      }
    },
    [setActiveSidebarItem],
  )

  const onToggleNotes = useCallback(() => {
    setShowNotes((current) => {
      const next = !current
      if (!next && activeSidebarItem === 'notes') {
        setActiveSidebarItem('tables')
      }
      return next
    })
  }, [activeSidebarItem, setActiveSidebarItem])

  const onToggleAreas = useCallback(() => {
    setShowAreas((current) => {
      const next = !current
      if (!next && activeSidebarItem === 'areas') {
        setActiveSidebarItem('tables')
      }
      return next
    })
  }, [activeSidebarItem, setActiveSidebarItem])

  const onToggleAnnotations = useCallback(() => {
    setShowAnnotations((current) => !current)
  }, [])

  const requestDelete = useCallback(
    ({ kind, action }) => {
      if (!confirmDelete) {
        action()
        return
      }

      deleteActionRef.current = action
      setDeleteDialog({ open: true, kind })
    },
    [confirmDelete],
  )

  const onDeleteDialogOpenChange = useCallback((open) => {
    if (!open) {
      deleteActionRef.current = null
    }
    setDeleteDialog((current) => ({ ...current, open }))
  }, [])

  const onConfirmDelete = useCallback(() => {
    deleteActionRef.current?.()
    deleteActionRef.current = null
    setDeleteDialog((current) => ({ ...current, open: false }))
  }, [])

  const onDeleteClass = useCallback(
    (nodeId) =>
      requestDelete({
        kind: 'class',
        action: () => deleteClass(nodeId),
      }),
    [deleteClass, requestDelete],
  )

  const onDeleteAssociation = useCallback(
    (edgeId) => {
      const edge = edges.find((entry) => entry.id === edgeId)
      const kind =
        edge?.type === RELATIONSHIP_EDGE_TYPE ? 'relationship' : 'association'
      requestDelete({
        kind,
        action: () => deleteAssociation(edgeId),
      })
    },
    [deleteAssociation, edges, requestDelete],
  )

  const onDeleteAttribute = useCallback(
    (nodeId, attributeId) =>
      requestDelete({
        kind: 'attribute',
        action: () => deleteAttribute(nodeId, attributeId),
      }),
    [deleteAttribute, requestDelete],
  )

  const onDeleteNote = useCallback(
    (noteId) =>
      requestDelete({
        kind: 'note',
        action: () => deleteNote(noteId),
      }),
    [deleteNote, requestDelete],
  )

  const onDeleteArea = useCallback(
    (areaId) =>
      requestDelete({
        kind: 'area',
        action: () => deleteArea(areaId),
      }),
    [deleteArea, requestDelete],
  )

  const onDeleteSelection = useCallback(
    ({ nodeIds, edgeIds }) => {
      if (!nodeIds.length && !edgeIds.length) {
        return
      }

      requestDelete({
        kind: 'selection',
        action: () => {
          nodeIds.forEach((nodeId) => {
            const node = nodes.find((entry) => entry.id === nodeId)
            if (node?.type === NOTE_NODE_TYPE) {
              deleteNote(nodeId)
              return
            } else {
              if (node?.type === AREA_NODE_TYPE) {
                deleteArea(nodeId)
                return
              }
            }
            deleteClass(nodeId)
          })
          edgeIds.forEach((edgeId) => deleteAssociation(edgeId))
        },
      })
    },
    [deleteAssociation, deleteArea, deleteClass, deleteNote, nodes, requestDelete],
  )

  const {
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
  } = useFileActions({
    onFileError,
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
    showNotes,
    showAreas,
    showCompositionAggregation,
    showAnnotations,
    annotationsVisible,
    onHiddenContent,
    onImportWarning,
    onLoadAnnotations,
    onNewModelCreated: () => {
      setHiddenContentReport(null)
      setActiveView(VIEW_CONCEPTUAL)
      resetViewport()
      onLoadAnnotations(null)
    },
    onModelLoaded: () => {
      setActiveView(VIEW_CONCEPTUAL)
      if (!reactFlowInstance) {
        return
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          reactFlowInstance.fitView({ padding: 0.2, duration: 0 })
        })
      })
    },
  })

  const isFileOver = useModelFileDrop({
    onOpenModelFile,
    onFileError,
    disabled: isOpening || isConfirmDialogOpen,
  })

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) {
        return
      }
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  useKeyboardShortcuts({
    nodes,
    edges,
    onAddAttribute,
    onDeleteAssociation,
    onDeleteClass,
    onDeleteSelection,
    onOpenModel,
    onRequestNewModel,
    onSaveModel,
    onUndo,
    onRedo,
  })

  const defaultValueEntries = useMemo(() => {
    if (activeView !== VIEW_PHYSICAL) {
      return []
    }

    return nodes.flatMap((node) => {
      const displayName = getClassDisplayName(node.data, VIEW_PHYSICAL)
      const className = displayName.trim() || 'Class'
      const attributes = Array.isArray(node.data?.attributes)
        ? node.data.attributes
        : []
      return attributes.flatMap((attribute) => {
        const value =
          typeof attribute.defaultValue === 'string'
            ? attribute.defaultValue.trim()
            : ''
        if (!value) {
          return []
        }
        const logicalName =
          typeof attribute.logicalName === 'string' && attribute.logicalName.trim()
            ? attribute.logicalName.trim()
            : ''
        const attributeName =
          logicalName ||
          (typeof attribute.name === 'string' && attribute.name.trim()
            ? attribute.name.trim()
            : 'attribute')
        return [
          {
            key: `${className}.${attributeName}`,
            value,
          },
        ]
      })
    })
  }, [activeView, nodes])

  const visibleFlowNodes = useMemo(
    () =>
      flowNodes.filter((node) => {
        if (node.type === NOTE_NODE_TYPE) {
          return showNotes
        }
        if (node.type === AREA_NODE_TYPE) {
          return showAreas
        }
        return true
      }),
    [flowNodes, showAreas, showNotes],
  )

  const [pngExport, setPngExport] = useState(null)
  const onExportPng = useCallback(() => {
    const rect = reactFlowWrapper.current?.getBoundingClientRect()
    const baseName = sanitizeFileName(modelName ?? 'Untitled model') || 'untitled-model'
    setPngExport({
      nodes: flowNodes,
      edges: flowEdges,
      nodeTypes,
      edgeTypes,
      annotations,
      activeView,
      defaultValueEntries,
      fallbackWidth: Math.max(1, Math.round(rect?.width || 800)),
      fallbackHeight: Math.max(1, Math.round(rect?.height || 600)),
      fileName: baseName + '-' + sanitizeFileName(activeView) + '.png',
      defaults: {
        includeAnnotations: showAnnotations && annotationsVisible,
        includeNotes: showNotes,
        includeAreas: showAreas,
        includeAccentColors: includeAccentColorsInExport,
      },
    })
  }, [activeView, annotations, annotationsVisible, defaultValueEntries, flowEdges,
    flowNodes, includeAccentColorsInExport, modelName, showAnnotations, showAreas, showNotes])

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
      if (item === 'notes' && !showNotes) {
        return
      }
      if (item === 'areas' && !showAreas) {
        return
      }
      setActiveSidebarItem(item)
    },
    [
      onExportPng,
      onOpenModel,
      onRequestNewModel,
      onSaveModel,
      setActiveSidebarItem,
      showAreas,
      showNotes,
    ],
  )

  return (
    <>
      <div className="h-screen overflow-hidden bg-base-200 text-base-content">
        {isFileOver && (
          <div className="model-file-drop-overlay" role="status" data-no-export="true">
            <span>Drop .mdlz file to open</span>
          </div>
        )}
        <div className="flex h-full flex-col">
          <Navbar
            theme={theme}
            onToggleTheme={toggleTheme}
            modelName={modelName}
            onRenameModel={setModelName}
            onNewModel={onRequestNewModel}
            onOpenModel={onOpenModel}
            onSaveModel={onSaveModel}
            onSaveModelAs={onSaveModelAs}
            onImportJavaModelizer={onImportJavaModelizer}
            onImportMySql={onImportMySql}
            onExportPng={onExportPng}
            showBackground={showBackground}
            showAccentColors={showAccentColors}
            showConceptualOperationsCompartment={
              showConceptualOperationsCompartment
            }
            showFullscreen={showFullscreen}
            showCompositionAggregation={showCompositionAggregation}
            showNotes={showNotes}
            showAreas={showAreas}
            onToggleBackground={() => setShowBackground((current) => !current)}
            onToggleAccentColors={() =>
              setShowAccentColors((current) => !current)
            }
            onToggleConceptualOperationsCompartment={() =>
              setShowConceptualOperationsCompartment((current) => !current)
            }
            onToggleFullscreen={() => setShowFullscreen((current) => !current)}
            onToggleCompositionAggregation={() =>
              setShowCompositionAggregation((current) => !current)
            }
            onToggleNotes={onToggleNotes}
            onToggleAreas={onToggleAreas}
            showAnnotations={showAnnotations}
            onToggleAnnotations={onToggleAnnotations}
            viewSpecificSettingsOnly={viewSpecificSettingsOnly}
            onToggleViewSpecificSettingsOnly={() =>
              setViewSpecificSettingsOnly((current) => !current)
            }
            nullDisplayMode={nullDisplayMode}
            onNullDisplayModeChange={setNullDisplayMode}
            confirmDelete={confirmDelete}
            onToggleConfirmDelete={setConfirmDelete}
            isDirty={isDirty}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          <div className="flex flex-1 min-h-0">
            {!showFullscreen ? (
              <Sidebar
                activeItem={activeSidebarItem}
                onSelect={onSidebarSelect}
                activeView={activeView}
                onViewChange={setActiveView}
                onSyncViewPositions={onSyncViewPositions}
                showNotes={showNotes}
                showAreas={showAreas}
              />
            ) : null}
            {!showFullscreen ? (
              <InfoPanel
                width={infoWidth}
                onResizeStart={onResizeStart}
                activeItem={activeSidebarItem}
                openClassId={openClassId}
                onOpenClassIdChange={setOpenClassId}
                autoEditClassId={autoEditClassId}
                autoEditAttributeId={autoEditAttributeId}
                onAutoEditAttributeConsumed={onAutoEditAttributeConsumed}
                openAttributeId={openAttributeId}
                onOpenAttributeIdChange={setOpenAttributeId}
                openAssociationId={openAssociationId}
                onOpenAssociationIdChange={setOpenAssociationId}
                openRelationshipId={openRelationshipId}
                onOpenRelationshipIdChange={setOpenRelationshipId}
                nodes={panelNodes}
                edges={panelEdges}
                activeView={activeView}
                viewSpecificSettingsOnly={viewSpecificSettingsOnly}
                onAddClass={onAddClass}
                onRenameClass={onRenameClass}
                onUpdateClassLogicalName={onUpdateClassLogicalName}
                onReorderClasses={onReorderClasses}
                onReorderAttributes={onReorderAttributes}
                onUpdateAttribute={onUpdateAttribute}
                onAddAttribute={onAddAttribute}
                onDeleteAttribute={onDeleteAttribute}
                onUpdateClassColor={onUpdateClassColor}
                onUpdateClassVisibility={onUpdateClassVisibility}
                onDeleteClass={onDeleteClass}
                onHighlightClass={onHighlightClass}
                showAccentColors={showAccentColors}
                onRenameAssociation={onRenameAssociation}
                onDeleteAssociation={onDeleteAssociation}
                onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
                onUpdateAssociationRole={onUpdateAssociationRole}
                onUpdateAssociationComment={onUpdateAssociationComment}
                onUpdateAssociationLineStyle={onUpdateAssociationLineStyle}
                onResetAssociationRouting={onResetAssociationRouting}
                onUpdateRelationshipLineStyle={onUpdateRelationshipLineStyle}
                onResetRelationshipRouting={onResetRelationshipRouting}
                showCompositionAggregation={showCompositionAggregation}
                onToggleAssociationComposition={onToggleAssociationComposition}
                onUpdateAssociationWhole={onUpdateAssociationWhole}
                onHighlightAssociation={onHighlightAssociation}
                onAddNote={onAddNote}
                onRenameNote={onRenameNote}
                onUpdateNoteText={onUpdateNoteText}
                onUpdateNoteVisibility={onUpdateNoteVisibility}
                onDeleteNote={onDeleteNote}
                onHighlightNote={onHighlightNote}
                onAddArea={onAddArea}
                onRenameArea={onRenameArea}
                onUpdateAreaColor={onUpdateAreaColor}
                onUpdateAreaVisibility={onUpdateAreaVisibility}
                onDeleteArea={onDeleteArea}
                onHighlightArea={onHighlightArea}
                showNotes={showNotes}
                showAreas={showAreas}
              />
            ) : null}
            <main className="flex-1 min-w-0 bg-background">
              <div
                className={`group/flow relative h-full w-full ${isConnecting ? 'is-connecting' : ''}`}
                ref={reactFlowWrapper}
              >
                <ReactFlow
                  colorMode={theme}
                  nodes={visibleFlowNodes}
                  edges={flowEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onConnectStart={onConnectStart}
                  onConnectEnd={onConnectEnd}
                  onEdgeDoubleClick={onEdgeDoubleClick}
                  onNodeClick={onFlowNodeClick}
                  onEdgeClick={onFlowEdgeClick}
                  onPaneClick={onPaneClick}
                  onNodeDragStart={onNodeDragStart}
                  onNodeDragStop={onNodeDragStop}
                  onInit={setReactFlowInstance}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  isValidConnection={isValidConnection}
                  connectionMode={ConnectionMode.Loose}
                  connectionLineType={ConnectionLineType.Straight}
                  connectionRadius={40}
                  maxZoom={3}
                  defaultEdgeOptions={{ interactionWidth: 20 }}
                >
                  <AssociationLabelMask />
                  <div data-no-export="true">
                    <Controls position="bottom-right" />
                  </div>
                  {showBackground ? <Background gap={16} size={1} color="rgb(var(--color-grid) / 0.85)" /> : null}
                  {showAnnotations ? (
                    <>
                      {annotationsVisible && <AnnotationLayer
                        annotations={displayAnnotations}
                        activeView={activeView}
                        activeTool={activeAnnotationTool}
                        penSettings={penSettings}
                        markerSettings={markerSettings}
                        eraserSettings={eraserSettings}
                        currentStroke={currentStroke}
                        pendingText={pendingText}
                        isTemporaryPanMode={isTemporaryPanMode}
                        onPointerDown={onAnnotationPointerDown}
                        onPointerMove={onAnnotationPointerMove}
                        onPointerUp={onAnnotationPointerUp}
                        onCommitText={onAnnotationCommitText}
                        onCommitTextEdit={onAnnotationCommitTextEdit}
                        selectedTextId={selectedTextId}
                        editingTextId={editingTextId}
                        onTextPointerDown={onAnnotationTextPointerDown}
                        onTextDoubleClick={onAnnotationTextDoubleClick}
                        selectedId={selectedId}
                        onItemPointerDown={onAnnotationItemPointerDown}
                        onSelectItem={onSelectAnnotation}
                        onPointerCancel={onAnnotationPointerCancel}
                      />}
                      <div data-no-export="true">
                        <AnnotationToolbox
                          activeTool={activeAnnotationTool}
                          onSetTool={(tool) => { setAnnotationsVisible(true); onSetAnnotationTool(tool) }}
                          selectedItem={selectedItem}
                          onSelectedChange={onSelectedAnnotationChange}
                          onStyleEditStart={onAnnotationStyleEditStart}
                          onStyleEditEnd={onAnnotationStyleEditEnd}
                          onDeleteSelected={onDeleteSelectedAnnotation}
                          onDuplicateSelected={onDuplicateSelectedAnnotation}
                          canUndo={canUndo}
                          canRedo={canRedo}
                          onUndo={onUndo}
                          onRedo={onRedo}
                          annotationsVisible={annotationsVisible}
                          onToggleVisibility={() => { onSetAnnotationTool("pointer"); setAnnotationsVisible((visible) => !visible) }}
                          onExportPng={onExportPng}
                          penSettings={penSettings}
                          onPenSettingsChange={onPenSettingsChange}
                          markerSettings={markerSettings}
                          onMarkerSettingsChange={onMarkerSettingsChange}
                          textSettings={textSettings}
                          onTextSettingsChange={onTextSettingsChange}
                          eraserSettings={eraserSettings}
                          onEraserSettingsChange={onEraserSettingsChange}
                          onClearView={() => onClearAnnotations(activeView)}
                        />
                      </div>
                    </>
                  ) : null}
                </ReactFlow>
                {activeView === VIEW_PHYSICAL ? (
                  <DefaultValuesPanel entries={defaultValueEntries} />
                ) : null}
              </div>
            </main>
          </div>
        </div>
        {pngExport && <PngExportDialog source={pngExport} onAccentColorsChange={setIncludeAccentColorsInExport} onClose={() => setPngExport(null)} />}
        <ConfirmDiscardDialog
          open={isConfirmDialogOpen}
          onOpenChange={onConfirmDialogOpenChange}
          onConfirm={onConfirmDiscardChanges}
          onCancel={onCancelDiscardChanges}
        />
        <DeleteDialog
          open={deleteDialog.open}
          kind={deleteDialog.kind}
          onOpenChange={onDeleteDialogOpenChange}
          onConfirm={onConfirmDelete}
          onCancel={() => onDeleteDialogOpenChange(false)}
        />
        <DuplicateDialog
          open={duplicateDialog.open}
          kind={duplicateDialog.kind}
          onOpenChange={onDuplicateDialogOpenChange}
        />
        <ImportWarningDialog
          open={importWarningDialog.open}
          count={importWarningDialog.count}
          onOpenChange={onImportWarningOpenChange}
        />
        <ModelContentDialog
          report={hiddenContentReport}
          visible={activeView === VIEW_CONCEPTUAL && !importWarningDialog.open && !isConfirmDialogOpen && !fileError.open}
          enabled={{ notes: showNotes, areas: showAreas, compositions: showCompositionAggregation, annotations: showAnnotations && annotationsVisible }}
          onDismiss={() => setHiddenContentReport(null)}
          onReveal={onRevealContent}
        />
        <FileErrorDialog error={fileError} onOpenChange={open => setFileError(current => ({ ...current, open }))} />
      </div>
    </>
  )
}

export default App
