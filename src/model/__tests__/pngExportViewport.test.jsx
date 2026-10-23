import { afterEach, describe, expect, it, vi } from 'vitest'
import { toPng } from 'html-to-image'
import { exportFlowPng } from '../pngExport.jsx'
import { getAnnotationBounds } from '../annotationGeometry.js'
import { getPngExportContentBounds } from '../pngExportUtils.js'
import { edgeTypes } from '../../flowTypes.js'

vi.mock('html-to-image', () => ({ toPng: vi.fn() }))

afterEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it.each(['white', 'transparent'])('prepares transparent name gaps before capturing a %s PNG', async background => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
    return this.matches('.react-flow__viewport') ? 1000 : 180
  })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(80)
  vi.stubGlobal('DOMMatrixReadOnly', class { m22 = 1 })
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; this.elements = new Set() }
    observe(element) {
      this.elements.add(element)
      queueMicrotask(() => {
        if (this.elements.has(element)) this.callback([{ target: element, contentRect: { width: 180, height: 80 } }])
      })
    }
    unobserve(element) { this.elements.delete(element) }
    disconnect() { this.elements.clear() }
  })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.matches('[data-association-label]')) return { left: 100, top: 200, width: 80, height: 18, right: 180, bottom: 218 }
    return { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800 }
  })
  toPng.mockImplementationOnce(async (container, options) => {
    const label = container.querySelector('[data-association-label]')
    const mask = container.querySelector('mask')
    expect(label).toHaveTextContent('records')
    expect(label.className).not.toMatch(/bg-|backdrop/)
    expect(mask.querySelector('rect[fill="black"]')).toHaveAttribute('x', '100')
    expect(mask.querySelector('rect[fill="black"]')).toHaveAttribute('height', '18')
    expect(container.querySelector('.react-flow__edge-path')).not.toHaveAttribute('mask')
    expect(container.querySelector('.react-flow__edge-path')).toHaveAttribute('clip-path', `url(#${mask.id}-export)`)
    expect(container.querySelector('clipPath')).toHaveAttribute('clipPathUnits', 'userSpaceOnUse')
    expect(container.querySelector('.react-flow__edge-interaction')).not.toHaveAttribute('mask')
    expect(options.backgroundColor).toBe(background === 'white' ? '#ffffff' : 'transparent')
    return 'data:image/png;base64,masked'
  })
  const nodes = [
    { id: 'a', position: { x: -200, y: -100 }, data: { label: 'Loan' } },
    { id: 'b', position: { x: -200, y: 300 }, data: { label: 'BookCopy' } },
  ]
  await expect(exportFlowPng({ nodes, edges: [{ id: 'records', type: 'association', source: 'a', target: 'b', data: { name: 'records' } }],
    nodeTypes: {}, edgeTypes, annotations: {}, activeView: 'conceptual', showAnnotations: false,
    defaultValueEntries: [], fallbackWidth: 800, fallbackHeight: 600, background,
    includeAccentColorsInExport: true,
  })).resolves.toBe('data:image/png;base64,masked')
})

describe('PNG export with the installed React Flow viewport', () => {
  it.each([
    ['conceptual', 0], ['logical', 0], ['physical', 0], ['conceptual', -2000],
  ])('fits annotations without diagram nodes in %s at offset %s', async (activeView, offset) => {
    const items = [
      { id: 'text', kind: 'text', x: 900 + offset, y: 600 + offset, text: 'Teacher feedback\nA second line', fontSize: 22, width: 300, padding: 14, border: true, background: '#ffffff', color: '#ef4444' },
      { id: 'shape', kind: 'shape', shape: 'rectangle', x1: 700 + offset, y1: 800 + offset, x2: 950 + offset, y2: 920 + offset, thickness: 3, color: '#000000' },
      { id: 'ink', kind: 'stroke', tool: 'pen', points: [{ x: 1100 + offset, y: 950 + offset }, { x: 1300 + offset, y: 1000 + offset }], thickness: 10, color: '#3b82f6' },
    ]
    const annotations = { [activeView]: { items } }
    const padding = 32
    const bounds = getPngExportContentBounds({ nodes: [], annotations, activeView, includeAnnotations: true, padding })
    toPng.mockImplementationOnce(async (container, options) => {
      const group = container.querySelector('.react-flow__annotation-layer svg > g')
      expect(group).toHaveAttribute('transform', `translate(${-bounds.x}, ${-bounds.y}) scale(1)`)
      expect(container.querySelectorAll('[data-annotation-id]')).toHaveLength(3)
      expect(options.width).toBe(Math.ceil(bounds.width))
      expect(options.height).toBe(Math.ceil(bounds.height))
      for (const item of items) {
        const rect = getAnnotationBounds(item, true)
        expect(rect.x - bounds.x).toBeGreaterThanOrEqual(padding)
        expect(rect.y - bounds.y).toBeGreaterThanOrEqual(padding)
        expect(rect.x + rect.width - bounds.x).toBeLessThanOrEqual(options.width - padding)
        expect(rect.y + rect.height - bounds.y).toBeLessThanOrEqual(options.height - padding)
      }
      return 'data:image/png;base64,annotations'
    })
    await expect(exportFlowPng({ nodes: [], edges: [], annotations, activeView, showAnnotations: true,
      nodeTypes: {}, edgeTypes: {}, defaultValueEntries: [], fallbackWidth: 800, fallbackHeight: 600,
      padding, resolution: 'standard', includeAccentColorsInExport: true,
    })).resolves.toBe('data:image/png;base64,annotations')
  })
})


it.each(['conceptual', 'logical', 'physical'])('measures newly visible nodes and exports mixed content in %s', async (activeView) => {
  // jsdom has no layout engine: supply browser measurements, keeping React Flow real.
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(240)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(160)
  vi.stubGlobal('DOMMatrixReadOnly', class { m22 = 1 })
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; this.elements = new Set() }
    observe(element) {
      this.elements.add(element)
      queueMicrotask(() => {
        if (this.elements.has(element)) this.callback([{ target: element, contentRect: { width: 240, height: 160 } }])
      })
    }
    unobserve(element) { this.elements.delete(element) }
    disconnect() { this.elements.clear() }
  })
  const nodes = [{ id: 'new-note', type: 'default', position: { x: -500, y: -300 }, data: { label: 'Newly visible note' } }]
  const annotations = { [activeView]: { items: [{ id: 'feedback', kind: 'text', x: 500, y: 500, text: 'Feedback', fontSize: 22, color: '#ef4444' }] } }
  toPng.mockImplementationOnce(async (container) => {
    const node = container.querySelector('.react-flow__node')
    expect(node).toBeVisible()
    expect(node.style.visibility).not.toBe('hidden')
    expect(container.querySelector('[data-annotation-id="feedback"]')).not.toBeNull()
    expect(container.querySelector('.react-flow')).toHaveClass('light')
    return 'data:image/png;base64,mixed'
  })
  await expect(exportFlowPng({ nodes, edges: [], annotations, activeView, showAnnotations: true,
    nodeTypes: {}, edgeTypes: {}, defaultValueEntries: [], fallbackWidth: 800, fallbackHeight: 600,
    padding: 32, resolution: 'standard', includeAccentColorsInExport: true,
  })).resolves.toBe('data:image/png;base64,mixed')
})
