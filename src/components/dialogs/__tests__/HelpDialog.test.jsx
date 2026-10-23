import { useState } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import { HelpDialog } from '../HelpDialog.jsx'

afterEach(cleanup)

function Harness() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Open help</button><HelpDialog open={open} onOpenChange={setOpen} /></>
}

it('opens a named guide and lets readers choose task instructions with the keyboard', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Open help' }))
  expect(screen.getByRole('dialog', { name: 'Modelizer help' })).toHaveAccessibleDescription('From your first class to a model ready to share.')
  expect(screen.getByRole('article', { name: 'Your first model' })).toHaveTextContent('Reader')
  const topic = within(screen.getByRole('navigation', { name: 'Help topics' })).getByRole('button', { name: 'Connect classes and tables' })
  topic.focus()
  await user.keyboard('{Enter}')
  expect(topic).toHaveAttribute('aria-current', 'page')
  expect(screen.queryByRole('article', { name: 'Your first model' })).not.toBeInTheDocument()
  expect(screen.getByRole('article', { name: 'Connect classes and tables' })).toHaveTextContent('Associations have no direction')
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('supports the compact topic selector and exposes shortcut tables', async () => {
  const user = userEvent.setup()
  render(<HelpDialog open onOpenChange={() => {}} />)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Help topic' }), screen.getByRole('option', { name: 'Keyboard shortcuts' }))
  const article = screen.getByRole('article', { name: 'Keyboard shortcuts' })
  expect(within(article).getAllByRole('table')).toHaveLength(2)
  expect(article).toHaveTextContent('Ctrl/Cmd + S')
})

it('shows About with preserved credits, local setup, safe links, and a working close button', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Open help' }))
  screen.getByRole('tab', { name: 'Help', exact: true }).focus()
  await user.keyboard('{ArrowRight}')
  const dialog = screen.getByRole('dialog', { name: 'About Modelizer' })
  expect(within(dialog).getByRole('heading', { name: 'Run locally on Windows' })).toBeInTheDocument()
  expect(within(dialog).getByRole('heading', { name: 'Acknowledgments' })).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: 'Laurent Haan' })).toHaveAttribute('href', 'https://www.haan.lu')
  expect(within(dialog).getByRole('link', { name: 'GitHub Releases' })).toHaveAttribute('href', 'https://github.com/haan/modelizer/releases')
  expect(dialog).toHaveTextContent('modelizer.bat')
  expect(dialog).toHaveTextContent('Bob Fisch')
  expect(within(dialog).getByRole('link', { name: 'ChartDB' })).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: 'miniserve' })).toBeInTheDocument()
  for (const link of within(dialog).getAllByRole('link')) {
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
  await user.click(within(dialog).getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
