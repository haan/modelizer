import { describe, expect, it } from 'vitest'
import {
  getPngExportContentBounds,
  getPngExportDimensions,
  getPngExportPixelRatio,
  PNG_EXPORT_MAX_PIXELS,
  PNG_EXPORT_MAX_SIDE,
  PNG_EXPORT_PADDING,
} from '../pngExportUtils.js'

describe('pngExportUtils', () => {
  it('computes padded bounds from visible nodes and edge routing hints', () => {
    const bounds = getPngExportContentBounds({
      nodes: [
        {
          id: 'class-a',
          position: { x: 100, y: 50 },
          width: 220,
          height: 120,
        },
        {
          id: 'hidden-note',
          hidden: true,
          position: { x: -1000, y: -1000 },
          width: 200,
          height: 200,
        },
      ],
      edges: [
        {
          id: 'edge-a',
          data: {
            controlPoints: [{ x: 480, y: 20 }],
          },
        },
      ],
    })

    expect(bounds).toEqual({
      x: 4,
      y: -108,
      width: 604,
      height: 374,
    })
  })

  it('includes active-view annotation stroke and text bounds when enabled', () => {
    const bounds = getPngExportContentBounds({
      nodes: [
        {
          id: 'class-a',
          position: { x: 100, y: 50 },
          width: 220,
          height: 120,
        },
      ],
      annotations: {
        conceptual: {
          items: [
            {
              kind: 'stroke',
              thickness: 10,
              points: [
                { x: -30, y: -10 },
                { x: 10, y: 20 },
              ],
            },
            {
              kind: 'text',
              x: 500,
              y: 250,
              text: 'Export',
              fontSize: 20,
            },
          ],
        },
        logical: {
          items: [
            {
              kind: 'stroke',
              thickness: 10,
              points: [{ x: -500, y: -500 }],
            },
          ],
        },
      },
      activeView: 'conceptual',
      includeAnnotations: true,
    })

    expect(bounds.x).toBe(-30 - 5 - PNG_EXPORT_PADDING)
    expect(bounds.y).toBe(-10 - 5 - PNG_EXPORT_PADDING)
    expect(bounds.width).toBeCloseTo(801.4)
    expect(bounds.height).toBeCloseTo(464)
  })

  it('falls back to provided dimensions when bounds are empty', () => {
    expect(getPngExportContentBounds()).toBeNull()
    expect(getPngExportDimensions(null, 640, 360)).toEqual({
      width: 640,
      height: 360,
    })
  })

  it('uses 2x output for normal diagrams and caps huge diagrams', () => {
    expect(getPngExportPixelRatio(1000, 500)).toBe(2)

    const hugeRatio = getPngExportPixelRatio(9000, 6000)
    expect(hugeRatio).toBeLessThan(1)
    expect(9000 * hugeRatio).toBeLessThanOrEqual(PNG_EXPORT_MAX_SIDE)
    expect(9000 * hugeRatio * (6000 * hugeRatio)).toBeLessThanOrEqual(
      PNG_EXPORT_MAX_PIXELS,
    )
  })
})
