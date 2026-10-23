import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useModelState } from '../useModelState.js'

const renderModelState = () =>
  renderHook(() =>
    useModelState({
      reactFlowInstance: null,
      reactFlowWrapper: { current: null },
      showAccentColors: true,
      showConceptualOperationsCompartment: false,
      showCompositionAggregation: false,
      nullDisplayMode: 'not-null',
    }),
  )

const flushHistoryPush = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe.each(['conceptual', 'logical', 'physical'])('exclusive focus in %s view', (activeView) => {
  const setup = () => {
    const reactFlowInstance = { getInternalNode: vi.fn(), setCenter: vi.fn() }
    const hook = renderHook(() => useModelState({ activeView, reactFlowInstance }))
    const nodes = ['class', 'note', 'area'].map((type) => ({
      id: type, type, position: { x: 100, y: 200 }, selected: true, data: {},
    }))
    const type = activeView === 'conceptual' ? 'association' : 'relationship'
    const edges = ['first', 'second'].map((id) => ({
      id, type, source: 'class', target: 'class', selected: true, data: {},
    }))
    act(() => hook.result.current.setModel(nodes, edges))
    return { ...hook, reactFlowInstance }
  }

  it.each([
    ['class', 'onHighlightClass'],
    ['note', 'onHighlightNote'],
    ['area', 'onHighlightArea'],
  ])('focusing a %s clears every other diagram selection', async (id, handler) => {
    const { result, reactFlowInstance } = setup()
    act(() => result.current[handler](id))
    await flushHistoryPush()
    expect(result.current.nodes.filter((node) => node.selected).map((node) => node.id)).toEqual([id])
    expect(result.current.edges.every((edge) => !edge.selected)).toBe(true)
    expect(reactFlowInstance.setCenter).toHaveBeenCalledOnce()
    expect(result.current.canUndo).toBe(false)
  })

  it('focusing an edge clears all nodes and other edges', async () => {
    const { result } = setup()
    act(() => result.current.onHighlightAssociation('first'))
    await flushHistoryPush()
    expect(result.current.nodes.every((node) => !node.selected)).toBe(true)
    expect(result.current.edges.filter((edge) => edge.selected).map((edge) => edge.id)).toEqual(['first'])
    expect(result.current.canUndo).toBe(false)
  })
})

describe('useModelState model name history', () => {
  it('does not add an undo step or discard redo merely by entering and leaving a name field', async () => {
    const { result } = renderModelState()
    act(() => result.current.setModelName('Saved title'))
    await flushHistoryPush()
    act(() => result.current.onUndo())
    act(() => window.dispatchEvent(new CustomEvent('model-text-edit-start')))
    await flushHistoryPush()
    act(() => window.dispatchEvent(new CustomEvent('model-text-edit-end')))
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('undoes class creation once even when automatic name editing starts in a later frame', async () => {
    const { result } = renderModelState()
    let id
    act(() => { id = result.current.onAddClass() })
    await flushHistoryPush()
    act(() => window.dispatchEvent(new CustomEvent('model-text-edit-start')))
    await flushHistoryPush()
    act(() => {
      result.current.onNodesChange([{ id, type: 'dimensions', dimensions: { width: 180, height: 77 } }])
      result.current.onRenameClass(id, 'Class1') // Escape restores the unchanged default name.
      window.dispatchEvent(new CustomEvent('model-text-edit-end'))
    })
    act(() => result.current.onUndo())
    expect(result.current.nodes).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    act(() => result.current.onRedo())
    expect(result.current.nodes.map(node => node.id)).toEqual([id])
  })

  it('undoes and redoes model renames', async () => {
    const { result } = renderModelState()

    act(() => {
      result.current.setModelName('Renamed model')
    })
    await flushHistoryPush()

    expect(result.current.modelName).toBe('Renamed model')
    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.onUndo()
    })

    expect(result.current.modelName).toBe('Untitled model')
    expect(result.current.canRedo).toBe(true)

    act(() => {
      result.current.onRedo()
    })

    expect(result.current.modelName).toBe('Renamed model')
  })

  it('groups model rename keystrokes during text editing into one undo step', async () => {
    const { result } = renderModelState()

    act(() => {
      window.dispatchEvent(new CustomEvent('model-text-edit-start'))
    })

    await flushHistoryPush()
    expect(result.current.canUndo).toBe(false)
    for (const name of ['R', 'Re', 'Renamed model']) {
      act(() => result.current.setModelName(name))
      await flushHistoryPush()
    }
    act(() => window.dispatchEvent(new CustomEvent('model-text-edit-end')))

    expect(result.current.modelName).toBe('Renamed model')

    act(() => {
      result.current.onUndo()
    })

    expect(result.current.modelName).toBe('Untitled model')
    expect(result.current.canUndo).toBe(false)
    act(() => result.current.onRedo())
    expect(result.current.modelName).toBe('Renamed model')
  })
})

describe('useModelState class logical names', () => {
  it('initializes logical names and groups their edits into one undo step', async () => {
    const { result } = renderModelState()
    let classId

    act(() => {
      classId = result.current.onAddClass()
    })
    await flushHistoryPush()

    expect(result.current.nodes[0].data.logicalName).toBe('')

    act(() => {
      window.dispatchEvent(new CustomEvent('model-text-edit-start'))
      result.current.onUpdateClassLogicalName(classId, 'customer')
      result.current.onUpdateClassLogicalName(classId, 'customer_table')
      window.dispatchEvent(new CustomEvent('model-text-edit-end'))
    })
    await flushHistoryPush()

    expect(result.current.nodes[0].data.logicalName).toBe('customer_table')

    act(() => {
      result.current.onUndo()
    })

    expect(result.current.nodes[0].data.logicalName).toBe('')
  })
})


describe('React Flow 12 measurements and resize history', () => {
  const area = { id: 'area', type: 'area', position: { x: 0, y: 0 }, width: 280, height: 180,
    style: { width: 280, height: 180 }, data: { viewSizes: {
      conceptual: { width: 280, height: 180 }, logical: { width: 300, height: 200 }, physical: { width: 320, height: 220 },
    }, viewPositionsMeta: { conceptual: true, logical: true, physical: true } } }

  it('keeps automatic measurements out of area sizes and undo history', async () => {
    const { result } = renderModelState()
    act(() => result.current.setModel([area], []))
    const data = result.current.nodes[0].data
    act(() => result.current.onNodesChange([{ id: 'area', type: 'dimensions', dimensions: { width: 281, height: 181 } }]))
    await flushHistoryPush()
    expect(result.current.nodes[0].measured).toEqual({ width: 281, height: 181 })
    expect(result.current.nodes[0].data).toBe(data)
    expect(result.current.nodes[0].width).toBe(280)
    expect(result.current.canUndo).toBe(false)
  })

  it.each(['conceptual', 'logical', 'physical'])('records one undo step for an area resize in %s', async (activeView) => {
    const { result } = renderHook(() => useModelState({ activeView }))
    act(() => result.current.setModel([area], []))
    const original = result.current.nodes[0]
    for (const width of [400, 420, 450]) {
      act(() => result.current.onNodesChange([{ id: 'area', type: 'dimensions', dimensions: { width, height: 300 }, resizing: true, setAttributes: true }]))
      await flushHistoryPush()
    }
    act(() => result.current.onNodesChange([{ id: 'area', type: 'dimensions', resizing: false }]))
    expect(result.current.nodes[0].data.viewSizes[activeView]).toEqual({ width: 450, height: 300 })
    for (const view of ['conceptual', 'logical', 'physical'].filter(view => view !== activeView)) {
      expect(result.current.nodes[0].data.viewSizes[view]).toEqual(original.data.viewSizes[view])
    }
    act(() => result.current.onUndo())
    expect(result.current.nodes[0].data.viewSizes).toEqual(original.data.viewSizes)
    expect(result.current.canUndo).toBe(false)
    act(() => result.current.onRedo())
    expect(result.current.nodes[0].width).toBe(450)
    expect(result.current.nodes[0].style.width).toBe(450)
  })
})
