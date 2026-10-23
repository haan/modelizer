import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import FileErrorDialog from '../FileErrorDialog.jsx'
import ModelContentDialog from '../ModelContentDialog.jsx'

afterEach(cleanup)

it('provides a persistent, actionable unsupported-format dialog with a separate close control', () => {
  const onOpenChange = vi.fn()
  render(<FileErrorDialog error={{ open: true, code: 'UNSUPPORTED_MODEL_VERSION', fileVersion: 3, supportedVersion: 2 }} onOpenChange={onOpenChange} />)
  expect(screen.getByRole('dialog', { name: 'Newer Modelizer required' })).toBeInTheDocument()
  expect(screen.getByText(/supports formats 1 and 2/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Open latest Modelizer' })).toHaveAttribute('href', 'https://www.modelizer.lu/')
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onOpenChange).toHaveBeenCalledWith(false)
})

it('lists only hidden categories and reveals them together only after Show all', () => {
  const onReveal = vi.fn(), onDismiss = vi.fn()
  const report = { hiddenNotes: true, hiddenAreas: true, hiddenAnnotations: true, hiddenInConceptual: { classes: 1 }, annotationViews: ['logical'] }
  render(<ModelContentDialog report={report} enabled={{ areas: true }} onDismiss={onDismiss} onReveal={onReveal} />)
  expect(onReveal).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog', { name: 'Show hidden content?' })).toBeInTheDocument()
  expect(screen.getByText('This model contains notes and annotations hidden by your display settings.')).toBeInTheDocument()
  expect(screen.queryByText(/Hidden in conceptual view/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
  expect(onReveal.mock.calls).toEqual([['notes'], ['annotations']])
  expect(onDismiss).toHaveBeenCalledOnce()
})

it('stays closed for intentional per-view visibility and clears reports resolved through settings', () => {
  const onDismiss = vi.fn()
  const renderNotice = (report, enabled = {}) => <ModelContentDialog report={report} enabled={enabled} onDismiss={onDismiss} onReveal={vi.fn()} />
  const { rerender } = render(renderNotice({ hiddenInConceptual: { attributes: 7 }, annotationViews: ['logical'] }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  rerender(renderNotice({ hiddenNotes: true }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  rerender(renderNotice({ hiddenNotes: true }, { notes: true }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(onDismiss).toHaveBeenCalledOnce()
})

it('supports keyboard dismissal without changing display preferences', () => {
  const onDismiss = vi.fn(), onReveal = vi.fn()
  render(<ModelContentDialog report={{ hiddenNotes: true }} enabled={{}} onDismiss={onDismiss} onReveal={onReveal} />)
  fireEvent.keyDown(screen.getByRole('button', { name: 'Keep hidden' }), { key: 'Escape' })
  expect(onDismiss).toHaveBeenCalledOnce()
  expect(onReveal).not.toHaveBeenCalled()
})

it('keeps settings unchanged when Keep hidden is chosen', () => {
  const onDismiss = vi.fn(), onReveal = vi.fn()
  render(<ModelContentDialog report={{ hiddenNotes: true }} enabled={{}} onDismiss={onDismiss} onReveal={onReveal} />)
  fireEvent.click(screen.getByRole('button', { name: 'Keep hidden' }))
  expect(onDismiss).toHaveBeenCalledOnce()
  expect(onReveal).not.toHaveBeenCalled()
})

it('never revives a resolved file-opening dialog but offers it again for a new file', () => {
  function FileOpeningDialog() {
    const [report, setReport] = useState({ hiddenNotes: true, hiddenAreas: true })
    const [enabled, setEnabled] = useState({})
    return <>
      <ModelContentDialog report={report} enabled={enabled} onDismiss={() => setReport(null)}
        onReveal={setting => setEnabled(current => ({ ...current, [setting]: true }))} />
      <button onClick={() => setEnabled(current => ({ ...current, notes: !current.notes }))}>Toggle notes in menu</button>
      <button onClick={() => { setEnabled({}); setReport({ hiddenNotes: true, hiddenAreas: true }) }}>Open another file</button>
    </>
  }
  render(<FileOpeningDialog />)
  fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Toggle notes in menu' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Open another file' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Keep hidden' }))
  fireEvent.click(screen.getByRole('button', { name: 'Toggle notes in menu' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('clears resolved reports even while another dialog or view is active', () => {
  const onDismiss = vi.fn()
  render(<ModelContentDialog report={{ hiddenNotes: true }} enabled={{ notes: true }} visible={false}
    onDismiss={onDismiss} onReveal={vi.fn()} />)
  expect(onDismiss).toHaveBeenCalledOnce()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
