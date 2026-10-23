import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { exportFlowPng } from '../model/pngExport.jsx'

vi.mock('../model/pngExport.jsx', () => ({ exportFlowPng: vi.fn() }))

beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', 'test')
  localStorage.clear()
  localStorage.setItem('modelizer.showAnnotations', 'true')
  document.documentElement.dataset.theme = 'light'
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 })
  exportFlowPng.mockReset().mockResolvedValue('data:image/png;base64,preview')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

async function draw(container, user, tool = 'Rectangle') {
  await user.click(screen.getByRole('button', { name: 'Choose shape' }))
  await user.click(screen.getByRole('button', { name: tool, exact: true }))
  const layer = container.querySelector('.react-flow__annotation-layer')
  fireEvent.pointerDown(layer, { clientX: 50, clientY: 50, button: 0, pointerId: 1 })
  fireEvent.pointerMove(layer, { clientX: 150, clientY: 100, pointerId: 1 })
  fireEvent.pointerUp(layer, { clientX: 150, clientY: 100, pointerId: 1 })
  return layer
}

describe('annotation editor integration', () => {
  it('draws and transforms shapes while retaining Pointer behavior and shared undo/redo', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const layer = await draw(container, user)
    expect(layer.querySelectorAll('[data-annotation-id]')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Select annotation (S)' }))
    const hit = screen.getByRole('button', { name: 'Select rectangle' })
    fireEvent.pointerDown(hit, { clientX: 50, clientY: 50, button: 0, pointerId: 2 })
    fireEvent.pointerMove(layer, { clientX: 80, clientY: 70, pointerId: 2 })
    fireEvent.pointerUp(layer, { clientX: 80, clientY: 70, pointerId: 2 })
    expect(layer.querySelector('[data-resize-handle="se"]')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'More annotation actions' }))
    await user.click(screen.getByRole('button', { name: 'Duplicate annotation' }))
    expect(layer.querySelectorAll('[data-annotation-id]')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Undo', exact: true }))
    expect(layer.querySelectorAll('[data-annotation-id]')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Redo', exact: true }))
    expect(layer.querySelectorAll('[data-annotation-id]')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Pointer (V)' }))
    expect(layer).toHaveStyle({ pointerEvents: 'none' })
    expect(screen.queryByRole('button', { name: 'Select rectangle' })).not.toBeInTheDocument()
  })

  it('shows hidden annotations in the export preview without changing canvas visibility', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await draw(container, user, 'Arrow')
    await user.click(screen.getByRole('button', { name: 'Hide annotations' }))
    expect(container.querySelector('.react-flow__annotation-layer')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show annotations' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'More annotation actions' }))
    await user.click(screen.getByRole('button', { name: 'Export PNG…' }))
    expect(screen.getByRole('checkbox', { name: 'Include annotations' })).not.toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'Include annotations' }))
    expect(await screen.findByAltText('PNG export preview')).toHaveAttribute('src', 'data:image/png;base64,preview')
    expect(exportFlowPng).toHaveBeenCalledWith(expect.objectContaining({ showAnnotations: true, currentStroke: null,
      annotations: expect.objectContaining({ conceptual: { items: [expect.objectContaining({ kind: 'shape', shape: 'arrow' })] } }) }))
    expect(screen.getByRole('link', { name: 'Download PNG' })).toHaveAttribute('download', expect.stringMatching(/conceptual\.png$/))
    await user.click(screen.getByRole('button', { name: 'Close', exact: true }))
    expect(container.querySelector('.react-flow__annotation-layer')).not.toBeInTheDocument()
  })

  it('opens the unified preview through File without annotation controls for an unmarked model', async () => {
    localStorage.setItem('modelizer.showAnnotations', 'false')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('menuitem', { name: 'File', exact: true }))
    await user.click(screen.getByRole('menuitem', { name: 'Export PNG…' }))
    expect(await screen.findByAltText('PNG export preview')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Include annotations' })).not.toBeInTheDocument()
    expect(exportFlowPng).toHaveBeenCalledWith(expect.objectContaining({ showAnnotations: false, currentStroke: null }))
  })

  it('surfaces export errors and ignores a preview completed after closing it', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    exportFlowPng.mockRejectedValueOnce(new Error('Image capture failed'))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'More annotation actions' }))
    await user.click(screen.getByRole('button', { name: 'Export PNG…' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Image capture failed')
    expect(screen.queryByRole('link', { name: 'Download PNG' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close', exact: true }))
    let finish
    exportFlowPng.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    await user.click(screen.getByRole('button', { name: 'More annotation actions' }))
    await user.click(screen.getByRole('button', { name: 'Export PNG…' }))
    expect(screen.getByRole('status')).toHaveTextContent('Preparing preview')
    await user.click(screen.getByRole('button', { name: 'Close', exact: true }))
    await act(async () => finish('data:image/png;base64,late'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('remembers accent colors from the export dialog without a duplicate Preferences control', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('menuitem', { name: 'Preferences', exact: true }))
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Accent colors in PNG exports' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('menuitem', { name: 'File', exact: true }))
    await user.click(screen.getByRole('menuitem', { name: 'Export PNG…' }))
    const accent = screen.getByRole('checkbox', { name: 'Accent colors' })
    expect(accent).toBeChecked()
    await user.click(accent)
    expect(localStorage.getItem('modelizer.includeAccentColorsInExport')).toBe('false')
    await user.click(screen.getByRole('button', { name: 'Close', exact: true }))
    await user.click(screen.getByRole('menuitem', { name: 'File', exact: true }))
    await user.click(screen.getByRole('menuitem', { name: 'Export PNG…' }))
    expect(screen.getByRole('checkbox', { name: 'Accent colors' })).not.toBeChecked()
    expect(screen.queryByText('*', { exact: true })).not.toBeInTheDocument()
  })

  it('uses keyboard selection and nudging without capturing Space on toolbar buttons', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await draw(container, user)
    await user.click(screen.getByRole('button', { name: 'Select annotation (S)' }))
    const item = screen.getByRole('button', { name: 'Select rectangle' })
    item.focus()
    await user.keyboard('{Enter}{ArrowRight}')
    expect(container.querySelector('[data-resize-handle="se"]')).toBeInTheDocument()
    await user.keyboard('{Delete}')
    expect(container.querySelectorAll('[data-annotation-id]')).toHaveLength(0)
    const pointer = screen.getByRole('button', { name: 'Pointer (V)' })
    pointer.focus()
    await user.keyboard(' ')
    expect(pointer).toHaveAttribute('aria-pressed', 'true')
  })

  it('returns to a clean model after undoing the only annotation', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await draw(container, user)
    expect(screen.getByText('*', { exact: true })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo', exact: true }))
    await waitFor(() => expect(screen.queryByText('*', { exact: true })).not.toBeInTheDocument())
  })
})
