import { useCallback, useEffect, useRef, useState } from 'react'
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
import { sanitizeFileName } from './model/fileUtils.js'

const MIN_INFO_WIDTH = 350

function App() {
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [infoWidth, setInfoWidth] = useState(360)
  const [showMiniMap, setShowMiniMap] = useState(false)
  const [showBackground, setShowBackground] = useState(true)
  const [showAccentColors, setShowAccentColors] = useState(true)
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

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
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
    onDeleteAssociation,
    onUpdateAssociationMultiplicity,
    onUpdateAssociationRole,
    onHighlightAssociation,
    onReorderClasses,
    onReorderAttributes,
    onUpdateAttribute,
    onAddAttribute,
    onDeleteAttribute,
    onUpdateClassColor,
    onDeleteClass,
    onHighlightClass,
    onPaneClick,
    flowNodes,
  } = useModelState({
    reactFlowInstance,
    reactFlowWrapper,
    showAccentColors,
  })

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
    setNodes,
    setEdges,
    setModelName,
    setActiveSidebarItem,
  })

  useKeyboardShortcuts({
    nodes,
    edges,
    onDeleteAssociation,
    onDeleteClass,
    onOpenModel,
    onRequestNewModel,
    onSaveModel,
  })

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
    [onExportPng, onOpenModel, onRequestNewModel, onSaveModel, setActiveSidebarItem],
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
    </div>
  )
}

export default App
