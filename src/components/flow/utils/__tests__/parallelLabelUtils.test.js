import { describe, expect, it } from 'vitest'
import { getAssociationLayout } from '../associationUtils.js'
import { getOrthogonalPeer, getParallelLabelPlacement } from '../parallelLabelUtils.js'
import { getEndpointLabelTransform, getRoleLabelTransform } from '../associationLabelTransforms.js'

const node = (x, y, width = 188, height = 80) => ({ position: { x, y }, measured: { width, height } })
const edge = (id, parallelIndex, data = {}) => ({
  id, source: 'a', target: 'b', type: 'association',
  data: { parallelCount: 2, parallelIndex, lineStyle: 'orthogonal', ...data },
})

// Resolve CSS percentage translations against representative label dimensions.
// These are geometry checks, not a substitute for browser/font verification.
function bounds(transform, width, height) {
  const [px, py, x, y] = transform.match(/-?\d+(?:\.\d+)?/g).map(Number)
  return { left: x + px * width / 100, top: y + py * height / 100,
    right: x + px * width / 100 + width, bottom: y + py * height / 100 + height }
}
function overlaps(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

describe('two orthogonal associations', () => {
  it.each([
    ['horizontal', node(0, 0, 180, 77), node(500, 0, 180, 77)],
    ['vertical', node(0, 0, 180, 77), node(0, 350, 180, 77)],
    ['staggered sideways down', node(0, 0, 180, 77), node(500, 125, 180, 77)],
    ['staggered sideways up', node(0, 0, 180, 77), node(500, -125, 180, 77)],
    ['staggered vertically right', node(0, 0, 180, 77), node(130, 350, 180, 77)],
    ['staggered vertically left', node(0, 0, 180, 77), node(-130, 350, 180, 77)],
  ])('fits two names, four roles and four multiplicities on minimum classes: %s', (_name, source, target) => {
    const layouts = [0, 1].map(i => getAssociationLayout(source, target, edge(String(i), i).data))
    const boxes = layouts.flatMap((layout, i) => {
      const placement = getParallelLabelPlacement(layout, layouts[1 - i])
      const endpointBoxes = ['source', 'target'].flatMap(endpoint => {
        const args = [layout[endpoint + 'Pos'], layout[endpoint + 'X'], layout[endpoint + 'Y']]
        return [
          bounds(getEndpointLabelTransform(...args), 32, 18),
          bounds(getRoleLabelTransform(...args), 80, 18),
        ]
      })
      return [...endpointBoxes, bounds(placement.nameTransform, 120, 18)]
    })
    boxes.forEach((box, i) => boxes.slice(i + 1).forEach(other => expect(overlaps(box, other)).toBe(false)))
  })

  it.each([
    ['vertical middle, upwards', node(16, 155), node(492, 30)],
    ['vertical middle, downwards', node(16, 30), node(492, 155)],
    ['horizontal middle, rightwards', node(0, 0), node(130, 350)],
    ['horizontal middle, leftwards', node(0, 0), node(-130, 350)],
    ['aligned horizontally', node(0, 0), node(400, 0)],
    ['aligned vertically', node(0, 0), node(0, 350)],
    ['negative coordinates, unequal heights', node(-400, -300, 180, 77), node(0, -200, 180, 130)],
  ])('separates names and preserves endpoint anchors: %s', (_name, source, target) => {
    const layouts = [0, 1].map(i => getAssociationLayout(source, target, edge(String(i), i).data))
    const placements = layouts.map((l, i) => getParallelLabelPlacement(l, layouts[1 - i]))
    expect(placements.every(Boolean)).toBe(true)
    const names = placements.map(p => bounds(p.nameTransform, 160, 18))
    expect(overlaps(...names)).toBe(false)
    const reverse = [0, 1].map(i => getAssociationLayout(target, source, edge(String(i), i).data))
    reverse.forEach((layout, i) => {
      const placement = getParallelLabelPlacement(layout, reverse[1 - i])
      expect(placement.nameTransform).toBe(placements[i].nameTransform)
    })
  })

  it('leaves mixed-face and manual geometry alone', () => {
    for (const [source, target, data] of [
      [node(0, 0, 180), node(220, 50, 180, 200), {}],
      [node(0, 0), node(400, 0), { lineStyle: 'manual' }],
    ]) {
      const layouts = [0, 1].map(i => getAssociationLayout(source, target, edge(String(i), i, data).data))
      expect(getParallelLabelPlacement(...layouts)).toBeNull()
    }
  })
})

describe('orthogonal pair eligibility', () => {
  it('includes a reversed peer and composition without changing the edges', () => {
    const first = edge('one', 0)
    const second = { ...edge('two', 1), source: 'b', target: 'a', type: 'composition' }
    const edges = [first, second]
    const before = JSON.stringify(edges)
    expect(getOrthogonalPeer(edges, 'one', 'a', 'b')).toBe(second)
    expect(JSON.stringify(edges)).toBe(before)
  })

  it.each([
    { lineStyle: 'straight' }, { lineStyle: 'manual' },
    { controlPoints: [{ x: 300, y: 100 }] }, { parallelCount: 3 },
  ])('leaves mixed routes or larger groups alone: %j', data => {
    const first = edge('one', 0)
    const second = edge('two', 1, data)
    expect(getOrthogonalPeer([first, second], 'one', 'a', 'b')).toBeNull()
    expect(getOrthogonalPeer([first, second], 'two', 'a', 'b')).toBeNull()
  })

  it('does not pair hidden edges, single associations or larger groups', () => {
    const first = edge('one', 0)
    expect(getOrthogonalPeer([first], 'one', 'a', 'b')).toBeNull()
    expect(getOrthogonalPeer([first, { ...edge('two', 1), hidden: true }], 'one', 'a', 'b')).toBeNull()
    expect(getOrthogonalPeer([first, edge('two', 1), edge('three', 2)], 'one', 'a', 'b')).toBeNull()
  })
})
