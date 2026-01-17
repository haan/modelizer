import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
} from 'reactflow'
import { toPng } from 'html-to-image'
import { edgeTypes, nodeTypes } from './flowTypes.js'
import { MODEL_EXAMPLES } from './examples.js'
import {
  ConfirmDiscardDialog,
  DeleteDialog,
  DuplicateDialog,
} from './components/dialogs/index.js'
import { InfoPanel, Navbar, Sidebar } from './components/layout/index.js'
import { useFileActions } from './hooks/useFileActions.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useModelState } from './hooks/useModelState.js'
import DefaultValuesPanel from './components/flow/DefaultValuesPanel.jsx'
import AntiCheatPanel from './components/flow/AntiCheatPanel.jsx'
import { sanitizeFileName } from './model/fileUtils.js'
import {
  DEFAULT_VIEW,
  CLASS_NODE_TYPE,
  RELATIONSHIP_EDGE_TYPE,
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
  showAntiCheat: 'modelizer.showAntiCheat',
  showFullscreen: 'modelizer.showFullscreen',
  showCompositionAggregation: 'modelizer.showCompositionAggregation',
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
  const [showAntiCheat, setShowAntiCheat] = useState(() =>
    readStoredBool(STORAGE_KEYS.showAntiCheat, false),
  )
  const [showFullscreen, setShowFullscreen] = useState(() =>
    readStoredBool(STORAGE_KEYS.showFullscreen, false),
  )
  const [showCompositionAggregation, setShowCompositionAggregation] = useState(() =>
    readStoredBool(STORAGE_KEYS.showCompositionAggregation, false),
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
    writeStoredBool(STORAGE_KEYS.showAntiCheat, showAntiCheat)
  }, [showAntiCheat])
  useEffect(() => {
    writeStoredBool(STORAGE_KEYS.showFullscreen, showFullscreen)
  }, [showFullscreen])
  useEffect(() => {
    writeStoredBool(
      STORAGE_KEYS.showCompositionAggregation,
      showCompositionAggregation,
    )
  }, [showCompositionAggregation])

  const onDuplicateDialogOpenChange = useCallback((open) => {
    if (!open) {
      setDuplicateDialog((current) => ({ ...current, open: false }))
    }
  }, [])

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
    onSyncViewPositions,
    onRenameClass,
    onRenameAssociation,
    onDeleteAssociation: deleteAssociation,
    onUpdateAssociationMultiplicity,
    onUpdateAssociationRole,
    onHighlightAssociation,
    onReorderClasses,
    onReorderAttributes,
    onUpdateAttribute,
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

  const onDeleteSelection = useCallback(
    ({ nodeIds, edgeIds }) => {
      if (!nodeIds.length && !edgeIds.length) {
        return
      }

      requestDelete({
        kind: 'selection',
        action: () => {
          nodeIds.forEach((nodeId) => deleteClass(nodeId))
          edgeIds.forEach((edgeId) => deleteAssociation(edgeId))
        },
      })
    },
    [deleteAssociation, deleteClass, requestDelete],
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
    onLoadExample,
    onImportJavaModelizer,
    antiCheatStatus,
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
  })

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
      setActiveSidebarItem(item)
    },
    [onExportPng, onOpenModel, onRequestNewModel, onSaveModel, setActiveSidebarItem],
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
  const classIdEntries = useMemo(() => {
    return nodes
      .filter((node) => node.type === CLASS_NODE_TYPE)
      .map((node) => ({
        id: node.id,
        name:
          typeof node.data?.label === 'string' && node.data.label.trim()
            ? node.data.label.trim()
            : 'Untitled class',
      }))
  }, [nodes])

  return (
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
          examples={MODEL_EXAMPLES}
          onLoadExample={onLoadExample}
          showBackground={showBackground}
          showAccentColors={showAccentColors}
          showFullscreen={showFullscreen}
          showCompositionAggregation={showCompositionAggregation}
          onToggleBackground={() => setShowBackground((current) => !current)}
          onToggleAccentColors={() =>
            setShowAccentColors((current) => !current)
          }
          onToggleFullscreen={() => setShowFullscreen((current) => !current)}
          onToggleCompositionAggregation={() =>
            setShowCompositionAggregation((current) => !current)
          }
          viewSpecificSettingsOnly={viewSpecificSettingsOnly}
          onToggleViewSpecificSettingsOnly={() =>
            setViewSpecificSettingsOnly((current) => !current)
          }
          showAntiCheat={showAntiCheat}
          onToggleAntiCheat={() => setShowAntiCheat((current) => !current)}
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
              onHighlightAssociation={onHighlightAssociation}
            />
          ) : null}
          <main className="flex-1 min-w-0 bg-base-100">
            <div
              className={`group/flow relative h-full w-full ${isConnecting ? 'is-connecting' : ''}`}
              ref={reactFlowWrapper}
            >
              <ReactFlow
                nodes={flowNodes}
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
              {showAntiCheat ? (
                <AntiCheatPanel
                  entries={classIdEntries}
                  status={antiCheatStatus}
                />
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
    </div>
  )
}

export default App
