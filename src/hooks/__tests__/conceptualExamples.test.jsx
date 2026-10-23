import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useModelState } from '../useModelState.js'
import { useFileActions } from '../useFileActions.js'
import { normalizeAnnotations, useAnnotations } from '../useAnnotations.js'
import { parseModelFile } from '../../model/modelOpening.js'
import { getAssociationEndpointAllocations, getAssociationLayout } from '../../components/flow/utils/associationUtils.js'
import { getReflexiveAssociationLayout } from '../../components/flow/utils/reflexiveAssociationUtils.js'

const readExample = file => readFileSync(resolve('examples', file), 'utf8')
const manifest = JSON.parse(readExample('manifest.json'))
afterEach(cleanup)

it.each(manifest)('opens, measures and saves $file without losing content', async entry => {
  const text = readExample(entry.file)
  const original = parseModelFile(text)
  expect(original.version).toBe(2)
  expect(normalizeAnnotations(original.annotations)).toEqual(original.annotations)
  const onFileError = vi.fn()
  const write = vi.fn(), close = vi.fn()
  const handle = { createWritable: async () => ({ write, close }) }
  const { result } = renderHook(() => {
    const annotations = useAnnotations({ activeView: 'conceptual' })
    const model = useModelState({ activeView: 'conceptual', showCompositionAggregation: true })
    const actions = useFileActions({ ...model, annotations: annotations.annotations,
      annotationsDirtySignal: annotations.dirtySignal, onLoadAnnotations: annotations.onLoadAnnotations,
      onFileError, showCompositionAggregation: true })
    return { ...model, ...actions, annotations: annotations.annotations }
  })
  await act(async () => result.current.onOpenModelFile({ name: entry.file, text: async () => text }, handle))
  expect(onFileError).not.toHaveBeenCalled()
  expect(result.current.nodes.filter(n => n.type === 'class')).toHaveLength(entry.classes)
  expect(result.current.edges).toHaveLength(entry.edges)
  expect(result.current.flowEdges).toHaveLength(entry.edges)
  expect(result.current.annotations.conceptual.items).toHaveLength(entry.annotations)
  expect(result.current.isDirty).toBe(false)

  // Exercise measurement-driven geometry and helper updates, without treating
  // these synthetic dimensions as a browser layout/visual comparison.
  act(() => result.current.onNodesChange(result.current.nodes.filter(n => n.type === 'class').map(n => ({
    id: n.id, type: 'dimensions', dimensions: { width: 240, height: 77 + n.data.attributes.length * 18 },
  }))))
  await waitFor(() => expect(result.current.isDirty).toBe(false))
  expect(result.current.canUndo).toBe(false)
  const nodes = new Map(result.current.nodes.map(n => [n.id, n]))
  const allocations = getAssociationEndpointAllocations(result.current.flowEdges, id => nodes.get(id))
  for (const edge of result.current.flowEdges) {
    if (edge.type === 'association' || edge.type === 'composition') {
      const layout = getAssociationLayout(nodes.get(edge.source), nodes.get(edge.target), edge.data, allocations.get(edge.id))
      expect(layout.edgePath).not.toMatch(/NaN|undefined|Infinity/)
    } else if (edge.type === 'reflexiveAssociation') {
      expect(getReflexiveAssociationLayout(nodes.get(edge.source), edge.data).edgePath).not.toMatch(/NaN|undefined|Infinity/)
    }
  }
  await act(async () => result.current.onSaveModel())
  expect(write).toHaveBeenCalledOnce()
  expect(close).toHaveBeenCalledOnce()
  const saved = parseModelFile(write.mock.calls[0][0])
  expect(saved.edges).toEqual(original.edges)
  expect(saved.annotations).toEqual(original.annotations)
  expect(saved.nodes.map(n => ({ id: n.id, data: n.data, position: n.position })))
    .toEqual(original.nodes.map(n => ({ id: n.id, data: n.data, position: n.position })))
  expect(saved.nodes.every(n => !n.measured && !n.internals && n.type !== 'associationHelper')).toBe(true)
})

it('keeps the last fixture deliberately beyond the comfortable baseline', () => {
  expect(manifest).toHaveLength(5)
  manifest.slice(1).forEach((entry, i) => {
    expect(entry.classes).toBeGreaterThan(manifest[i].classes)
    expect(entry.edges).toBeGreaterThan(manifest[i].edges)
  })
  const last = manifest.at(-1)
  const model = parseModelFile(readExample(last.file))
  expect(last.classes).toBeGreaterThanOrEqual(80)
  expect(last.edges).toBeGreaterThanOrEqual(300)
  expect(Math.max(...model.edges.map(e => e.data.parallelCount ?? 0))).toBeGreaterThanOrEqual(10)
  expect(model.edges.filter(e => e.source === 'Person' && e.type === 'reflexiveAssociation')).toHaveLength(8)
  expect(new Set(model.edges.map(e => e.type))).toEqual(new Set(['association','composition','reflexiveAssociation','associativeAssociation']))
  const items = model.annotations.conceptual.items
  expect(new Set(items.filter(a => a.kind === 'shape').map(a => a.shape))).toEqual(new Set(['arrow','line','rectangle','ellipse']))
  expect(items.some(a => a.kind === 'stroke' && a.tool === 'marker')).toBe(true)
  expect(items.some(a => a.kind === 'stroke' && a.tool === 'pen')).toBe(true)
  expect(items.some(a => a.kind === 'text' && a.border)).toBe(true)
  expect(model.nodes.some(n => n.position.x < 0 && n.position.y < 0)).toBe(true)
})
