import { act, renderHook } from '@testing-library/react'
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

function renderAnnotations(pushHistorySnapshot = vi.fn()) {
  return renderHook(({ activeView }) =>
    useAnnotations({
      activeView,
      reactFlowInstance,
      pushHistorySnapshot,
    }),
    { initialProps: { activeView: 'conceptual' } },
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
