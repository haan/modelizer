import { act, renderHook } from '@testing-library/react'
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
