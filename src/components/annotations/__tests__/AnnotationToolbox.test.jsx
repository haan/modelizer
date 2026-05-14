import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AnnotationToolbox from '../AnnotationToolbox.jsx'

vi.mock('reactflow', () => ({
  Panel: ({ children, className, style }) => (
    <div data-testid="annotation-toolbar" className={className} style={style}>
      {children}
    </div>
  ),
}))

afterEach(() => {
  cleanup()
})

const baseProps = {
  activeTool: 'pointer',
  onSetTool: vi.fn(),
  penSettings: { color: '#ef4444', thickness: 2 },
  onPenSettingsChange: vi.fn(),
  markerSettings: { color: '#facc15', thickness: 12, opacity: 0.35 },
  onMarkerSettingsChange: vi.fn(),
  textSettings: { color: '#1e293b', fontSize: 14 },
  onTextSettingsChange: vi.fn(),
  eraserSettings: { size: 20, mode: 'whole' },
  onEraserSettingsChange: vi.fn(),
  onClearView: vi.fn(),
}

function renderToolbox(props = {}) {
  const mergedProps = {
    ...baseProps,
    onSetTool: vi.fn(),
    onPenSettingsChange: vi.fn(),
    onMarkerSettingsChange: vi.fn(),
    onTextSettingsChange: vi.fn(),
    onEraserSettingsChange: vi.fn(),
    onClearView: vi.fn(),
    ...props,
  }

  return {
    props: mergedProps,
    ...render(<AnnotationToolbox {...mergedProps} />),
  }
}

describe('AnnotationToolbox', () => {
  it('shows annotation tool shortcuts in toolbar button labels', () => {
    renderToolbox()

    expect(screen.getByRole('button', { name: 'Pointer (V)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pen (P)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marker (M)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Text (T)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eraser (E)' })).toBeInTheDocument()
  })

  it('keeps tool options out of the inline toolbar until the active tool swatch is opened', () => {
    renderToolbox({ activeTool: 'pen' })

    expect(screen.getByTestId('annotation-toolbar')).toBeInTheDocument()
    const penOptions = screen.getByRole('button', { name: 'Pen options' })
    expect(penOptions).toBeInTheDocument()
    expect(penOptions.parentElement).toHaveClass('transition-[max-height,opacity,transform,padding-top]')
    expect(penOptions.parentElement).toHaveClass('max-h-10')
    expect(screen.queryByText('Thickness')).not.toBeInTheDocument()

    fireEvent.click(penOptions)

    expect(screen.getByText('Thickness')).toBeInTheDocument()
  })

  it('shows a color swatch for pen and applies colors from its popover', () => {
    const onPenSettingsChange = vi.fn()
    renderToolbox({ activeTool: 'pen', onPenSettingsChange })

    const trigger = screen.getByRole('button', { name: 'Pen options' })
    expect(trigger.querySelector('span')).toHaveStyle({ backgroundColor: '#ef4444' })

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: '#f97316' }))

    expect(onPenSettingsChange).toHaveBeenCalledWith({ color: '#f97316' })
  })

  it('shows marker options in a popover and updates opacity', () => {
    const onMarkerSettingsChange = vi.fn()
    renderToolbox({ activeTool: 'marker', onMarkerSettingsChange })

    fireEvent.click(screen.getByRole('button', { name: 'Marker options' }))

    const opacity = screen.getByDisplayValue('35')
    fireEvent.change(opacity, { target: { value: '50' } })

    expect(onMarkerSettingsChange).toHaveBeenCalledWith({ opacity: 0.5 })
  })

  it('uses the current text color as the text options swatch and updates font size', () => {
    const onTextSettingsChange = vi.fn()
    renderToolbox({
      activeTool: 'text',
      textSettings: { color: '#3b82f6', fontSize: 18 },
      onTextSettingsChange,
    })

    const trigger = screen.getByRole('button', { name: 'Text options' })
    expect(trigger.querySelector('span')).toHaveStyle({ backgroundColor: '#3b82f6' })

    fireEvent.click(trigger)
    const fontSize = screen.getByDisplayValue('18')
    fireEvent.change(fontSize, { target: { value: '22' } })

    expect(onTextSettingsChange).toHaveBeenCalledWith({ fontSize: 22 })
  })

  it('shows an eraser size trigger and opens size/mode options', () => {
    const onEraserSettingsChange = vi.fn()
    renderToolbox({ activeTool: 'eraser', onEraserSettingsChange })

    const trigger = screen.getByRole('button', { name: 'Eraser options' })
    expect(trigger.querySelector('span')).toHaveClass('rounded-full')

    fireEvent.click(trigger)
    expect(screen.getByText('Size')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Partial' }))

    expect(onEraserSettingsChange).toHaveBeenCalledWith({ mode: 'partial' })
  })

  it('opens a clear annotations confirmation dialog from the trash button', () => {
    const onClearView = vi.fn()
    renderToolbox({ onClearView })

    fireEvent.click(screen.getByRole('button', { name: 'Clear annotations in this view' }))

    expect(screen.getByText('Clear annotations?')).toBeInTheDocument()
    expect(
      screen.getByText('This removes all annotations in the current view. You can undo this action.'),
    ).toBeInTheDocument()
    expect(onClearView).not.toHaveBeenCalled()
  })

  it('does not clear annotations when the confirmation dialog is cancelled', () => {
    const onClearView = vi.fn()
    renderToolbox({ onClearView })

    fireEvent.click(screen.getByRole('button', { name: 'Clear annotations in this view' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClearView).not.toHaveBeenCalled()
    expect(screen.queryByText('Clear annotations?')).not.toBeInTheDocument()
  })

  it('clears annotations once when the confirmation dialog is confirmed', () => {
    const onClearView = vi.fn()
    renderToolbox({ onClearView })

    fireEvent.click(screen.getByRole('button', { name: 'Clear annotations in this view' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onClearView).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Clear annotations?')).not.toBeInTheDocument()
  })
})
