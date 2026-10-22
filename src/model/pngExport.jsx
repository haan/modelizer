import { createRoot } from 'react-dom/client'
import { toPng } from 'html-to-image'
import PngExportCanvas from './PngExportCanvas.jsx'
import {
  getPngExportContentBounds,
  getPngExportDimensions,
  getPngExportPixelRatio,
  PNG_EXPORT_PADDING,
} from './pngExportUtils.js'

const BACKGROUND_COLOR = '#ffffff'
const EXPORT_RENDER_TIMEOUT_MS = 5000

function waitForFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve))
}

function waitForExportInitialization(initializedPromise) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Timed out waiting for the PNG export canvas to render.'))
    }, EXPORT_RENDER_TIMEOUT_MS)

    initializedPromise.then(
      (instance) => {
        window.clearTimeout(timeoutId)
        resolve(instance)
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

export function shouldIncludePngExportNode(node, includeAccentColorsInExport) {
  return (
    !(node instanceof Element) ||
    (!node.closest('[data-no-export="true"]') &&
      !node.closest('.react-flow__background') &&
      (includeAccentColorsInExport || node.dataset.accentBar !== 'true'))
  )
}

function createOffscreenContainer(width, height, backgroundColor) {
  const container = document.createElement('div')
  container.dataset.theme = 'light'
  container.setAttribute('aria-hidden', 'true')
  container.style.position = 'fixed'
  container.style.left = '0'
  container.style.top = '0'
  container.style.zIndex = '-1'
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.background = backgroundColor
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
  background = 'white',
  padding = PNG_EXPORT_PADDING,
  resolution = 'high',
}) {
  const backgroundColor = background === 'transparent' ? 'transparent' : BACKGROUND_COLOR
  let bounds =
    getPngExportContentBounds({
      nodes,
      edges,
      annotations,
      activeView,
      includeAnnotations: showAnnotations,
      currentStroke,
      padding,
    }) ?? { x: 0, y: 0, width: fallbackWidth, height: fallbackHeight }
  let { width, height } = getPngExportDimensions(
    bounds,
    fallbackWidth,
    fallbackHeight,
  )
  const container = createOffscreenContainer(width, height, backgroundColor)
  const root = createRoot(container)

  const renderCanvas = (onInit) => {
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
        onInit={onInit}
      />,
    )
  }
  const initializedPromise = new Promise((resolve) => renderCanvas(resolve))

  try {
    const flow = await waitForExportInitialization(initializedPromise)
    await waitForFrame()
    await waitForFrame()

    // Previously hidden notes may not have measured sizes yet. Expand to the
    // rendered content, including edge labels, before capturing the image.
    const origin = container.getBoundingClientRect()
    let left = 0, top = 0, right = width, bottom = height
    container.querySelectorAll('.react-flow__node, .react-flow__edge, .react-flow__edgelabel-renderer > *').forEach((element) => {
      const rect = element.getBoundingClientRect()
      if (!rect.width && !rect.height) return
      left = Math.min(left, rect.left - origin.left - padding)
      top = Math.min(top, rect.top - origin.top - padding)
      right = Math.max(right, rect.right - origin.left + padding)
      bottom = Math.max(bottom, rect.bottom - origin.top + padding)
    })
    if (left < 0 || top < 0 || right > width || bottom > height) {
      bounds = { x: bounds.x + left, y: bounds.y + top, width: right - left, height: bottom - top }
      ;({ width, height } = getPngExportDimensions(bounds))
      container.style.width = `${width}px`
      container.style.height = `${height}px`
      renderCanvas()
      // defaultViewport is read on mount. Apply subsequent
      // bounds adjustments through its instance so annotations move with nodes.
      await waitForExportInitialization(Promise.resolve(flow.setViewport({ x: -bounds.x, y: -bounds.y, zoom: 1 })))
      await waitForFrame()
      await waitForFrame()
    }

    // Keep the physical-view legend below the diagram, inside the exported image.
    const footerHeight = Math.ceil(container.querySelector('[data-export-footer]')?.getBoundingClientRect().height ?? 0)
    const exportHeight = height + footerHeight
    container.style.height = `${exportHeight}px`
    const pixelRatio = getPngExportPixelRatio(width, exportHeight, { baseRatio: resolution === 'high' ? 2 : 1 })

    return await toPng(container, {
      backgroundColor,
      filter: (node) =>
        shouldIncludePngExportNode(node, includeAccentColorsInExport),
      width,
      height: exportHeight,
      pixelRatio,
    })
  } finally {
    root.unmount()
    container.remove()
  }
}
