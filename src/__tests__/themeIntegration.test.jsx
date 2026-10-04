import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'

beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', 'test')
  document.documentElement.dataset.theme = 'light'
  localStorage.clear()
  // Radix uses these browser pointer APIs to manage menu focus.
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.dataset.theme = 'light'
  document.documentElement.style.colorScheme = 'light'
})

describe('editor theme control', () => {
  it('supports keyboard and mouse toggling without adding a model edit', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const nodeCount = container.querySelectorAll('.react-flow__node').length
    const viewport = container.querySelector('.react-flow__viewport')
    const transform = viewport.style.transform
    const view = screen.getByRole('menuitem', { name: 'View', exact: true })
    view.focus()
    await user.keyboard('{ArrowDown}')
    const toggle = await screen.findByRole('menuitemcheckbox', { name: 'Dark mode' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await waitFor(() => expect(toggle).toHaveFocus())
    await user.keyboard('{Enter}')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('modelizer.theme')).toBe('dark')

    await user.click(view)
    expect(screen.getByRole('menuitemcheckbox', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(viewport.style.transform).toBe(transform)
    expect(container.querySelectorAll('.react-flow__node')).toHaveLength(nodeCount)
    expect(screen.queryByText('*', { exact: true })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Edit', exact: true }))
    expect(screen.getByRole('menuitem', { name: /^Undo/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('menuitem', { name: /^Redo/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('preserves an existing edit and its undo/redo history', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Edit model name' }))
    const name = screen.getByPlaceholderText('Model name')
    await user.clear(name)
    await user.paste('Theme regression model')
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('menuitem', { name: 'View', exact: true }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Dark mode' }))
    expect(screen.getByText('Theme regression model')).toBeInTheDocument()
    expect(screen.getByText('*', { exact: true })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Edit', exact: true }))
    await user.click(screen.getByRole('menuitem', { name: /^Undo/ }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.queryByText('Theme regression model')).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Edit', exact: true }))
    await user.click(screen.getByRole('menuitem', { name: /^Redo/ }))
    expect(screen.getByText('Theme regression model')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('consistent menu preferences', () => {
  it('uses stable checked labels and persists every on/off preference', async () => {
    const user = userEvent.setup()
    render(<App />)
    const preferences = [
      ['Settings', 'Composite aggregation', 'showCompositionAggregation'],
      ['Settings', 'Operations compartment', 'showConceptualOperationsCompartment'],
      ['Settings', 'Notes', 'showNotes'],
      ['Settings', 'Areas', 'showAreas'],
      ['Settings', 'Annotations', 'showAnnotations'],
      ['Settings', 'Confirmation dialogs', 'confirmDelete'],
      ['Settings', 'Accent colors in PNG exports', 'includeAccentColorsInExport'],
      ['View', 'Background grid', 'showBackground'],
      ['View', 'Accent colors', 'showAccentColors'],
      ['View', 'Fullscreen', 'showFullscreen'],
      ['View', 'View-specific settings only', 'viewSpecificSettingsOnly'],
    ]
    for (const [menu, label, key] of preferences) {
      const trigger = screen.getByRole('menuitem', { name: menu, exact: true })
      await user.click(trigger)
      const option = screen.getByRole('menuitemcheckbox', { name: label, exact: true })
      const wasChecked = option.getAttribute('aria-checked') === 'true'
      await user.click(option)
      expect(localStorage.getItem(`modelizer.${key}`)).toBe(String(!wasChecked))
      await user.click(trigger)
      const changed = screen.getByRole('menuitemcheckbox', { name: label, exact: true })
      expect(changed).toHaveAttribute('aria-checked', String(!wasChecked))
      await user.click(changed)
      expect(localStorage.getItem(`modelizer.${key}`)).toBe(String(wasChecked))
    }
  })

  it('allows exactly one constraint display mode, including keyboard selection', async () => {
    const user = userEvent.setup()
    render(<App />)
    async function openConstraints() {
      await user.click(screen.getByRole('menuitem', { name: 'View', exact: true }))
      screen.getByRole('menuitem', { name: 'Constraints', exact: true }).focus()
      await user.keyboard('{ArrowRight}')
      await screen.findByRole('menuitemradio', { name: 'Null', exact: true })
    }
    await openConstraints()
    expect(screen.getByRole('menuitemradio', { name: 'Not Null', exact: true })).toHaveAttribute('aria-checked', 'true')
    screen.getByRole('menuitemradio', { name: 'Null as ?', exact: true }).focus()
    await user.keyboard('{Enter}')
    expect(localStorage.getItem('modelizer.nullDisplayMode')).toBe('null-as-question')
    await openConstraints()
    expect(screen.getAllByRole('menuitemradio').filter((item) => item.getAttribute('aria-checked') === 'true')).toHaveLength(1)
    expect(screen.getByRole('menuitemradio', { name: 'Null as ?', exact: true })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemradio', { name: 'Null', exact: true }))
    expect(localStorage.getItem('modelizer.nullDisplayMode')).toBe('null')
    await openConstraints()
    await user.click(screen.getByRole('menuitemradio', { name: 'Null', exact: true }))
    expect(localStorage.getItem('modelizer.nullDisplayMode')).toBe('null')
  })
})
