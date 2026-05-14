import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnnotations } from '../useAnnotations.js'

const reactFlowInstance = {
  screenToFlowPosition: ({ x, y }) => ({ x, y }),
}

const pointerEvent = (x, y) => ({
  clientX: x,
  clientY: y,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
})

function renderAnnotations(pushHistorySnapshot = vi.fn(), options = {}) {
  return renderHook(({ activeView = 'conceptual', enabled = true, instance = reactFlowInstance }) =>
    useAnnotations({
      activeView,
      reactFlowInstance: instance,
      pushHistorySnapshot,
      enabled,
    }),
    {
      initialProps: {
        activeView: 'conceptual',
        enabled: options.enabled ?? true,
        instance: options.reactFlowInstance ?? reactFlowInstance,
      },
    },
  )
}

describe('useAnnotations text interactions', () => {
  beforeEach(() => {
    let nextId = 1
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => `annotation-${nextId++}`),
    })
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps newly created text selected and applies toolbox changes to it', () => {
    const pushHistorySnapshot = vi.fn()
    const { result } = renderAnnotations(pushHistorySnapshot)

    act(() => result.current.setTool('text'))
    act(() => result.current.onPointerDown(pointerEvent(10, 20)))
    act(() => result.current.onCommitText('Hello'))

    expect(result.current.selectedTextId).toBe('annotation-1')
    expect(result.current.annotations.conceptual.items[0]).toMatchObject({
      id: 'annotation-1',
      text: 'Hello',
      color: '#1e293b',
      fontSize: 14,
    })

    act(() => result.current.updateTextSettings({ color: '#ef4444', fontSize: 20 }))

    expect(result.current.annotations.conceptual.items[0]).toMatchObject({
      color: '#ef4444',
      fontSize: 20,
    })
    expect(result.current.textSettings).toEqual({ color: '#ef4444', fontSize: 20 })
    expect(pushHistorySnapshot).toHaveBeenCalledTimes(2)
  })

  it('uses toolbox text settings as defaults when no text is selected', () => {
    const { result } = renderAnnotations()

    act(() => result.current.setTool('text'))
    act(() => result.current.updateTextSettings({ color: '#f97316', fontSize: 18 }))
    act(() => result.current.onPointerDown(pointerEvent(30, 40)))
    act(() => result.current.onCommitText('Default styled'))

    expect(result.current.annotations.conceptual.items[0]).toMatchObject({
      color: '#f97316',
      fontSize: 18,
    })
  })

  it('clears transient text selection when switching views', () => {
    const { result, rerender } = renderAnnotations()

    act(() => result.current.setTool('text'))
    act(() => result.current.onPointerDown(pointerEvent(10, 20)))
    act(() => result.current.onCommitText('Conceptual text'))

    expect(result.current.selectedTextId).toBe('annotation-1')

    rerender({ activeView: 'logical' })

    expect(result.current.selectedTextId).toBeNull()

    act(() => result.current.updateTextSettings({ color: '#f97316', fontSize: 18 }))
    act(() => result.current.onPointerDown(pointerEvent(30, 40)))

    expect(result.current.pendingText).toMatchObject({
      x: 30,
      y: 40,
      color: '#f97316',
      fontSize: 18,
    })
  })

  it('normalizes loaded annotations so malformed items cannot break text or stroke handling', () => {
    const { result } = renderAnnotations()

    act(() => {
      result.current.onLoadAnnotations({
        conceptual: {
          items: [
            {
              id: 'bad-text',
              kind: 'text',
              x: 10,
              y: 20,
              text: null,
              color: null,
              fontSize: 'large',
            },
            {
              id: 'bad-stroke',
              kind: 'stroke',
              points: [{ x: 1, y: 2 }, { x: 'bad', y: 4 }, { x: 5, y: 6 }],
              color: null,
              thickness: 0,
              opacity: null,
            },
            {
              id: 'empty-stroke',
              kind: 'stroke',
              points: [{ x: Number.NaN, y: 1 }],
            },
            {
              id: 'bad-position',
              kind: 'text',
              x: 'bad',
              y: 20,
              text: 'No position',
            },
          ],
        },
      })
    })

    expect(result.current.annotations.conceptual.items).toEqual([
      {
        id: 'bad-text',
        kind: 'text',
        x: 10,
        y: 20,
        text: '',
        color: '#1e293b',
        fontSize: 14,
      },
      {
        id: 'bad-stroke',
        kind: 'stroke',
        tool: 'pen',
        points: [{ x: 1, y: 2 }, { x: 5, y: 6 }],
        color: '#ef4444',
        thickness: 2,
        opacity: 1,
      },
    ])
  })

  it('moves selected text in flow coordinates with one history snapshot', () => {
    const pushHistorySnapshot = vi.fn()
    const { result } = renderAnnotations(pushHistorySnapshot)

    act(() => result.current.setTool('text'))
    act(() => result.current.onPointerDown(pointerEvent(10, 20)))
    act(() => result.current.onCommitText('Move me'))
    pushHistorySnapshot.mockClear()

    act(() => result.current.onTextPointerDown('annotation-1', pointerEvent(10, 20)))
    act(() => result.current.onPointerMove(pointerEvent(25, 35)))
    act(() => result.current.onPointerUp())

    expect(result.current.annotations.conceptual.items[0]).toMatchObject({
      x: 25,
      y: 35,
    })
    expect(pushHistorySnapshot).toHaveBeenCalledTimes(1)
  })

  it('supports Enter editing, blank edit deletion, and Escape deselection', () => {
    const pushHistorySnapshot = vi.fn()
    const { result } = renderAnnotations(pushHistorySnapshot)

    act(() => result.current.setTool('text'))
    act(() => result.current.onPointerDown(pointerEvent(10, 20)))
    act(() => result.current.onCommitText('Editable'))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(result.current.editingTextId).toBe('annotation-1')

    act(() => result.current.onCommitTextEdit('annotation-1', ''))
    expect(result.current.annotations.conceptual.items).toHaveLength(0)
    expect(result.current.selectedTextId).toBeNull()

    act(() => result.current.onPointerDown(pointerEvent(40, 50)))
    act(() => result.current.onCommitText('Selected'))
    expect(result.current.selectedTextId).toBe('annotation-2')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(result.current.selectedTextId).toBeNull()
  })

  it('uses annotation hotkeys only when annotations are enabled and focus is not editable', () => {
    const { result, rerender } = renderAnnotations()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))
    })
    expect(result.current.activeTool).toBe('pen')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'M', bubbles: true }))
    })
    expect(result.current.activeTool).toBe('marker')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }))
    })
    expect(result.current.activeTool).toBe('text')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }))
    })
    expect(result.current.activeTool).toBe('eraser')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }))
    })
    expect(result.current.activeTool).toBe('pointer')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true }))
    })
    expect(result.current.activeTool).toBe('pointer')

    const input = document.createElement('input')
    document.body.appendChild(input)
    try {
      act(() => {
        fireEvent.keyDown(input, { key: 'p' })
      })
    } finally {
      input.remove()
    }
    expect(result.current.activeTool).toBe('pointer')

    rerender({ enabled: false })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))
    })
    expect(result.current.activeTool).toBe('pointer')
  })

  it('uses Escape to clear transient text state before returning to pointer mode', () => {
    const { result } = renderAnnotations()

    act(() => result.current.setTool('text'))
    act(() => result.current.onPointerDown(pointerEvent(10, 20)))
    act(() => result.current.onCommitText('Selected'))

    expect(result.current.activeTool).toBe('text')
    expect(result.current.selectedTextId).toBe('annotation-1')

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(result.current.activeTool).toBe('text')
    expect(result.current.selectedTextId).toBeNull()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(result.current.activeTool).toBe('pointer')
  })

  it('returns non-text annotation tools to pointer mode with Escape', () => {
    const { result } = renderAnnotations()

    act(() => result.current.setTool('marker'))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(result.current.activeTool).toBe('pointer')
  })

  it('temporarily pans the viewport while Space is held with an annotation tool', () => {
    const setViewport = vi.fn()
    const getViewport = vi.fn(() => ({ x: 10, y: 20, zoom: 2 }))
    const instance = {
      screenToFlowPosition: ({ x, y }) => ({ x, y }),
      getViewport,
      setViewport,
    }
    const { result } = renderAnnotations(vi.fn(), { reactFlowInstance: instance })

    act(() => result.current.setTool('pen'))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })

    expect(result.current.isTemporaryPanMode).toBe(true)

    act(() => result.current.onPointerDown(pointerEvent(100, 100)))
    act(() => result.current.onPointerMove(pointerEvent(130, 115)))

    expect(result.current.currentStroke).toBeNull()
    expect(setViewport).toHaveBeenCalledWith(
      { x: 40, y: 35, zoom: 2 },
      { duration: 0 },
    )

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
    })

    expect(result.current.isTemporaryPanMode).toBe(false)
  })

  it('starts temporary pan drag immediately after Space keydown', () => {
    const setViewport = vi.fn()
    const instance = {
      screenToFlowPosition: ({ x, y }) => ({ x, y }),
      getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      setViewport,
    }
    const { result } = renderAnnotations(vi.fn(), { reactFlowInstance: instance })

    act(() => result.current.setTool('marker'))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      result.current.onPointerDown(pointerEvent(20, 20))
      result.current.onPointerMove(pointerEvent(35, 45))
    })

    expect(result.current.currentStroke).toBeNull()
    expect(setViewport).toHaveBeenCalledWith(
      { x: 15, y: 25, zoom: 1 },
      { duration: 0 },
    )
  })

  it('does not enter temporary pan mode for pointer tool and exposes pan mode as off when annotations are disabled', () => {
    const { result, rerender } = renderAnnotations()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })
    expect(result.current.isTemporaryPanMode).toBe(false)

    act(() => result.current.setTool('eraser'))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })
    expect(result.current.isTemporaryPanMode).toBe(true)

    rerender({ enabled: false })
    expect(result.current.isTemporaryPanMode).toBe(false)
  })

  it('recognizes Space key variants for temporary pan mode', () => {
    const { result } = renderAnnotations()

    act(() => result.current.setTool('marker'))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space', bubbles: true }))
    })

    expect(result.current.isTemporaryPanMode).toBe(true)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
    })

    expect(result.current.isTemporaryPanMode).toBe(false)
  })

  it('deletes selected text with Delete', () => {
    const pushHistorySnapshot = vi.fn()
    const { result } = renderAnnotations(pushHistorySnapshot)

    act(() => result.current.setTool('text'))
    act(() => result.current.onPointerDown(pointerEvent(10, 20)))
    act(() => result.current.onCommitText('Delete me'))
    pushHistorySnapshot.mockClear()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    })

    expect(result.current.annotations.conceptual.items).toHaveLength(0)
    expect(result.current.selectedTextId).toBeNull()
    expect(pushHistorySnapshot).toHaveBeenCalledTimes(1)
  })
})
