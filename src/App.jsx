import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import ReactFlow, {
  Background,
  ConnectionMode,
  ConnectionLineType,
  Controls,
  MiniMap,
} from 'reactflow'
import { toPng } from 'html-to-image'
import { edgeTypes, nodeTypes } from './flowTypes.js'
import { MODEL_EXAMPLES } from './examples.js'
import { InfoPanel, Navbar, Sidebar } from './components/layout/index.js'
import { useFileActions } from './hooks/useFileActions.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useModelState } from './hooks/useModelState.js'
import DefaultValuesPanel from './components/flow/DefaultValuesPanel.jsx'
import { sanitizeFileName } from './model/fileUtils.js'
import { DEFAULT_VIEW, VIEW_PHYSICAL } from './model/constants.js'

const MIN_INFO_WIDTH = 370

function App() {
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [infoWidth, setInfoWidth] = useState(370)
  const [showMiniMap, setShowMiniMap] = useState(false)
  const [showBackground, setShowBackground] = useState(true)
  const [showAccentColors, setShowAccentColors] = useState(true)
  const [alternateNNDisplay, setAlternateNNDisplay] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeView, setActiveView] = useState(DEFAULT_VIEW)
  const [duplicateDialog, setDuplicateDialog] = useState({
    open: false,
    title: '',
    description: '',
  })
  const [deleteDialog, setDeleteDialog] = useState({
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
    const config =
      kind === 'relationship'
        ? {
            title: 'Duplicate relationship',
            description:
              'A relationship between these attribute handles already exists. Remove the existing relationship before creating another.',
          }
        : kind === 'associative'
          ? {
              title: 'Duplicate associative association',
              description:
                'An associative association between this class handle and the association helper node already exists. Remove the existing associative association before creating another.',
            }
          : kind === 'reflexive'
            ? {
                title: 'Duplicate reflexive association',
                description:
                  'A reflexive association between these class handles already exists. Remove the existing reflexive association before creating another.',
              }
            : {
                title: 'Duplicate association',
                description:
                  'An association between these class handles already exists. Remove the existing association before creating another.',
              }

    setDuplicateDialog({ open: true, ...config })
  }, [])

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
    alternateNNDisplay,
    onDuplicateEdge,
    activeView,
  })

  const requestDelete = useCallback(
    ({ title, description, action }) => {
      if (!confirmDelete) {
        action()
        return
      }

      deleteActionRef.current = action
      setDeleteDialog({ open: true, title, description })
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
        title: 'Delete class?',
        description:
          'This removes the class and any connected associations. This action cannot be undone.',
        action: () => deleteClass(nodeId),
      }),
    [deleteClass, requestDelete],
  )

  const onDeleteAssociation = useCallback(
    (edgeId) =>
      requestDelete({
        title: 'Delete association?',
        description:
          'This removes the association. This action cannot be undone.',
        action: () => deleteAssociation(edgeId),
      }),
    [deleteAssociation, requestDelete],
  )

  const onDeleteAttribute = useCallback(
    (nodeId, attributeId) =>
      requestDelete({
        title: 'Delete attribute?',
        description:
          'This removes the attribute from the class. This action cannot be undone.',
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
        title: 'Delete selected items?',
        description:
          'This removes the selected items. This action cannot be undone.',
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
            !node.closest('.react-flow__background')),
        width: imageWidth,
        height: imageHeight,
      })

      const normalizedName = sanitizeFileName(modelName ?? 'Untitled model')
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
  }, [modelName])

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
          alternateNNDisplay={alternateNNDisplay}
          onToggleAlternateNNDisplay={setAlternateNNDisplay}
          confirmDelete={confirmDelete}
          onToggleConfirmDelete={setConfirmDelete}
          isDirty={isDirty}
        />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            activeItem={activeSidebarItem}
            onSelect={onSidebarSelect}
            activeView={activeView}
            onViewChange={setActiveView}
          />
          <InfoPanel
            width={infoWidth}
            onResizeStart={onResizeStart}
            activeItem={activeSidebarItem}
            nodes={panelNodes}
            edges={panelEdges}
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
                {showMiniMap ? (
                  <div data-no-export="true">
                    <MiniMap />
                  </div>
                ) : null}
                {showBackground ? <Background gap={16} size={1} /> : null}
              </ReactFlow>
              {activeView === VIEW_PHYSICAL ? (
                <DefaultValuesPanel entries={defaultValueEntries} />
              ) : null}
            </div>
          </main>
        </div>
      </div>
      <AlertDialog.Root
        open={isConfirmDialogOpen}
        onOpenChange={onConfirmDialogOpenChange}
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
              <AlertDialog.Cancel
                className="inline-flex h-8 items-center justify-center rounded-md border border-base-content/20 px-3 text-xs font-medium transition-colors hover:bg-base-200"
                onClick={onCancelDiscardChanges}
              >
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-content transition-colors hover:bg-primary/90"
                onClick={onConfirmDiscardChanges}
              >
                Discard
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <AlertDialog.Root
        open={deleteDialog.open}
        onOpenChange={onDeleteDialogOpenChange}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <AlertDialog.Title className="text-sm font-semibold">
              {deleteDialog.title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-xs text-base-content/70">
              {deleteDialog.description}
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Cancel
                className="inline-flex h-8 items-center justify-center rounded-md border border-base-content/20 px-3 text-xs font-medium transition-colors hover:bg-base-200"
                onClick={() => onDeleteDialogOpenChange(false)}
              >
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-content transition-colors hover:bg-primary/90"
                onClick={onConfirmDelete}
              >
                Delete
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <AlertDialog.Root
        open={duplicateDialog.open}
        onOpenChange={onDuplicateDialogOpenChange}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <AlertDialog.Title className="text-sm font-semibold">
              {duplicateDialog.title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-xs text-base-content/70">
              {duplicateDialog.description}
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end">
              <AlertDialog.Action
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-content transition-colors hover:bg-primary/90"
                onClick={() => onDuplicateDialogOpenChange(false)}
              >
                OK
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

export default App
