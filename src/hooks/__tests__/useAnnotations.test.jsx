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
  return renderHook(() =>
    useAnnotations({
      activeView: 'conceptual',
      reactFlowInstance,
      pushHistorySnapshot,
    }),
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
