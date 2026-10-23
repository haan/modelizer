import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../App.jsx'

beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', 'test')
  vi.stubGlobal('DOMMatrixReadOnly', class { m22 = 1 })
  localStorage.clear()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear() })

it.each(['conceptual', 'logical', 'physical'])('undoes class/table creation in %s once after automatic name editing', async view => {
  const user = userEvent.setup()
  const { container } = render(<App />)
  if (view !== 'conceptual') await user.click(screen.getByRole('button', { name: view === 'logical' ? 'Logical' : 'Physical', exact: true }))
  const count = () => container.querySelectorAll('.react-flow__node').length
  const originalCount = count()
  await user.click(screen.getByRole('button', { name: view === 'conceptual' ? 'Add class' : 'Add table', exact: true }))
  const name = await screen.findByPlaceholderText(view === 'conceptual' ? 'Class name' : 'Table name')
  await waitFor(() => expect(name).toHaveFocus())
  await user.keyboard('{Enter}')
  expect(count()).toBe(originalCount + 1)
  await user.click(screen.getByRole('menuitem', { name: 'Edit', exact: true }))
  await user.click(screen.getByRole('menuitem', { name: /^Undo/ }))
  await waitFor(() => expect(count()).toBe(originalCount))
  expect(screen.queryByLabelText('Unsaved changes')).not.toBeInTheDocument()
  await user.click(screen.getByRole('menuitem', { name: 'Edit', exact: true }))
  expect(screen.getByRole('menuitem', { name: /^Undo/ })).toHaveAttribute('aria-disabled', 'true')
  await user.click(screen.getByRole('menuitem', { name: /^Redo/ }))
  await waitFor(() => expect(count()).toBe(originalCount + 1))
})
