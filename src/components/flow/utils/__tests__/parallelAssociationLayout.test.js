import { describe, expect, it } from 'vitest'
import { getAssociationLayout } from '../associationUtils.js'

// Exercise the installed React Flow path helpers, without mocking their routing.
const node = (x, y, width, height) => ({
  internals: { positionAbsolute: { x, y } }, measured: { width, height },
})
const layouts = (source, target, count, lineStyle) => Array.from({ length: count }, (_, parallelIndex) =>
  getAssociationLayout(source, target, { parallelCount: count, parallelIndex, lineStyle }))

function expectAttached(layout, endpoint, target) {
  const x = layout[`${endpoint}X`]
  const y = layout[`${endpoint}Y`]
  const side = layout[`${endpoint}Pos`]
  const position = target.internals.positionAbsolute
  const { width, height } = target.measured
  expect(x).toBeGreaterThanOrEqual(position.x)
  expect(x).toBeLessThanOrEqual(position.x + width)
  expect(y).toBeGreaterThanOrEqual(position.y)
  expect(y).toBeLessThanOrEqual(position.y + height)
  if (side === 'left') expect(x).toBe(position.x)
  if (side === 'right') expect(x).toBe(position.x + width)
  if (side === 'top') expect(y).toBe(position.y)
  if (side === 'bottom') expect(y).toBe(position.y + height)
}

describe.each(['straight', 'orthogonal'])('parallel %s associations', (lineStyle) => {
  it.each([
    ['staggered small classes', node(27, 206, 188, 79), node(423, 44, 189, 80), 2],
    ['mixed bottom and left sides', node(0, 0, 180, 80), node(220, 50, 180, 200), 2],
    ['crowded horizontal classes', node(0, 0, 180, 77), node(400, 0, 180, 77), 5],
    ['crowded vertical classes', node(0, 0, 180, 77), node(0, 400, 180, 77), 12],
    ['unequal heights near horizontal snap', node(-200, -100, 180, 77), node(200, -155, 180, 200), 5],
    ['unequal widths near vertical snap', node(-100, -200, 180, 77), node(-155, 200, 300, 77), 12],
  ])('keeps distinct endpoints on borders for %s', (_name, source, target, count) => {
    const group = layouts(source, target, count, lineStyle)
    const reverse = layouts(target, source, count, lineStyle)
    for (const [index, layout] of group.entries()) {
      expectAttached(layout, 'source', source)
      expectAttached(layout, 'target', target)
      expect(layout.edgePath).not.toMatch(/NaN|undefined/)
      const coordinates = layout.edgePath.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number)
      expect(coordinates.slice(0, 2)).toEqual([layout.sourceX, layout.sourceY])
      expect(coordinates.slice(-2)).toEqual([layout.targetX, layout.targetY])
      expect(reverse[index].targetX).toBeCloseTo(layout.sourceX)
      expect(reverse[index].targetY).toBeCloseTo(layout.sourceY)
      expect(reverse[index].sourceX).toBeCloseTo(layout.targetX)
      expect(reverse[index].sourceY).toBeCloseTo(layout.targetY)
    }
    expect(new Set(group.map(l => `${l.sourceX},${l.sourceY}`)).size).toBe(count)
    expect(new Set(group.map(l => `${l.targetX},${l.targetY}`)).size).toBe(count)
  })

  it('uses the preferred spacing when both class borders have room', () => {
    const group = layouts(node(0, 0, 180, 200), node(400, 0, 180, 200), 3, lineStyle)
    const spacing = lineStyle === 'orthogonal' ? 42 : 25
    expect(group.map(l => l.sourceY)).toEqual([100 - spacing, 100, 100 + spacing])
    expect(group.map(l => l.targetY)).toEqual([100 - spacing, 100, 100 + spacing])
  })

  it('keeps mixed-face lane ordering consistent', () => {
    const group = layouts(node(0, 0, 180, 80), node(220, 50, 180, 200), 3, lineStyle)
    expect(group[0].sourceX).toBeGreaterThan(group[1].sourceX)
    expect(group[1].sourceX).toBeGreaterThan(group[2].sourceX)
    expect(group[0].targetY).toBeLessThan(group[1].targetY)
    expect(group[1].targetY).toBeLessThan(group[2].targetY)
  })
})

it('does not redistribute manually routed endpoints', () => {
  const source = node(0, 0, 180, 77)
  const target = node(400, 0, 180, 77)
  const data = { lineStyle: 'manual', controlPoints: [{ x: 280, y: 100 }] }
  expect(getAssociationLayout(source, target, { ...data, parallelIndex: 0, parallelCount: 5 }))
    .toEqual(getAssociationLayout(source, target, data))
})

describe('two default orthogonal connections on minimum classes', () => {
  it.each([
    ['horizontal', node(0, 0, 180, 77), node(500, 0, 180, 77), 'Y', 42],
    ['vertical', node(0, 0, 180, 77), node(0, 350, 180, 77), 'X', 120],
    ['staggered horizontal', node(0, 0, 180, 77), node(500, 125, 180, 77), 'Y', 42],
    ['staggered vertical', node(0, 0, 180, 77), node(130, 350, 180, 77), 'X', 120],
  ])('provides label room without changing node dimensions: %s', (_name, source, target, axis, spacing) => {
    const before = JSON.stringify([source, target])
    const group = layouts(source, target, 2, 'orthogonal')
    for (const endpoint of ['source', 'target']) {
      expect(Math.abs(group[1][endpoint + axis] - group[0][endpoint + axis])).toBeCloseTo(spacing)
    }
    group.forEach(layout => {
      expectAttached(layout, 'source', source)
      expectAttached(layout, 'target', target)
    })
    expect(JSON.stringify([source, target])).toBe(before)
  })

  it('retains the existing 25px spacing for straight groups', () => {
    const source = node(0, 0, 180, 77)
    const target = node(500, 0, 180, 77)
    for (const count of [2, 3]) {
      const group = layouts(source, target, count, 'straight')
      expect(group[1].sourceY - group[0].sourceY).toBe(25)
    }
  })
})

describe('readable spacing for larger orthogonal groups', () => {
  it.each([
    ['three on tall classes', 180, 160, 3, 'Y', 42],
    ['four on tall classes', 180, 160, 4, 'Y', 42],
    ['three on minimum classes', 180, 77, 3, 'Y', 30.5],
    ['six on minimum classes', 180, 77, 6, 'Y', 12.2],
    ['three on wide classes', 300, 77, 3, 'X', 120],
    ['three on minimum-width classes', 180, 77, 3, 'X', 82],
  ])('%s use the largest spacing up to the readable default', (_name, width, height, count, axis, spacing) => {
    const source = node(-200, -100, width, height)
    const target = axis === 'Y' ? node(400, -100, width, height) : node(-200, 400, width, height)
    const group = layouts(source, target, count, 'orthogonal')
    group.forEach((layout, i) => {
      expectAttached(layout, 'source', source)
      expectAttached(layout, 'target', target)
      if (i > 0) {
        expect(layout['source' + axis] - group[i - 1]['source' + axis]).toBeCloseTo(spacing)
        expect(layout['target' + axis] - group[i - 1]['target' + axis]).toBeCloseTo(spacing)
      }
    })
  })

  it('compresses only the endpoint whose class has insufficient space', () => {
    const group = layouts(node(0, 0, 180, 77), node(500, -41.5, 180, 160), 3, 'orthogonal')
    expect(group.map(l => l.sourceY)).toEqual([8, 38.5, 69])
    expect(group.map(l => l.targetY)).toEqual([-3.5, 38.5, 80.5])
  })

  it('leaves room between neighbouring role and multiplicity rows on tall classes', () => {
    const group = layouts(node(0, 0, 180, 160), node(500, 0, 180, 160), 3, 'orthogonal')
    for (const endpoint of ['source', 'target']) {
      for (let i = 1; i < group.length; i++) {
        // Existing 18px label line height, with a 1px offset on either side.
        const previousMultiplicityBottom = group[i - 1][endpoint + 'Y'] + 1 + 18
        const nextRoleTop = group[i][endpoint + 'Y'] - 1 - 18
        expect(nextRoleTop - previousMultiplicityBottom).toBeGreaterThanOrEqual(4)
      }
    }
  })
})
