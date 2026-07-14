import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFileActions } from '../useFileActions.js'

const baseProps = {
  nodes: [],
  edges: [],
  modelName: 'Untitled model',
  setNodes: vi.fn(),
  setEdges: vi.fn(),
  setModelName: vi.fn(),
  setActiveSidebarItem: vi.fn(),
}

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useFileActions dirty tracking', () => {
  it('tracks model-name-only changes as dirty', async () => {
    const { result, rerender } = renderHook(
      (props) => useFileActions(props),
      { initialProps: baseProps },
    )

    expect(result.current.isDirty).toBe(false)

    rerender({ ...baseProps, modelName: 'Renamed model' })
    await flushEffects()

    expect(result.current.isDirty).toBe(true)

    rerender({ ...baseProps, modelName: 'Untitled model' })
    await flushEffects()

    expect(result.current.isDirty).toBe(false)
  })
})

describe('useFileActions model compatibility', () => {
  it('normalizes a missing class logical name when opening an existing file', async () => {
    const setModel = vi.fn()
    const payload = {
      version: 1,
      modelName: 'Existing model',
      nodes: [
        {
          id: 'class-1',
          type: 'class',
          position: { x: 10, y: 20 },
          data: { label: 'Customer', attributes: [] },
        },
      ],
      edges: [],
    }
    const showOpenFilePicker = vi.fn().mockResolvedValue([
      {
        getFile: vi.fn().mockResolvedValue({
          text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
        }),
      },
    ])
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: showOpenFilePicker,
    })

    try {
      const { result } = renderHook(() =>
        useFileActions({ ...baseProps, setModel }),
      )

      act(() => {
        result.current.onOpenModel()
      })

      await waitFor(() => expect(setModel).toHaveBeenCalled())
      const [loadedNodes] = setModel.mock.calls[0]
      expect(loadedNodes[0].data.label).toBe('Customer')
      expect(loadedNodes[0].data.logicalName).toBe('')
    } finally {
      delete window.showOpenFilePicker
    }
  })
})
