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

it.each(['File', 'Edit', 'View', 'Preferences'])('switches from %s to Help and back on hover', async menuName => {
  const user = userEvent.setup()
  render(<Navbar modelName="School model" />)
  const menubar = within(screen.getByRole('menubar'))
  const origin = menubar.getByRole('menuitem', { name: menuName, exact: true })
  const help = menubar.getByRole('menuitem', { name: 'Help', exact: true })
  await user.hover(help)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  await user.click(origin)
  await user.hover(help)
  expect(screen.getByRole('menu', { name: 'Help', exact: true })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.hover(origin)
  expect(screen.getByRole('menu', { name: menuName, exact: true })).toBeInTheDocument()
  expect(help).toHaveAttribute('aria-expanded', 'false')
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(origin).toHaveFocus()
})

it('opens the requested Help/About tab each time and returns focus to Help on close', async () => {
  const user = userEvent.setup()
  render(<Navbar modelName="School model" />)
  const trigger = within(screen.getByRole('menubar')).getByRole('menuitem', { name: 'Help', exact: true })
  for (const [itemName, title, otherTab] of [
    ['About Modelizer', 'About Modelizer', 'Help'],
    ['About Modelizer', 'About Modelizer', 'Help'],
    ['Help', 'Modelizer help', 'About'],
    ['Help', 'Modelizer help', 'About'],
  ]) {
    await user.click(trigger)
    await user.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: itemName, exact: true }))
    const dialog = screen.getByRole('dialog', { name: title })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(dialog).toContainElement(document.activeElement)
    await user.click(within(dialog).getByRole('tab', { name: otherTab, exact: true }))
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(trigger).toHaveFocus())
  }
})

it('supports keyboard menu switching, selection, and dialog dismissal', async () => {
  const user = userEvent.setup()
  render(<Navbar modelName="School model" />)
  const menubar = within(screen.getByRole('menubar'))
  menubar.getByRole('menuitem', { name: 'Preferences', exact: true }).focus()
  await user.keyboard('{ArrowDown}{ArrowRight}')
  const helpMenu = screen.getByRole('menu', { name: 'Help', exact: true })
  // Radix focuses the menu container when switching with Left/Right.
  await user.keyboard('{Home}')
  await waitFor(() => expect(within(helpMenu).getByRole('menuitem', { name: 'Help', exact: true })).toHaveFocus())
  await user.keyboard('{ArrowDown}{Enter}')
  expect(screen.getByRole('dialog', { name: 'About Modelizer' })).toContainElement(document.activeElement)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await waitFor(() => expect(menubar.getByRole('menuitem', { name: 'Help', exact: true })).toHaveFocus())
})
