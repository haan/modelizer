import { useState } from 'react'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Navbar from '../Navbar.jsx'

beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(cleanup)

it('separates diagram visibility and notation from editor preferences', async () => {
  const user = userEvent.setup()
  render(<Navbar modelName="School model" />)
  expect(within(screen.getByRole('menubar')).getAllByRole('menuitem').map(item => item.textContent))
    .toEqual(['File', 'Edit', 'View', 'Preferences', 'Help'])
  await user.click(screen.getByRole('menuitem', { name: 'View', exact: true }))
  expect(screen.getAllByRole('menuitemcheckbox').map(item => item.textContent)).toEqual([
    'Notes', 'Areas', 'Annotations', 'Operations compartment', 'Background grid', 'Accent colors', 'Fullscreen',
  ])
  expect(screen.getByRole('menuitem', { name: 'Nullability notation' })).toBeInTheDocument()
  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('menuitem', { name: 'Preferences', exact: true }))
  expect(screen.getAllByRole('menuitemcheckbox').map(item => item.textContent)).toEqual([
    'Dark mode', 'Enable composite aggregation', 'Confirm before deleting', 'Only show fields for current view',
  ])
})

it('keeps the complete model name available and supports keyboard rename, cancel, and commit', async () => {
  const user = userEvent.setup()
  const original = 'A long teaching model name that needs to remain accessible on a narrow screen'
  function Editor() {
    const [name, setName] = useState(original)
    return <Navbar modelName={name} onRenameModel={setName} isDirty={name !== original} />
  }
  render(<Editor />)
  expect(screen.getByTitle(original)).toHaveTextContent(original)
  screen.getByRole('button', { name: 'Edit model name' }).focus()
  await user.keyboard('{Enter}')
  const input = screen.getByRole('textbox', { name: 'Model name' })
  await waitFor(() => expect(input).toHaveFocus())
  expect(input).toHaveValue(original)
  await user.clear(input)
  await user.type(input, 'Temporary title{Escape}')
  expect(screen.getByTitle(original)).toHaveTextContent(original)
  expect(screen.queryByLabelText('Unsaved changes')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Edit model name' }))
  await user.clear(screen.getByRole('textbox', { name: 'Model name' }))
  await user.type(screen.getByRole('textbox', { name: 'Model name' }), 'Lesson 2{Enter}')
  expect(screen.getByTitle('Lesson 2')).toHaveTextContent('Lesson 2')
  expect(screen.getByLabelText('Unsaved changes')).toHaveTextContent('*')
})
