import { useEffect } from 'react'
import {
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  ConnectionLineType,
  ConnectionMode,
} from '@xyflow/react'
import AnnotationLayer from '../components/annotations/AnnotationLayer.jsx'
import DefaultValuesPanel from '../components/flow/overlays/DefaultValuesPanel.jsx'
import { VIEW_PHYSICAL } from './constants.js'
import AssociationLabelMask from '../components/flow/labels/AssociationLabelMask.jsx'

const noop = () => {}

function ExportReady({ hasNodes, onReady }) {
  const nodesInitialized = useNodesInitialized()
  const flow = useReactFlow()
  useEffect(() => {
    if (flow.viewportInitialized && (!hasNodes || nodesInitialized)) onReady?.(flow)
  }, [flow, hasNodes, nodesInitialized, onReady])
  return null
}

export default function PngExportCanvas({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  bounds,
  width,
  height,
  annotations,
  activeView,
  showAnnotations,
  currentStroke,
  defaultValueEntries,
  onInit,
}) {
  // defaultNodes lets React Flow keep measurements local to the export canvas.
  const viewport = {
    x: -bounds.x,
    y: -bounds.y,
    zoom: 1,
  }

  return (
    <div
      className="group/flow relative"
      style={{ width }}
    >
      <div style={{ width, height }}>
        <ReactFlow
          colorMode="light"
          style={{ background: 'transparent' }}
          defaultNodes={nodes}
          defaultEdges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={viewport}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.Straight}
          connectionRadius={40}
          maxZoom={1}
          minZoom={1}
          defaultEdgeOptions={{ interactionWidth: 20 }}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <ExportReady hasNodes={nodes.some((node) => !node.hidden)} onReady={onInit} />
          <AssociationLabelMask />
          {showAnnotations ? (
            <AnnotationLayer
              annotations={annotations}
              activeView={activeView}
              activeTool="pointer"
              penSettings={{ color: '#1d4ed8', thickness: 3 }}
              markerSettings={{ color: '#facc15', thickness: 12, opacity: 0.35 }}
              eraserSettings={{ size: 16 }}
              currentStroke={currentStroke}
              pendingText={null}
              isTemporaryPanMode={false}
              onPointerDown={noop}
              onPointerMove={noop}
              onPointerUp={noop}
              onCommitText={noop}
              onCommitTextEdit={noop}
              selectedTextId={null}
              editingTextId={null}
              onTextPointerDown={noop}
              onTextDoubleClick={noop}
            />
          ) : null}
        </ReactFlow>
      </div>
      {activeView === VIEW_PHYSICAL && defaultValueEntries?.length ? (
        <div data-export-footer="true" className="p-4 [&>div]:static [&>div]:shadow-none [&_dt]:whitespace-normal [&_dt]:overflow-visible [&_dt]:break-words [&_dd]:break-all">
          <DefaultValuesPanel entries={defaultValueEntries} />
        </div>
      ) : null}
    </div>
  )
}
