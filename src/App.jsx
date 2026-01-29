import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
} from 'reactflow'
import * as Toast from '@radix-ui/react-toast'
import { toPng } from 'html-to-image'
import { edgeTypes, nodeTypes } from './flowTypes.js'
import {
  ConfirmDiscardDialog,
  DeleteDialog,
  DuplicateDialog,
  ImportWarningDialog,
} from './components/dialogs/index.js'
import { InfoPanel, Navbar, Sidebar } from './components/layout/index.js'
import { useFileActions } from './hooks/useFileActions.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useModelState } from './hooks/useModelState.js'
import DefaultValuesPanel from './components/flow/overlays/DefaultValuesPanel.jsx'
import { sanitizeFileName } from './model/fileUtils.js'
import {
  DEFAULT_VIEW,
  NOTE_NODE_TYPE,
  AREA_NODE_TYPE,
  RELATIONSHIP_EDGE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_PHYSICAL,
} from './model/constants.js'

const MIN_INFO_WIDTH = 370
const STORAGE_KEYS = {
  showBackground: 'modelizer.showBackground',
  showAccentColors: 'modelizer.showAccentColors',
  nullDisplayMode: 'modelizer.nullDisplayMode',
  confirmDelete: 'modelizer.confirmDelete',
  includeAccentColorsInExport: 'modelizer.includeAccentColorsInExport',
  viewSpecificSettingsOnly: 'modelizer.viewSpecificSettingsOnly',
  showFullscreen: 'modelizer.showFullscreen',
  showCompositionAggregation: 'modelizer.showCompositionAggregation',
  showNotes: 'modelizer.showNotes',
  showAreas: 'modelizer.showAreas',
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
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [infoWidth, setInfoWidth] = useState(370)
  const [showBackground, setShowBackground] = useState(() =>
    readStoredBool(STORAGE_KEYS.showBackground, true),
  )
  const [showAccentColors, setShowAccentColors] = useState(() =>
    readStoredBool(STORAGE_KEYS.showAccentColors, true),
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
  const [activeView, setActiveView] = useState(DEFAULT_VIEW)
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
  const [hiddenContentToast, setHiddenContentToast] = useState({
    open: false,
    title: '',
    description: '',
  })
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

  const onHiddenContent = useCallback(
    ({ hiddenNotes, hiddenAreas, hiddenCompositions }) => {
    const parts = []
    if (hiddenNotes) {
      parts.push('Notes')
    }
    if (hiddenAreas) {
      parts.push('Areas')
    }
    if (hiddenCompositions) {
      parts.push('Composite aggregations')
    }
    if (parts.length === 0) {
      return
    }
    const subject =
      parts.length <= 2
        ? parts.join(' and ')
        : `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`
    const verb = 'are'
    const pronoun = 'them'
    setHiddenContentToast({
      open: true,
      title: 'Hidden content',
      description: `This file contains ${subject}, but ${subject} ${verb} disabled in Settings. Enable ${subject} to view ${pronoun}.`,
    })
  },
  [],
)

  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showBackground, showBackground)
  }, [showBackground])

  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showAccentColors, showAccentColors)
  }, [showAccentColors])

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

  const onHiddenContentToastOpenChange = useCallback((open) => {
    if (!open) {
      setHiddenContentToast((current) => ({ ...current, open: false }))
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
    isValidConnection,
    onAddClass,
    onAddNote,
    onAddArea,
    onSyncViewPositions,
    onRenameClass,
    onRenameNote,
    onRenameArea,
    onRenameAssociation,
    onDeleteAssociation: deleteAssociation,
    onDeleteNote: deleteNote,
    onDeleteArea: deleteArea,
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
    onUpdateNoteVisibility,
    onUpdateAreaColor,
    onUpdateAreaVisibility,
    onAddAttribute,
    onDeleteAttribute: deleteAttribute,
    onUpdateClassColor,
    onUpdateClassVisibility,
    onDeleteClass: deleteClass,
    onHighlightClass,
    onPaneClick,
    flowNodes,
    flowEdges,
  } = useModelState({
    reactFlowInstance,
    reactFlowWrapper,
    showAccentColors,
    showCompositionAggregation,
    nullDisplayMode,
    onDuplicateEdge,
    activeView,
  })

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
    isConfirmDialogOpen,
    onConfirmDialogOpenChange,
    onConfirmDiscardChanges,
    onCancelDiscardChanges,
    onRequestNewModel,
    onOpenModel,
    onSaveModel,
    onSaveModelAs,
    onImportJavaModelizer,
  } = useFileActions({
    nodes,
    edges,
    modelName,
    setModel,
    setNodes,
    setEdges,
    setModelName,
    setActiveSidebarItem,
    activeView,
    showNotes,
    showAreas,
    showCompositionAggregation,
    onHiddenContent,
    onImportWarning,
    onNewModelCreated: () => {
      setActiveView(VIEW_CONCEPTUAL)
      resetViewport()
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
    onDeleteAssociation,
    onDeleteClass,
    onDeleteSelection,
    onOpenModel,
    onRequestNewModel,
    onSaveModel,
  })

  const onExportPng = useCallback(async () => {
    if (!reactFlowWrapper.current) {
      return
    }

    const container = reactFlowWrapper.current
    const containerRect = container.getBoundingClientRect()
    if (!containerRect.width || !containerRect.height) {
      return
    }

    const imageWidth = Math.round(containerRect.width)
    const imageHeight = Math.round(containerRect.height)

    const backgroundColor = '#ffffff'

    try {
      const dataUrl = await toPng(container, {
        backgroundColor,
        filter: (node) =>
          !(node instanceof Element) ||
          (!node.closest('[data-no-export="true"]') &&
            !node.closest('.react-flow__background') &&
            (includeAccentColorsInExport || node.dataset.accentBar !== 'true')),
        width: imageWidth,
        height: imageHeight,
      })

      const normalizedName = sanitizeFileName(modelName ?? 'Untitled model')
      const viewLabel = activeView?.trim() ? activeView.trim() : 'conceptual'
      const viewSuffix = sanitizeFileName(viewLabel)
      const baseName = normalizedName || 'untitled-model'
      const fileName = viewSuffix
        ? `${baseName}-${viewSuffix}.png`
        : `${baseName}.png`
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = fileName
      link.click()
    } catch (error) {
      console.error('Failed to export PNG', error)
    }
  }, [activeView, includeAccentColorsInExport, modelName])

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

  const defaultValueEntries = useMemo(() => {
    if (activeView !== VIEW_PHYSICAL) {
      return []
    }

    return nodes.flatMap((node) => {
      const className =
        typeof node.data?.label === 'string' && node.data.label.trim()
          ? node.data.label.trim()
          : 'Class'
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

  return (
    <Toast.Provider duration={6500} swipeDirection="right">
      <div className="h-screen overflow-hidden bg-base-200 text-base-content">
        <div className="flex h-full flex-col">
          <Navbar
            modelName={modelName}
            onRenameModel={setModelName}
            onNewModel={onRequestNewModel}
            onOpenModel={onOpenModel}
            onSaveModel={onSaveModel}
            onSaveModelAs={onSaveModelAs}
            onImportJavaModelizer={onImportJavaModelizer}
            onExportPng={onExportPng}
            showBackground={showBackground}
            showAccentColors={showAccentColors}
            showFullscreen={showFullscreen}
            showCompositionAggregation={showCompositionAggregation}
            showNotes={showNotes}
            showAreas={showAreas}
            onToggleBackground={() => setShowBackground((current) => !current)}
            onToggleAccentColors={() =>
              setShowAccentColors((current) => !current)
            }
            onToggleFullscreen={() => setShowFullscreen((current) => !current)}
            onToggleCompositionAggregation={() =>
              setShowCompositionAggregation((current) => !current)
            }
            onToggleNotes={onToggleNotes}
            onToggleAreas={onToggleAreas}
            viewSpecificSettingsOnly={viewSpecificSettingsOnly}
            onToggleViewSpecificSettingsOnly={() =>
              setViewSpecificSettingsOnly((current) => !current)
            }
            nullDisplayMode={nullDisplayMode}
            onNullDisplayModeChange={setNullDisplayMode}
            confirmDelete={confirmDelete}
            onToggleConfirmDelete={setConfirmDelete}
            includeAccentColorsInExport={includeAccentColorsInExport}
            onToggleIncludeAccentColorsInExport={setIncludeAccentColorsInExport}
            isDirty={isDirty}
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
                nodes={panelNodes}
                edges={panelEdges}
                activeView={activeView}
                viewSpecificSettingsOnly={viewSpecificSettingsOnly}
                onAddClass={onAddClass}
                onRenameClass={onRenameClass}
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
                showCompositionAggregation={showCompositionAggregation}
                onToggleAssociationComposition={onToggleAssociationComposition}
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
            <main className="flex-1 min-w-0 bg-base-100">
              <div
                className={`group/flow relative h-full w-full ${isConnecting ? 'is-connecting' : ''}`}
                ref={reactFlowWrapper}
              >
                <ReactFlow
                  nodes={visibleFlowNodes}
                  edges={flowEdges}
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
                  <div data-no-export="true">
                    <Controls position="bottom-right" />
                  </div>
                  {showBackground ? <Background gap={16} size={1} /> : null}
                </ReactFlow>
                {activeView === VIEW_PHYSICAL ? (
                  <DefaultValuesPanel entries={defaultValueEntries} />
                ) : null}
              </div>
            </main>
          </div>
        </div>
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
        <Toast.Root
          open={hiddenContentToast.open}
          onOpenChange={onHiddenContentToastOpenChange}
          className="toast-root"
          data-no-export="true"
        >
          <div className="toast-icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="toast-icon-svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <Toast.Title className="toast-title">
            {hiddenContentToast.title}
          </Toast.Title>
          <Toast.Description className="toast-description">
            {hiddenContentToast.description}
          </Toast.Description>
        </Toast.Root>
        <Toast.Viewport
          className="toast-viewport"
          data-no-export="true"
        />
      </div>
    </Toast.Provider>
  )
}

export default App
