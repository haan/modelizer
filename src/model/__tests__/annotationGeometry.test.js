import { describe, expect, it } from 'vitest'
import { arrowPoints, constrainPoint, eraseStroke, getAnnotationBounds, getStrokePoints, getTextLayout, resizeAnnotation } from '../annotationGeometry.js'
import { getPngExportContentBounds } from '../pngExportUtils.js'

const stroke = (points, thickness = 2) => ({ id: 'ink', kind: 'stroke', tool: 'pen', points, thickness, color: '#000000', opacity: 1 })
const point = (x, y) => ({ x, y })

describe('annotation geometry', () => {
  it('erases the visible middle of a sparse two-point stroke', () => {
    const ink = stroke([point(0, 0), point(100, 0)])
    expect(eraseStroke(ink, point(50, 0), point(50, 0), 10, 'whole')).toEqual([])
    const parts = eraseStroke(ink, point(50, 0), point(50, 0), 10, 'partial')
    expect(parts).toHaveLength(2)
    expect(parts[0].points.at(-1).x).toBeCloseTo(39)
    expect(parts[1].points[0].x).toBeCloseTo(61)
    expect(parts.every((part) => part.linear)).toBe(true)
  })
  it('uses the entire eraser sweep when both sampled positions miss the ink', () => {
    const ink = stroke([point(0, 0), point(100, 0)])
    const parts = eraseStroke(ink, point(50, -30), point(50, 30), 5, 'partial')
    expect(parts).toHaveLength(2)
    expect(parts[0].points.at(-1).x).toBeCloseTo(44)
    expect(parts[1].points[0].x).toBeCloseTo(56)
  })
  it('includes ink thickness and leaves nonintersecting strokes untouched', () => {
    const ink = stroke([point(0, 0), point(100, 0)], 20)
    expect(eraseStroke(ink, point(50, 14), point(50, 14), 5, 'whole')).toEqual([])
    expect(eraseStroke(ink, point(50, 16), point(50, 16), 5, 'partial')[0]).toBe(ink)
  })
  it('handles single-point ink and complete partial erasure', () => {
    const ink = stroke([point(10, 10)])
    expect(eraseStroke(ink, point(10, 10), point(10, 10), 5, 'partial')).toEqual([])
    expect(eraseStroke(ink, point(50, 50), point(50, 50), 5, 'partial')[0]).toBe(ink)
  })
  it('erases smoothed ink using the same geometry as the visible curve', () => {
    const ink = stroke([point(0, 0), point(100, 100), point(200, 0)], 2)
    const visible = getStrokePoints(ink)[25]
    expect(eraseStroke(ink, visible, visible, 1, 'whole')).toEqual([])
  })
  it('constrains reverse shapes to squares and lines to 45-degree increments', () => {
    expect(constrainPoint(point(100, 100), point(40, 80), 'ellipse')).toEqual(point(40, 40))
    const end = constrainPoint(point(0, 0), point(100, 6), 'line')
    expect(end.y).toBeCloseTo(0)
    expect(end.x).toBeCloseTo(Math.hypot(100, 6))
  })
  it('resizes a horizontal line by its endpoint and a text box without changing font size', () => {
    const line = { kind: 'shape', shape: 'line', x1: 0, y1: 0, x2: 100, y2: 0, thickness: 2 }
    expect(resizeAnnotation(line, 'end', point(120, 30))).toMatchObject({ x1: 0, y1: 0, x2: 120, y2: 30 })
    const text = { kind: 'text', text: 'Check the multiplicity', x: 10, y: 30, fontSize: 14, width: 120, padding: 6 }
    const resized = resizeAnnotation(text, 'e', point(250, 30))
    expect(resized.fontSize).toBe(14)
    expect(resized.width).toBe(246)
    expect(resized.x).toBe(10)
  })
  it('wraps long words and explicit paragraphs and includes text padding', () => {
    const text = { kind: 'text', text: 'CustomerIdentifier\nCheck this', x: 20, y: 30, fontSize: 14, width: 70, padding: 6, border: true }
    const layout = getTextLayout(text)
    expect(layout.lines.length).toBeGreaterThan(2)
    expect(layout.width).toBe(70)
    expect(layout.x).toBe(14)
    const bounds = getAnnotationBounds(text, true)
    expect(bounds.width).toBe(71)
    expect(bounds.height).toBe(layout.height + 1)
  })
  it('exports all shape, arrowhead, and wrapped text extents in the active view', () => {
    const arrow = { id: 'a', kind: 'shape', shape: 'arrow', x1: 0, y1: 0, x2: 100, y2: 0, thickness: 8 }
    const text = { id: 't', kind: 'text', text: 'A long explanation of the relationship', x: 200, y: 20, fontSize: 14, width: 70, padding: 6, border: true }
    const bounds = getPngExportContentBounds({ annotations: { conceptual: { items: [arrow, text] }, logical: { items: [{ ...arrow, x2: 9000 }] } }, includeAnnotations: true, padding: 0 })
    expect(bounds.x).toBe(-4)
    expect(bounds.y).toBeCloseTo(Math.min(...arrowPoints(arrow).map((p) => p.y)) - 4)
    const textBounds = getAnnotationBounds(text, true)
    expect(bounds.x + bounds.width).toBeCloseTo(textBounds.x + textBounds.width)
    expect(bounds.y + bounds.height).toBeCloseTo(textBounds.y + textBounds.height)
  })
})
