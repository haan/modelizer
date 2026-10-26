import { cleanup, render, screen } from '@testing-library/react'
import { createPortal } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Association } from '../Association.jsx'
import { Composition } from '../Composition.jsx'
import { AssociativeAssociation } from '../AssociativeAssociation.jsx'
import { getAssociationEndpointAllocations, getAssociationLayout } from '../../utils/associationUtils.js'
import { normalizeEdges, reverseAssociationEndpoints } from '../../../../model/edgeUtils.js'

const flow = vi.hoisted(() => ({ edges: [], nodes: {
  a: { position: { x: 0, y: 0 }, measured: { width: 188, height: 80 } },
  b: { position: { x: 400, y: 0 }, measured: { width: 188, height: 80 } },
} }))
vi.mock('@xyflow/react', async importOriginal => ({
  ...await importOriginal(),
  useStore: selector => selector({ ...flow, nodeLookup: new Map(Object.entries(flow.nodes)) }),
  useInternalNode: id => flow.nodes[id],
  useReactFlow: () => ({}),
  EdgeLabelRenderer: ({ children }) => createPortal(children, document.body),
}))
afterEach(() => {
  cleanup()
  flow.edges = []
  flow.nodes = {
    a: { position: { x: 0, y: 0 }, measured: { width: 188, height: 80 } },
    b: { position: { x: 400, y: 0 }, measured: { width: 188, height: 80 } },
  }
})

describe.each(['straight', 'orthogonal', 'manual'])('changing the whole with %s routing', lineStyle => {
  it.each([1, 3])('keeps geometry and labels in place with %i association(s)', count => {
    flow.nodes = {
      a: { position: { x: 0, y: 0 }, measured: { width: 188, height: 80 } },
      b: { position: { x: 430, y: 170 }, measured: { width: 188, height: 120 } },
    }
    flow.edges = normalizeEdges(Array.from({ length: count }, (_, index) => ({
      id: `composition-${index}`, source: 'a', target: 'b', type: 'composition',
      data: { name: 'contains', lineStyle, multiplicityA: '0..*', multiplicityB: '1..1',
        controlPoints: lineStyle === 'manual' ? [{ x: 270, y: 40 }, { x: 350, y: 240 }] : [] },
    })))
    const first = flow.edges[0]
    const { container, rerender } = render(<svg><Composition {...first} /></svg>)
    const multiplicityTransforms = ['0..*', '1..1'].map(label => screen.getByText(label).style.transform)
    const coordinates = () => container.querySelector('.react-flow__edge-path').getAttribute('d')
      .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number)
      .reduce((pairs, number, index) => {
        if (index % 2 === 0) pairs.push([number])
        else pairs[pairs.length - 1].push(number)
        return pairs
      }, [])
    const beforeCoordinates = coordinates()
    const diamondCenter = () => container.querySelector('polygon').getAttribute('transform').match(/translate\(([^)]+)\)/)[1].split(',').map(Number)
    const originalDiamond = diamondCenter()
    const originalTarget = beforeCoordinates.at(-1)
    expect(Math.hypot(originalDiamond[0] - originalTarget[0], originalDiamond[1] - originalTarget[1])).toBeCloseTo(7)

    const reversed = reverseAssociationEndpoints(first)
    flow.edges = [reversed, ...flow.edges.slice(1)]
    rerender(<svg><Composition {...reversed} /></svg>)
    const afterCoordinates = coordinates().reverse()
    expect(afterCoordinates).toHaveLength(beforeCoordinates.length)
    afterCoordinates.forEach((pair, index) => pair.forEach((number, axis) => expect(number).toBeCloseTo(beforeCoordinates[index][axis])))
    expect(['0..*', '1..1'].map(label => screen.getByText(label).style.transform)).toEqual(multiplicityTransforms)
    const newDiamond = diamondCenter()
    expect(Math.hypot(newDiamond[0] - beforeCoordinates[0][0], newDiamond[1] - beforeCoordinates[0][1])).toBeCloseTo(7)
  })
})

it('attaches a dashed association-class link to the allocated path despite stale helper coordinates', () => {
  const nodes = { ...flow.nodes, upper: { position: { x: 0, y: -150 }, measured: { width: 188, height: 80 } } }
  flow.nodes = nodes
  flow.edges = [
    { id: 'base', type: 'association', source: 'a', target: 'b', data: { lineStyle: 'orthogonal' } },
    { id: 'other', type: 'association', source: 'upper', target: 'b', data: { lineStyle: 'orthogonal' } },
  ]
  const allocations = getAssociationEndpointAllocations(flow.edges, id => nodes[id])
  const layout = getAssociationLayout(nodes.a, nodes.b, flow.edges[0].data, allocations.get('base'))
  const { container } = render(<svg><AssociativeAssociation id="dashed" source="link-class" target="assoc-edge-base"
    sourceX={200} sourceY={300} sourceHandle="top-source" targetX={-900} targetY={-900} /></svg>)
  const coordinates = container.querySelector('#dashed').getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number)
  expect(coordinates.slice(-2)).toEqual([layout.labelX, layout.labelY])
})

describe.each([['association', Association], ['composition', Composition]])('%s parallel labels', (type, Component) => {
  it('keeps upper endpoint labels in their familiar positions when the peer changes mode', () => {
    const first = { id: 'one', source: 'a', target: 'b', type, data: {
      parallelCount: 2, parallelIndex: 0, lineStyle: 'orthogonal',
      name: 'Full association name', multiplicityA: '0..*', multiplicityB: '1..1',
      roleA: 'Full source role', roleB: 'Full target role',
    } }
    flow.edges = [first, { id: 'two', source: 'b', target: 'a', type: 'association',
      data: { parallelCount: 2, parallelIndex: 1, lineStyle: 'orthogonal' } }]
    const { rerender, container } = render(<svg><Component {...first} /></svg>)
    const path = container.querySelector('.react-flow__edge-path').getAttribute('d')
    const multiplicityTransform = screen.getByText('0..*').style.transform
    expect(multiplicityTransform).toContain('translate(0%, 0%)')
    const roleTransform = type === 'association' ? screen.getByText('Full source role').style.transform : null
    if (roleTransform) expect(roleTransform).toContain('translate(0%, -100%)')
    expect(screen.getByText('Full association name')).toHaveClass('whitespace-nowrap')

    flow.edges = [first, { ...flow.edges[1], data: { ...flow.edges[1].data, lineStyle: 'straight' } }]
    rerender(<svg><Component {...first} /></svg>)
    expect(screen.getByText('0..*').style.transform).toBe(multiplicityTransform)
    if (roleTransform) expect(screen.getByText('Full source role').style.transform).toBe(roleTransform)
    expect(screen.getByText('Full association name')).not.toHaveClass('whitespace-nowrap')
    expect(container.querySelector('.react-flow__edge-path').getAttribute('d')).toBe(path)
  })

  it('keeps the lower roles aligned at the class, including with reversed endpoints', () => {
    const first = { id: 'one', source: 'a', target: 'b', type, data: {
      parallelCount: 2, parallelIndex: 1, lineStyle: 'orthogonal',
      roleA: 'source role', roleB: 'target role', multiplicityA: '0..*',
    } }
    flow.edges = [first, { id: 'two', source: 'b', target: 'a', type: 'association',
      data: { parallelCount: 2, parallelIndex: 0, lineStyle: 'orthogonal',
        multiplicityA: 'target neighbour', multiplicityB: 'source neighbour' } }]
    const { rerender } = render(<svg><Component {...first} /></svg>)
    expect(screen.queryByText('source neighbour')).toBeNull()
    expect(screen.queryByText('target neighbour')).toBeNull()
    if (type === 'association') {
      expect(screen.getByText('source role').style.transform).toContain('translate(0%, -100%)')
      expect(screen.getByText('target role').style.transform).toContain('translate(-100%, -100%)')
    }
    flow.edges = [first, { ...flow.edges[1], data: { ...flow.edges[1].data, lineStyle: 'manual' } }]
    rerender(<svg><Component {...first} /></svg>)
    expect(screen.queryByText('source neighbour')).toBeNull()
    expect(screen.queryByText('target neighbour')).toBeNull()
  })
})
