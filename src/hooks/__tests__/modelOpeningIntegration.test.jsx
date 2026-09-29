import { useState } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFileActions } from '../useFileActions.js'
import { useModelState } from '../useModelState.js'
import { useAnnotations } from '../useAnnotations.js'

const payload = {
  version: 1,
  modelName: 'Loaded model',
  nodes: [{ id: 'a', type: 'class', position: { x: 10, y: 20 }, data: {
    label: 'Customer', attributes: ['legacy'],
    viewPositions: { conceptual: { x: 10, y: 20 }, logical: { x: 90, y: 100 } },
  } }],
  edges: [],
  annotations: { conceptual: { items: [{ id: 'text', kind: 'text', x: 1, y: 2, text: 'Note' }] } },
}
const fileFor = (value = payload) => ({ name: 'model.mdlz', text: vi.fn().mockResolvedValue(JSON.stringify(value)) })
const deferred = () => {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}
function setup() {
  const onFileError = vi.fn()
  const onHiddenContent = vi.fn()
  const onModelLoaded = vi.fn()
  const hook = renderHook(() => {
    const [activeView, setActiveView] = useState('logical')
    const annotationState = useAnnotations({ activeView })
    const model = useModelState({ activeView })
    const actions = useFileActions({
      ...model,
      annotations: annotationState.annotations,
      annotationsDirtySignal: annotationState.dirtySignal,
      onLoadAnnotations: annotationState.onLoadAnnotations,
      onFileError, onHiddenContent, showAnnotations: false,
      onModelLoaded: (value) => { setActiveView('conceptual'); onModelLoaded(value) },
    })
    return { ...model, ...actions, activeView, annotations: annotationState.annotations }
  })
  return { ...hook, onFileError, onHiddenContent, onModelLoaded }
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete window.showOpenFilePicker
  delete window.showSaveFilePicker
})

describe('shared model opening', () => {
  it.each(['menu', 'drop'])('loads through %s with clean state, normalized annotations and reset history', async (source) => {
    const { result, onHiddenContent, onModelLoaded } = setup()
    await act(async () => { result.current.setModelName('Unsaved') })
    expect(result.current.canUndo).toBe(true)
    const file = fileFor()
    window.showOpenFilePicker = vi.fn().mockResolvedValue([{ getFile: async () => file }])
    await act(async () => {
      await (source === 'menu' ? result.current.onOpenModel() : result.current.onOpenModelFile(file))
    })
    expect(result.current.modelName).toBe('Unsaved')
    expect(result.current.isConfirmDialogOpen).toBe(true)
    expect(result.current.isOpening).toBe(true)
    act(() => { result.current.onConfirmDiscardChanges(); result.current.onConfirmDialogOpenChange(false) })
    expect(result.current.modelName).toBe('Loaded model')
    expect(result.current.activeView).toBe('conceptual')
    expect(result.current.nodes[0].position).toEqual({ x: 10, y: 20 })
    expect(result.current.nodes[0].data.attributes[0].name).toBe('legacy')
    expect(result.current.nodes[0].data.logicalName).toBe('')
    expect(result.current.annotations.conceptual.items[0].fontSize).toBeGreaterThan(0)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.isOpening).toBe(false)
    expect(result.current.activeSidebarItem).toBe('tables')
    expect(onModelLoaded).toHaveBeenCalledOnce()
    expect(onHiddenContent).toHaveBeenCalledWith(expect.objectContaining({ hiddenAnnotations: true }))
    await act(async () => { result.current.setModelName('Edit') })
    act(() => { result.current.onUndo() })
    expect(result.current.isDirty).toBe(false)
  })

  it('validates before confirmation and preserves the current model on failures and cancellation', async () => {
    const { result, onFileError, onModelLoaded } = setup()
    act(() => { result.current.setModelName('Unsaved') })
    const beforeNodes = result.current.nodes
    for (const file of [fileFor({}), { text: async () => '' }, { text: async () => '{' },
      { text: async () => { throw new DOMException('Read failed', 'AbortError') } }]) {
      await act(async () => { await result.current.onOpenModelFile(file) })
      expect(result.current.isConfirmDialogOpen).toBe(false)
      expect(result.current.isOpening).toBe(false)
      expect(result.current.nodes).toBe(beforeNodes)
      expect(result.current.isDirty).toBe(true)
      expect(result.current.canUndo).toBe(true)
    }
    expect(onFileError).toHaveBeenCalledTimes(4)
    await act(async () => { await result.current.onOpenModelFile(fileFor()) })
    act(() => { result.current.onCancelDiscardChanges(); result.current.onConfirmDialogOpenChange(false) })
    expect(result.current.modelName).toBe('Unsaved')
    expect(result.current.isDirty).toBe(true)
    expect(onModelLoaded).not.toHaveBeenCalled()
  })

  it('uses the latest dirty state and ignores repeated opens or actions during confirmation', async () => {
    const { result } = setup()
    const read = deferred()
    let pending
    act(() => { pending = result.current.onOpenModelFile({ text: () => read.promise }) })
    const ignored = fileFor({ ...payload, modelName: 'Ignored' })
    await act(async () => { await result.current.onOpenModelFile(ignored) })
    expect(ignored.text).not.toHaveBeenCalled()
    act(() => { result.current.setModelName('Edited while reading') })
    await act(async () => { read.resolve(JSON.stringify(payload)); await pending })
    expect(result.current.isConfirmDialogOpen).toBe(true)
    act(() => { result.current.onRequestNewModel(); result.current.onImportJavaModelizer() })
    await act(async () => { await result.current.onOpenModelFile(ignored) })
    act(() => { result.current.onConfirmDiscardChanges() })
    expect(result.current.modelName).toBe('Loaded model')
  })

  it.each(['new', 'import', 'unmount'])('ignores pending reads superseded by %s', async (action) => {
    const { result, unmount, onModelLoaded, onFileError } = setup()
    const read = deferred()
    let pending
    act(() => { pending = result.current.onOpenModelFile({ text: () => read.promise }) })
    if (action === 'unmount') unmount()
    else if (action === 'new') act(() => { result.current.onRequestNewModel() })
    else {
      window.showOpenFilePicker = vi.fn().mockRejectedValue(new DOMException('Canceled', 'AbortError'))
      await act(async () => { await result.current.onImportJavaModelizer() })
    }
    await act(async () => { read.resolve(JSON.stringify(payload)); await pending })
    expect(onModelLoaded).not.toHaveBeenCalled()
    expect(onFileError).not.toHaveBeenCalled()
    if (action !== 'unmount') expect(result.current.isOpening).toBe(false)
  })

  it('cleans up an outstanding fallback picker on unmount', async () => {
    const { result, unmount } = setup()
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    let pending
    act(() => { pending = result.current.onOpenModel() })
    expect(document.querySelector('input[type="file"]')).not.toBeNull()
    unmount()
    await pending
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })

  it('releases busy state after native and fallback cancellation and opens a JSON selection', async () => {
    const { result, onFileError } = setup()
    window.showOpenFilePicker = vi.fn().mockRejectedValue(new DOMException('Canceled', 'AbortError'))
    await act(async () => { await result.current.onOpenModel() })
    expect(result.current.isOpening).toBe(false)
    expect(onFileError).not.toHaveBeenCalled()
    delete window.showOpenFilePicker
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    let pending
    act(() => { pending = result.current.onOpenModel() })
    await act(async () => {
      document.querySelector('input[type="file"]').dispatchEvent(new Event('cancel'))
      await pending
    })
    expect(result.current.isOpening).toBe(false)
    expect(onFileError).not.toHaveBeenCalled()
    act(() => { pending = result.current.onOpenModel() })
    const input = document.querySelector('input[type="file"]')
    Object.defineProperty(input, 'files', { value: [{ ...fileFor(), name: 'legacy.json' }] })
    await act(async () => { input.dispatchEvent(new Event('change')); await pending })
    expect(result.current.modelName).toBe('Loaded model')
    expect(result.current.isOpening).toBe(false)
    expect(result.current.isDirty).toBe(false)
  })

  it('saves directly to the dropped handle once it resolves without selecting a file again', async () => {
    const { result } = setup()
    const acquisition = deferred()
    const writable = { write: vi.fn(), close: vi.fn() }
    const handle = { kind: 'file', createWritable: vi.fn().mockResolvedValue(writable) }
    window.showSaveFilePicker = vi.fn()
    let pending
    act(() => { pending = result.current.onOpenModelFile(fileFor(), acquisition.promise) })
    expect(result.current.isOpening).toBe(true)
    const ignored = fileFor()
    await act(async () => { await result.current.onOpenModelFile(ignored) })
    expect(ignored.text).not.toHaveBeenCalled()
    await act(async () => { acquisition.resolve(handle); await pending })
    act(() => { result.current.setModelName('Changed after dropping') })
    await act(async () => { await result.current.onSaveModel() })
    expect(handle.createWritable).toHaveBeenCalledOnce()
    expect(JSON.parse(writable.write.mock.calls[0][0]).modelName).toBe('Changed after dropping')
    expect(writable.close).toHaveBeenCalledOnce()
    expect(window.showSaveFilePicker).not.toHaveBeenCalled()
    expect(result.current.isDirty).toBe(false)
  })

  it('does not apply a dropped file when its pending handle is superseded by New', async () => {
    const { result, onModelLoaded } = setup()
    const acquisition = deferred()
    const file = fileFor()
    let pending
    act(() => { pending = result.current.onOpenModelFile(file, acquisition.promise) })
    act(() => { result.current.onRequestNewModel() })
    await act(async () => { acquisition.resolve({ kind: 'file' }); await pending })
    expect(file.text).not.toHaveBeenCalled()
    expect(onModelLoaded).not.toHaveBeenCalled()
    expect(result.current.isOpening).toBe(false)
  })

  it('rejects directory handles without replacing the model', async () => {
    const { result, onFileError } = setup()
    await act(async () => { await result.current.onOpenModelFile(fileFor(), Promise.resolve({ kind: 'directory' })) })
    expect(onFileError).toHaveBeenCalledWith(expect.stringContaining('folder'))
    expect(result.current.modelName).toBe('Untitled model')
    expect(result.current.isOpening).toBe(false)
  })

  it('preserves the existing handle on failure/cancel and clears it after a drop without a handle', async () => {
    const { result } = setup()
    const writable = { write: vi.fn(), close: vi.fn() }
    const original = { getFile: async () => fileFor(), createWritable: vi.fn().mockResolvedValue(writable) }
    const replacement = { createWritable: vi.fn().mockResolvedValue(writable) }
    window.showOpenFilePicker = vi.fn().mockResolvedValue([original])
    window.showSaveFilePicker = vi.fn().mockResolvedValue(replacement)
    await act(async () => { await result.current.onOpenModel() })
    await act(async () => { await result.current.onOpenModelFile(fileFor({}), replacement) })
    act(() => { result.current.setModelName('Edit') })
    await act(async () => { await result.current.onOpenModelFile(fileFor(), replacement) })
    act(() => { result.current.onConfirmDialogOpenChange(false) })
    await act(async () => { await result.current.onSaveModel() })
    expect(original.createWritable).toHaveBeenCalledOnce()
    expect(window.showSaveFilePicker).not.toHaveBeenCalled()
    await act(async () => { await result.current.onOpenModelFile(fileFor()) })
    await act(async () => { await result.current.onSaveModel() })
    expect(original.createWritable).toHaveBeenCalledOnce()
    expect(window.showSaveFilePicker).toHaveBeenCalledOnce()
    expect(replacement.createWritable).toHaveBeenCalledOnce()
  })
})
