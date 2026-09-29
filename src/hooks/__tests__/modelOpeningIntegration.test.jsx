import { useState } from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { ReactFlowProvider, useStoreApi } from 'reactflow'
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
const importCases = [
  ['Java Modelizer', 'onImportJavaModelizer', 'older.mod', JSON.stringify({ tables: [{ name: 'Customer', fields: [] }] })],
  ['MySQL', 'onImportMySql', 'older.sql', 'CREATE TABLE Customer (id INT PRIMARY KEY);'],
]
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
  it.each(['class', 'umlClass', 'note', 'area', 'associationHelper', 'associationFloatingEdgeNode'])(
    'provides a canvas-safe default position for a %s node', async (type) => {
      const { result } = setup()
      await act(async () => {
        await result.current.onOpenModelFile(fileFor({ nodes: [{ id: 'n', type }], edges: [] }))
      })
      expect(result.current.nodes[0].position).toEqual({ x: 0, y: 0 })
      expect(result.current.isDirty).toBe(false)
      if (type === 'umlClass') {
        expect(result.current.nodes[0].type).toBe('class')
        expect(result.current.nodes[0].data.attributes).toEqual([])
      }
      const canvas = renderHook(() => useStoreApi(), { wrapper: ReactFlowProvider })
      expect(() => {
        act(() => canvas.result.current.getState().setNodes(result.current.nodes))
      }).not.toThrow()
    },
  )

  it.each(importCases)('locks opens during %s import and confirms edits made while reading', async (_label, action, name, text) => {
    const { result, onModelLoaded } = setup()
    const read = deferred()
    const file = { name, text: vi.fn(() => read.promise) }
    window.showOpenFilePicker = vi.fn().mockResolvedValue([{ getFile: async () => file }])
    let pending
    act(() => { pending = result.current[action]() })
    await waitFor(() => expect(file.text).toHaveBeenCalledOnce())
    expect(result.current.isOpening).toBe(true)
    const dropped = fileFor()
    await act(async () => {
      await result.current.onOpenModelFile(dropped)
      await result.current.onOpenModel()
    })
    expect(dropped.text).not.toHaveBeenCalled()
    expect(window.showOpenFilePicker).toHaveBeenCalledOnce()
    act(() => { result.current.setModelName('Edited during import') })
    await act(async () => { read.resolve(text); await pending })
    expect(result.current.modelName).toBe('Edited during import')
    expect(result.current.isDirty).toBe(true)
    expect(result.current.isConfirmDialogOpen).toBe(true)
    expect(onModelLoaded).not.toHaveBeenCalled()
    act(() => { result.current.onConfirmDiscardChanges(); result.current.onConfirmDialogOpenChange(false) })
    expect(onModelLoaded).toHaveBeenCalledOnce()
    expect(result.current.nodes).toHaveLength(1)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.isOpening).toBe(false)
  })

  it.each(importCases)('ignores stale %s results after New and a newer drop', async (_label, action, name, text) => {
    const { result, onModelLoaded } = setup()
    const read = deferred()
    const file = { name, text: vi.fn(() => read.promise) }
    window.showOpenFilePicker = vi.fn().mockResolvedValue([{ getFile: async () => file }])
    let pending
    act(() => { pending = result.current[action]() })
    await waitFor(() => expect(file.text).toHaveBeenCalledOnce())
    act(() => { result.current.onRequestNewModel() })
    await act(async () => { await result.current.onOpenModelFile(fileFor()) })
    act(() => { result.current.setModelName('Keep these edits') })
    await act(async () => { read.resolve(text); await pending })
    expect(result.current.modelName).toBe('Keep these edits')
    expect(result.current.isDirty).toBe(true)
    expect(onModelLoaded).toHaveBeenCalledOnce()
  })

  it.each(importCases)('ignores stale %s results after a newer import and after unmount', async (_label, action, name, text) => {
    const { result, unmount, onModelLoaded, onFileError } = setup()
    const firstRead = deferred()
    const firstFile = { name, text: vi.fn(() => firstRead.promise) }
    window.showOpenFilePicker = vi.fn()
      .mockResolvedValueOnce([{ getFile: async () => firstFile }])
      .mockResolvedValueOnce([{ getFile: async () => ({ name, text: async () => text }) }])
    let first
    act(() => { first = result.current[action]() })
    await waitFor(() => expect(firstFile.text).toHaveBeenCalledOnce())
    await act(async () => { await result.current[action]() })
    expect(onModelLoaded).toHaveBeenCalledOnce()
    await act(async () => { firstRead.resolve(text); await first })
    expect(onModelLoaded).toHaveBeenCalledOnce()

    const lastRead = deferred()
    const lastFile = { name, text: vi.fn(() => lastRead.promise) }
    window.showOpenFilePicker.mockResolvedValue([{ getFile: async () => lastFile }])
    let last
    act(() => { last = result.current[action]() })
    await waitFor(() => expect(lastFile.text).toHaveBeenCalledOnce())
    unmount()
    await act(async () => { lastRead.resolve(text); await last })
    expect(onModelLoaded).toHaveBeenCalledOnce()
    expect(onFileError).not.toHaveBeenCalled()
  })

  it.each(importCases)('releases the busy lock when a %s fallback picker is canceled', async (_label, action, name) => {
    const { result } = setup()
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    let pending
    act(() => { pending = result.current[action]() })
    const input = document.querySelector('input[type="file"]')
    expect(input.accept).toContain(name.slice(name.lastIndexOf('.')))
    await act(async () => { input.dispatchEvent(new Event('cancel')); await pending })
    expect(result.current.isOpening).toBe(false)
    expect(input.isConnected).toBe(false)
    await act(async () => { await result.current.onOpenModelFile(fileFor()) })
    expect(result.current.modelName).toBe('Loaded model')
  })

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
