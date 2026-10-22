import { useLayoutEffect, useState } from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { ReactFlow } from '@xyflow/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useModelState } from '../useModelState.js'
import { nodeTypes, edgeTypes } from '../../flowTypes.js'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it.each(['association', 'reflexiveAssociation'])('keeps the associative link to a %s rendered after measurements and updates', async (type) => {
  // Supply layout measurements only; use the real controlled React Flow renderer.
  const size = (element, dimension) => element.classList.contains('association-helper-node') ? 1
    : element.classList.contains('react-flow__handle') ? 16 : dimension === 'width' ? 240 : 160
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () { return size(this, 'width') })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () { return size(this, 'height') })
  vi.stubGlobal('DOMMatrixReadOnly', class { m22 = 1 })
  const measuredElements = new WeakSet()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; this.elements = new Set() }
    observe(element) {
      if (measuredElements.has(element)) return
      measuredElements.add(element)
      this.elements.add(element)
      queueMicrotask(() => {
        if (this.elements.has(element)) this.callback([{ target: element }])
      })
    }
    unobserve(element) { this.elements.delete(element) }
    disconnect() { this.elements.clear() }
  })
  let model
  function Diagram({ activeView = 'conceptual' }) {
    const [instance, setInstance] = useState(null)
    const state = useModelState({ activeView, reactFlowInstance: instance })
    useLayoutEffect(() => { model = state })
    return <ReactFlow nodes={state.flowNodes} edges={state.flowEdges} nodeTypes={nodeTypes}
      edgeTypes={edgeTypes} onNodesChange={state.onNodesChange} onInit={setInstance} />
  }
  const { container, rerender } = render(<Diagram />)
  act(() => model.setModel([
    { id: 'a', type: 'class', position: { x: 100, y: 100 }, data: { name: 'A' } },
    { id: 'b', type: 'class', position: { x: 600, y: 100 }, data: { name: 'B' } },
    { id: 'link-class', type: 'class', position: { x: 350, y: 350 }, data: { name: 'Link' } },
  ], [
    { id: 'base', type, source: 'a', sourceHandle: 'right-source', target: type === 'association' ? 'b' : 'a', targetHandle: 'left-target', data: { lineStyle: 'orthogonal' } },
    { id: 'link', type: 'associativeAssociation', source: 'link-class', sourceHandle: 'top-source', target: 'assoc-edge-base', targetHandle: 'association-target', data: { type: 'associative' } },
  ]))
  const expectLink = async () => waitFor(() => {
    const path = container.querySelector('path#link')
    expect(path).not.toBeNull()
    expect(path.getAttribute('d')).not.toMatch(/NaN|undefined/)
  })
  await expectLink()
  expect(model.canUndo).toBe(false)
  act(() => model.onNodesChange([{ id: 'a', type: 'position', position: { x: 150, y: 150 } }]))
  await expectLink()
  rerender(<Diagram activeView="logical" />)
  await waitFor(() => expect(container.querySelector('path#link')).toBeNull())
  rerender(<Diagram />)
  await expectLink()
  expect(model.nodes.some(node => node.type === 'associationHelper')).toBe(false)
})
