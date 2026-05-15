import { createRoot } from 'react-dom/client'
import { toPng } from 'html-to-image'
import PngExportCanvas from './PngExportCanvas.jsx'
import {
  getPngExportContentBounds,
  getPngExportDimensions,
  getPngExportPixelRatio,
} from './pngExportUtils.js'

const BACKGROUND_COLOR = '#ffffff'

function waitForFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve))
}

export function shouldIncludePngExportNode(node, includeAccentColorsInExport) {
  return (
    !(node instanceof Element) ||
    (!node.closest('[data-no-export="true"]') &&
      !node.closest('.react-flow__background') &&
      (includeAccentColorsInExport || node.dataset.accentBar !== 'true'))
  )
}

function createOffscreenContainer(width, height) {
  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  container.style.position = 'fixed'
  container.style.left = '0'
  container.style.top = '0'
  container.style.zIndex = '-1'
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.background = BACKGROUND_COLOR
  container.style.pointerEvents = 'none'
  container.style.overflow = 'hidden'
  document.body.appendChild(container)
  return container
}

export async function exportFlowPng({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  annotations,
  activeView,
  showAnnotations,
  currentStroke,
  defaultValueEntries,
  fallbackWidth,
  fallbackHeight,
  includeAccentColorsInExport,
}) {
  const bounds =
    getPngExportContentBounds({
      nodes,
      edges,
      annotations,
      activeView,
      includeAnnotations: showAnnotations,
      currentStroke,
    }) ?? { x: 0, y: 0, width: fallbackWidth, height: fallbackHeight }
  const { width, height } = getPngExportDimensions(
    bounds,
    fallbackWidth,
    fallbackHeight,
  )
  const pixelRatio = getPngExportPixelRatio(width, height)
  const container = createOffscreenContainer(width, height)
  const root = createRoot(container)

  let initialized = false
  const initializedPromise = new Promise((resolve) => {
    root.render(
      <PngExportCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        bounds={bounds}
        width={width}
        height={height}
        annotations={annotations}
        activeView={activeView}
        showAnnotations={showAnnotations}
        currentStroke={currentStroke}
        defaultValueEntries={defaultValueEntries}
        onInit={() => {
          initialized = true
          resolve()
        }}
      />,
    )
  })

  try {
    await Promise.race([
      initializedPromise,
      new Promise((resolve) => window.setTimeout(resolve, 300)),
    ])
    if (initialized) {
      await waitForFrame()
    }
    await waitForFrame()

    return await toPng(container, {
      backgroundColor: BACKGROUND_COLOR,
      filter: (node) =>
        shouldIncludePngExportNode(node, includeAccentColorsInExport),
      width,
      height,
      pixelRatio,
    })
  } finally {
    root.unmount()
    container.remove()
  }
}
