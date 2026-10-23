import { describe, expect, it } from 'vitest'
import { getAssociationEndpointAllocations, getAssociationLayout } from '../associationUtils.js'

const node = (id, x, y, width = 180, height = 180) => ({
  id, type: 'class', position: { x, y }, measured: { width, height },
})
const edge = (id, source, target, data = {}) => ({ id, source, target, type: 'association', data: { lineStyle: 'orthogonal', ...data } })
const allocate = (nodes, edges) => getAssociationEndpointAllocations(edges, id => nodes.find(n => n.id === id))

describe('shared class-border allocation', () => {
  it.each(['left', 'right', 'top', 'bottom'])('keeps %s slots spaced and ordered as distance increases', side => {
    const horizontal = side === 'left' || side === 'right'
    const sign = side === 'left' || side === 'top' ? -1 : 1
    const nodes = [node('hub', 0, 0, 400, 180), ...[-1, 0, 1].map((i, j) =>
      node(`remote-${j}`, horizontal ? sign * 1000 : 110 + i * 300, horizontal ? i * 250 : sign * 1000, 180, 77))]
    // Reverse one association: the ordering must not depend on edge direction.
    const edges = [edge('a', 'remote-0', 'hub'), edge('b', 'hub', 'remote-1'), edge('c', 'remote-2', 'hub')]
    const before = JSON.stringify([nodes, edges])
    const first = allocate(nodes, edges)
    const moved = nodes.map(n => n.id === 'hub' ? n : { ...n, position: {
      x: n.position.x + (horizontal ? sign * 1600 : 0),
      y: n.position.y + (horizontal ? 0 : sign * 1600),
    } })
    const second = allocate(moved, edges)
    const slots = edges.map(e => first.get(e.id)[e.source === 'hub' ? 'source' : 'target'])
    const spacing = horizontal ? 42 : 120
    expect(slots[1][horizontal ? 'y' : 'x'] - slots[0][horizontal ? 'y' : 'x']).toBe(spacing)
    expect(slots[2][horizontal ? 'y' : 'x'] - slots[1][horizontal ? 'y' : 'x']).toBe(spacing)
    edges.forEach(e => {
      const endpoint = e.source === 'hub' ? 'source' : 'target'
      expect(second.get(e.id)[endpoint]).toEqual(first.get(e.id)[endpoint])
      const layout = getAssociationLayout(nodes.find(n => n.id === e.source), nodes.find(n => n.id === e.target), e.data, first.get(e.id))
      expect(layout[endpoint + 'Pos']).toBe(side)
      expect(layout[endpoint + 'X']).toBe(first.get(e.id)[endpoint].x)
      expect(layout[endpoint + 'Y']).toBe(first.get(e.id)[endpoint].y)
    })
    expect(JSON.stringify([nodes, edges])).toBe(before)
  })

  it('allocates parallel and other neighbours together with deterministic ordering', () => {
    const nodes = [node('hub', 600, 0), node('upper', 0, -200), node('middle', 0, 0), node('lower', 0, 200)]
    const edges = [edge('upper', 'upper', 'hub'),
      edge('middle-a', 'middle', 'hub', { parallelIndex: 0, parallelCount: 2 }),
      edge('middle-b', 'hub', 'middle', { parallelIndex: 1, parallelCount: 2 }), edge('lower', 'lower', 'hub')]
    const result = allocate(nodes, edges)
    expect(edges.map(e => result.get(e.id)[e.source === 'hub' ? 'source' : 'target'].y)).toEqual([27, 69, 111, 153])
    const reversed = allocate(nodes, [...edges].reverse().map(e => ({ ...e, source: e.target, target: e.source })))
    edges.forEach(e => expect(reversed.get(e.id).source).toEqual(result.get(e.id).target))
  })

  it('compresses crowded borders without merging endpoints or resizing classes', () => {
    const nodes = [node('hub', 1000, 0, 180, 77), ...Array.from({ length: 8 }, (_, i) => node(`n${i}`, 0, -300 + i * 90))]
    const edges = nodes.slice(1).map(n => edge(n.id, n.id, 'hub'))
    const result = allocate(nodes, edges)
    const slots = edges.map(e => result.get(e.id).target)
    expect(new Set(slots.map(p => p.y)).size).toBe(8)
    expect(slots[0].x).toBe(1000)
    expect(slots[0].y).toBeCloseTo(8)
    expect(slots.at(-1).x).toBe(1000)
    expect(slots.at(-1).y).toBeCloseTo(69)
    expect(nodes[0].measured.height).toBe(77)
  })

  it('excludes hidden, straight, manual and reflexive edges from automatic slots', () => {
    const nodes = [node('hub', 600, 0), node('remote', 0, 0)]
    const first = edge('one', 'remote', 'hub')
    for (const other of [
      { ...edge('two', 'remote', 'hub'), hidden: true },
      edge('two', 'remote', 'hub', { lineStyle: 'straight' }),
      edge('two', 'remote', 'hub', { lineStyle: 'manual' }),
      edge('two', 'remote', 'hub', { controlPoints: [{ x: 200, y: 100 }] }),
      { ...edge('two', 'hub', 'hub'), type: 'reflexiveAssociation' },
    ]) expect(allocate(nodes, [first, other]).size).toBe(0)
  })

  it('includes compositions and recomputes ordering after a neighbour moves', () => {
    const nodes = [node('hub', 700, 0), node('upper', 0, -100), node('lower', 0, 100)]
    const edges = [edge('a', 'upper', 'hub'), { ...edge('b', 'lower', 'hub'), type: 'composition' }]
    const first = allocate(nodes, edges)
    const moved = allocate(nodes.map(n => n.id === 'upper' ? { ...n, position: { x: 0, y: 200 } } : n), edges)
    expect(first.get('a').target.y).toBeLessThan(first.get('b').target.y)
    expect(moved.get('a').target.y).toBeGreaterThan(moved.get('b').target.y)
  })
})
