import { describe, expect, it } from 'vitest'
import { normalizeEdges, reverseAssociationEndpoints } from '../edgeUtils.js'
import { parseModelFile } from '../modelOpening.js'
import { buildHashPayload } from '../../hooks/useFileActions.js'

const edge = {
  id: 'composition', type: 'composition', source: 'part', target: 'whole',
  sourceHandle: 'right-source', targetHandle: 'top-target', selected: true,
  data: { name: 'contains', comment: 'Keep this', type: 'composition',
    multiplicityA: '0..*', multiplicityB: '1..1', roleA: 'items', roleB: 'owner',
    lineStyle: 'manual', controlPoints: [{ x: 300, y: 40 }, { x: 450, y: 180 }],
    custom: { retained: true } },
}

describe('composition endpoint reversal', () => {
  it('moves endpoint data with the classes without mutating the original', () => {
    const before = structuredClone(edge)
    const reversed = reverseAssociationEndpoints(edge)
    expect(reversed).toEqual({
      ...edge, source: 'whole', target: 'part', sourceHandle: 'top-source', targetHandle: 'right-target',
      data: { ...edge.data, multiplicityA: '1..1', multiplicityB: '0..*', roleA: 'owner', roleB: 'items',
        controlPoints: [{ x: 450, y: 180 }, { x: 300, y: 40 }] },
    })
    expect(edge).toEqual(before)
    expect(reverseAssociationEndpoints(reversed)).toEqual(edge)
  })

  it.each(['left', 'right', 'top', 'bottom'])('retains the %s class-side handle', side => {
    const reversed = reverseAssociationEndpoints({ ...edge, sourceHandle: `${side}-source`, targetHandle: `${side}-target` })
    expect(reversed.sourceHandle).toBe(`${side}-source`)
    expect(reversed.targetHandle).toBe(`${side}-target`)
  })

  it('preserves absent optional fields on a round trip', () => {
    const sparse = { id: 'sparse', type: 'composition', source: 'part', target: 'whole', data: { roleA: 'items' } }
    const reversed = reverseAssociationEndpoints(sparse)
    expect(reversed.data).toEqual({ roleB: 'items' })
    expect(reverseAssociationEndpoints(reversed)).toEqual(sparse)
    expect(reverseAssociationEndpoints(reverseAssociationEndpoints({ ...sparse, data: undefined })))
      .toEqual({ ...sparse, data: undefined })
  })

  it('loads existing compositions unchanged and round trips the chosen whole with version 2', () => {
    const nodes = ['part', 'whole'].map(id => ({ id, type: 'class', position: { x: 0, y: 0 }, data: { label: id } }))
    const original = parseModelFile(JSON.stringify({ version: 2, nodes, edges: [edge] }))
    expect(original.edges[0]).toMatchObject(edge)
    const reversed = reverseAssociationEndpoints(original.edges[0])
    const payload = buildHashPayload({ ...original, edges: [reversed] })
    expect(payload.version).toBe(2)
    const reopened = parseModelFile(JSON.stringify(payload))
    expect(reopened.edges).toEqual(normalizeEdges([{ ...reversed, selected: false }]))
    expect(reopened.edges[0].target).toBe('part')
    expect(Object.keys(reopened.edges[0].data).sort()).toEqual(Object.keys(original.edges[0].data).sort())
  })
})
