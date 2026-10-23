import { useLayoutEffect, useState } from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { ReactFlow } from '@xyflow/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useModelState } from '../useModelState.js'
import { nodeTypes, edgeTypes } from '../../flowTypes.js'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('updates every rendered border slot when distance or a different neighbour changes', async () => {
  // Real React Flow store and components; synthetic DOM sizes, not visual QA.
  const size = element => element.classList.contains('association-helper-node') ? 1
    : element.classList.contains('react-flow__handle') ? 16 : 180
  for (const property of ['offsetWidth', 'offsetHeight']) {
    vi.spyOn(HTMLElement.prototype, property, 'get').mockImplementation(function () { return size(this) })
  }
  vi.stubGlobal('DOMMatrixReadOnly', class { m22 = 1 })
  const observed = new WeakSet()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; this.elements = new Set() }
    observe(element) {
      if (observed.has(element)) return
      observed.add(element)
      this.elements.add(element)
      queueMicrotask(() => { if (this.elements.has(element)) this.callback([{ target: element }]) })
    }
    unobserve(element) { this.elements.delete(element) }
    disconnect() { this.elements.clear() }
  })
  let model
  function Diagram() {
    const [instance, setInstance] = useState(null)
    const state = useModelState({ activeView: 'conceptual', reactFlowInstance: instance })
    useLayoutEffect(() => { model = state })
    return <ReactFlow nodes={state.flowNodes} edges={state.flowEdges} nodeTypes={nodeTypes}
      edgeTypes={edgeTypes} onNodesChange={state.onNodesChange} onInit={setInstance} />
  }
  const { container } = render(<Diagram />)
  const nodes = [{ id: 'hub', type: 'class', position: { x: 900, y: 0 }, data: { label: 'Hub' } },
    ...['a','b','c'].map((id, i) => ({ id, type: 'class', position: { x: 0, y: (i - 1) * 300 }, data: { label: id } }))]
  const edges = ['a','b','c'].map(id => ({ id: `edge-${id}`, source: id, target: 'hub',
    sourceHandle: 'right-source', targetHandle: 'left-target', type: 'association', data: { lineStyle: 'orthogonal' } }))
  act(() => model.setModel(nodes, edges))
  const endpoint = id => container.querySelector(`path#edge-${id}`)?.getAttribute('d')
    .match(/-?\d+(?:\.\d+)?/g).map(Number).slice(-2)
  await waitFor(() => {
    expect(endpoint('a')).toEqual([900,48])
    expect(endpoint('b')).toEqual([900,90])
    expect(endpoint('c')).toEqual([900,132])
  })
  act(() => model.onNodesChange([{ id:'hub', type:'position', position:{x:1700,y:0} }]))
  await waitFor(() => {
    expect(endpoint('a')).toEqual([1700,48])
    expect(endpoint('b')).toEqual([1700,90])
    expect(endpoint('c')).toEqual([1700,132])
  })
  act(() => model.onNodesChange([{ id:'a', type:'position', position:{x:0,y:600} }]))
  await waitFor(() => {
    expect(endpoint('b')).toEqual([1700,48])
    expect(endpoint('c')).toEqual([1700,90])
    expect(endpoint('a')).toEqual([1700,132])
  })
})
