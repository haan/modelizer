import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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

describe('useModelState model name history', () => {
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

    act(() => {
      result.current.setModelName('R')
      result.current.setModelName('Re')
      result.current.setModelName('Renamed model')
      window.dispatchEvent(new CustomEvent('model-text-edit-end'))
    })
    await flushHistoryPush()

    expect(result.current.modelName).toBe('Renamed model')

    act(() => {
      result.current.onUndo()
    })

    expect(result.current.modelName).toBe('Untitled model')
  })
})
