import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import * as Dialog from '@radix-ui/react-dialog'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { afterEach, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts } from '../useKeyboardShortcuts.js'

afterEach(cleanup)

it.each([Dialog, AlertDialog])('suspends model shortcuts inside open dialogs and resumes after closing', (Modal) => {
  const actions = Object.fromEntries(['onDeleteSelection', 'onUndo', 'onRedo', 'onSaveModel', 'onOpenModel', 'onRequestNewModel', 'onAddAttribute'].map(name => [name, vi.fn()]))
  renderHook(() => useKeyboardShortcuts({ nodes: [{ id: 'class', type: 'class', selected: true }], edges: [], ...actions }))
  const dialog = render(<Modal.Root open><Modal.Portal><Modal.Content>
    <Modal.Title>Review</Modal.Title><Modal.Description>Modal content</Modal.Description>
    <button>Close</button>
  </Modal.Content></Modal.Portal></Modal.Root>)
  const close = screen.getByRole('button', { name: 'Close' })
  close.focus()
  fireEvent.keyDown(close, { key: 'Delete' })
  for (const key of ['z', 'y', 's', 'o', 'n']) fireEvent.keyDown(close, { key, ctrlKey: true })
  fireEvent.keyDown(close, { key: 'a', ctrlKey: true, altKey: true })
  for (const action of Object.values(actions)) expect(action).not.toHaveBeenCalled()
  dialog.unmount()
  fireEvent.keyDown(window, { key: 'Delete' })
  fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
  expect(actions.onDeleteSelection).toHaveBeenCalledOnce()
  expect(actions.onUndo).toHaveBeenCalledOnce()
})
