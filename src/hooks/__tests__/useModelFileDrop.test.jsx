import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useModelFileDrop } from '../useModelFileDrop.js'

const transfer = (files = [{ name: 'model.mdlz' }]) => ({ types: ['Files'], files, items: [] })
function dispatch(type, dataTransfer = transfer(), target = window) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })
  act(() => { target.dispatchEvent(event) })
  return event
}
const setup = (disabled = false) => {
  const props = { onOpenModelFile: vi.fn(), onFileError: vi.fn(), disabled }
  return { props, ...renderHook((args) => useModelFileDrop(args), { initialProps: props }) }
}
afterEach(() => { cleanup(); document.body.innerHTML = '' })

describe('window model drops', () => {
  it('accepts uppercase extensions, prevents navigation, and opens exactly once', () => {
    const { props, result } = setup()
    dispatch('dragenter')
    expect(result.current).toBe(true)
    expect(dispatch('dragover').defaultPrevented).toBe(true)
    const file = { name: 'MODEL.MDLZ', type: '' }
    const child = document.body.appendChild(document.createElement('div'))
    expect(dispatch('drop', transfer([file]), child).defaultPrevented).toBe(true)
    expect(props.onOpenModelFile).toHaveBeenCalledExactlyOnceWith(file)
    expect(result.current).toBe(false)
  })

  it.each([
    [], [{ name: 'a.mdlz' }, { name: 'b.mdlz' }], [{ name: 'other.json' }],
  ])('rejects invalid file selections and prevents navigation', (...files) => {
    const { props } = setup()
    expect(dispatch('drop', transfer(files)).defaultPrevented).toBe(true)
    expect(props.onOpenModelFile).not.toHaveBeenCalled()
    expect(props.onFileError).toHaveBeenCalledOnce()
  })

  it('rejects folders even if their name ends in .mdlz', () => {
    const { props } = setup()
    dispatch('drop', { ...transfer(), items: [{ webkitGetAsEntry: () => ({ isDirectory: true }) }] })
    expect(props.onFileError).toHaveBeenCalledOnce()
    expect(props.onOpenModelFile).not.toHaveBeenCalled()
  })

  it('keeps the overlay across nested enters/leaves and resets on exit and blur', () => {
    const { result, rerender, props } = setup()
    dispatch('dragenter'); dispatch('dragenter')
    rerender({ ...props, onOpenModelFile: vi.fn() })
    dispatch('dragleave')
    expect(result.current).toBe(true)
    dispatch('dragleave')
    expect(result.current).toBe(false)
    dispatch('dragenter'); dispatch('blur')
    expect(result.current).toBe(false)
  })

  it('blocks drops during operations and open portal dialogs', () => {
    const { props, result, rerender } = setup(true)
    dispatch('dragenter'); dispatch('drop')
    expect(result.current).toBe(false)
    expect(props.onOpenModelFile).not.toHaveBeenCalled()
    rerender({ ...props, disabled: false })
    document.body.innerHTML = '<div role="dialog" data-state="open"></div>'
    expect(dispatch('drop').defaultPrevented).toBe(true)
    dispatch('dragenter')
    expect(result.current).toBe(false)
    expect(props.onOpenModelFile).not.toHaveBeenCalled()
    expect(props.onFileError).not.toHaveBeenCalled()
  })

  it('leaves internal and text/link drags untouched and removes listeners on unmount', () => {
    const { props, result, unmount } = setup()
    for (const type of ['dragenter', 'dragover', 'dragleave', 'drop']) {
      expect(dispatch(type, { types: ['text/plain'], files: [] }).defaultPrevented).toBe(false)
    }
    expect(result.current).toBe(false)
    expect(props.onOpenModelFile).not.toHaveBeenCalled()
    unmount()
    expect(dispatch('drop').defaultPrevented).toBe(false)
  })
})
