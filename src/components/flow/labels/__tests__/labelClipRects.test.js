import { expect, it } from 'vitest'
import { getLabelClipRects } from '../labelClipRects.js'

const contains = (rect, x, y) => x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height

it('keeps horizontal and vertical strokes visible except inside label gaps, including overlaps', () => {
  const bounds = { x: -200, y: -200, width: 400, height: 500 }
  const holes = [
    { x: -100, y: -20, width: 120, height: 18 },
    { x: -50, y: -10, width: 120, height: 18 },
    { x: 0, y: 100, width: 60, height: 18 },
  ]
  const visible = getLabelClipRects(bounds, holes)
  // Compare every pixel centre against the union, not a second clipping algorithm.
  for (let y = -199.5; y < 300; y++) {
    for (let x = -199.5; x < 200; x++) {
      if (visible.some(rect => contains(rect, x, y)) !== !holes.some(rect => contains(rect, x, y))) {
        throw new Error(`Incorrect clipping at ${x}, ${y}`)
      }
    }
  }
  expect(visible.some(rect => contains(rect, -25, -5))).toBe(false)
})

it('supports empty, duplicate, enclosing and partially out-of-bounds labels', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 }
  expect(getLabelClipRects(bounds, [])).toEqual([bounds])
  expect(getLabelClipRects(bounds, [{ x: -10, y: -10, width: 120, height: 120 }])).toEqual([])
  const hole = { x: -10, y: -10, width: 60, height: 60 }
  expect(getLabelClipRects(bounds, [hole, hole])).toEqual([
    { x: 50, y: 0, width: 50, height: 50 }, { x: 0, y: 50, width: 100, height: 50 },
  ])
})
