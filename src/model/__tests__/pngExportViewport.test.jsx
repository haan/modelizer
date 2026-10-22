import { afterEach, describe, expect, it, vi } from 'vitest'
import { toPng } from 'html-to-image'
import { exportFlowPng } from '../pngExport.jsx'
import { getAnnotationBounds } from '../annotationGeometry.js'
import { getPngExportContentBounds } from '../pngExportUtils.js'

vi.mock('html-to-image', () => ({ toPng: vi.fn() }))

afterEach(() => { vi.clearAllMocks() })

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
