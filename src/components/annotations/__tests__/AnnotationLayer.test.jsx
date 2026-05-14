import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AnnotationLayer from '../AnnotationLayer.jsx'

vi.mock('reactflow', () => ({
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
}))

afterEach(() => {
  cleanup()
})

const baseProps = {
  annotations: {
    conceptual: {
      items: [
        {
          id: 'text-1',
          kind: 'text',
          x: 120,
          y: 80,
          text: 'Existing annotation',
          color: '#1e293b',
          fontSize: 14,
        },
      ],
    },
  },
  activeView: 'conceptual',
  activeTool: 'text',
  penSettings: { color: '#ef4444', thickness: 2 },
  markerSettings: { color: '#facc15', thickness: 12, opacity: 0.35 },
  eraserSettings: { size: 20, mode: 'whole' },
  currentStroke: null,
  pendingText: null,
  isTemporaryPanMode: false,
  selectedTextId: null,
  editingTextId: null,
  onPointerDown: vi.fn(),
  onPointerMove: vi.fn(),
  onPointerUp: vi.fn(),
  onCommitText: vi.fn(),
  onCommitTextEdit: vi.fn(),
  onTextPointerDown: vi.fn(),
  onTextDoubleClick: vi.fn(),
}

function renderLayer(props = {}) {
  return render(<AnnotationLayer {...baseProps} {...props} />)
}

describe('AnnotationLayer', () => {
  it('selects existing text without opening the editor when clicked with the text tool', () => {
    const onPointerDown = vi.fn()
    const onTextPointerDown = vi.fn()
    const { container } = renderLayer({ onPointerDown, onTextPointerDown })

    const hitTarget = container.querySelector('[data-annotation-hit-target="true"]')

    fireEvent.pointerDown(hitTarget)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(onPointerDown).not.toHaveBeenCalled()
    expect(onTextPointerDown).toHaveBeenCalledWith('text-1', expect.any(Object))
  })

  it('shows a selection outline for selected text', () => {
    const { container } = renderLayer({ selectedTextId: 'text-1' })

    expect(container.querySelector('[data-annotation-selection="true"]')).toBeInTheDocument()
  })

  it('requests editing when selected text is double clicked', () => {
    const onTextDoubleClick = vi.fn()
    const { container } = renderLayer({ selectedTextId: 'text-1', onTextDoubleClick })

    const hitTarget = container.querySelector('[data-annotation-hit-target="true"]')

    fireEvent.doubleClick(hitTarget)

    expect(onTextDoubleClick).toHaveBeenCalledWith('text-1', expect.any(Object))
  })

  it('commits active text editing and opens another text item on double click', () => {
    const onCommitTextEdit = vi.fn()
    const onTextDoubleClick = vi.fn()
    const { container } = renderLayer({
      annotations: {
        conceptual: {
          items: [
            ...baseProps.annotations.conceptual.items,
            {
              id: 'text-2',
              kind: 'text',
              x: 220,
              y: 120,
              text: 'Second annotation',
              color: '#1e293b',
              fontSize: 14,
            },
          ],
        },
      },
      selectedTextId: 'text-1',
      editingTextId: 'text-1',
      onCommitTextEdit,
      onTextDoubleClick,
    })

    const editor = screen.getByRole('textbox')
    const secondHitTarget = container.querySelector(
      '[data-annotation-text-id="text-2"] [data-annotation-hit-target="true"]',
    )

    fireEvent.change(editor, { target: { value: 'Edited first annotation' } })
    fireEvent.doubleClick(secondHitTarget)

    expect(onCommitTextEdit).toHaveBeenCalledWith('text-1', 'Edited first annotation')
    expect(onTextDoubleClick).toHaveBeenCalledWith('text-2', expect.any(Object))
  })

  it('opens an editor for editing text and commits changes on blur', () => {
    const onCommitTextEdit = vi.fn()
    renderLayer({ selectedTextId: 'text-1', editingTextId: 'text-1', onCommitTextEdit })

    const editor = screen.getByRole('textbox')
    expect(editor).toHaveValue('Existing annotation')

    fireEvent.change(editor, { target: { value: 'Updated annotation' } })
    fireEvent.blur(editor)

    expect(onCommitTextEdit).toHaveBeenCalledWith('text-1', 'Updated annotation')
  })

  it('keeps text editing active when interacting with the textarea by mouse', () => {
    const onPointerDown = vi.fn()
    const onPointerMove = vi.fn()
    const onPointerUp = vi.fn()
    const onCommitTextEdit = vi.fn()
    renderLayer({
      selectedTextId: 'text-1',
      editingTextId: 'text-1',
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onCommitTextEdit,
    })

    const editor = screen.getByRole('textbox')
    expect(editor).toHaveFocus()

    fireEvent.pointerDown(editor)
    fireEvent.pointerMove(editor)
    fireEvent.pointerUp(editor)
    fireEvent.mouseDown(editor)
    fireEvent.click(editor)
    fireEvent.doubleClick(editor)

    expect(editor).toHaveFocus()
    expect(onCommitTextEdit).not.toHaveBeenCalled()
    expect(onPointerDown).not.toHaveBeenCalled()
    expect(onPointerMove).not.toHaveBeenCalled()
    expect(onPointerUp).not.toHaveBeenCalled()
  })

  it('commits active text edits when clicking outside the textarea', () => {
    const onPointerDown = vi.fn()
    const onCommitTextEdit = vi.fn()
    const { container } = renderLayer({
      selectedTextId: 'text-1',
      editingTextId: 'text-1',
      onPointerDown,
      onCommitTextEdit,
    })

    const editor = screen.getByRole('textbox')
    const overlay = container.querySelector('.react-flow__annotation-layer')

    fireEvent.change(editor, { target: { value: 'Committed from outside click' } })
    fireEvent.pointerDown(overlay)

    expect(onCommitTextEdit).toHaveBeenCalledWith('text-1', 'Committed from outside click')
    expect(onPointerDown).not.toHaveBeenCalled()
  })

  it('commits new text from a pending text editor', () => {
    const onCommitText = vi.fn()
    renderLayer({
      pendingText: { x: 40, y: 50, color: '#ef4444', fontSize: 16 },
      onCommitText,
    })

    const editor = screen.getByRole('textbox')
    fireEvent.change(editor, { target: { value: 'New annotation' } })
    fireEvent.blur(editor)

    expect(onCommitText).toHaveBeenCalledWith('New annotation')
  })

  it('forwards wheel events to the element below the annotation overlay', () => {
    const underlying = document.createElement('div')
    const onWheel = vi.fn()
    underlying.addEventListener('wheel', onWheel)
    document.body.appendChild(underlying)
    const originalElementFromPoint = document.elementFromPoint
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => underlying),
    })

    try {
      const { container } = renderLayer()
      const overlay = container.querySelector('.react-flow__annotation-layer')

      fireEvent.wheel(overlay, { clientX: 10, clientY: 20, deltaY: 120 })

      expect(onWheel).toHaveBeenCalledTimes(1)
      const forwardedEvent = onWheel.mock.calls[0][0]
      expect(forwardedEvent.deltaY).toBe(120)
      expect(forwardedEvent.__annotationWheelForwarded).toBe(true)
    } finally {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: originalElementFromPoint,
      })
      underlying.remove()
    }
  })

  it('does not re-forward wheel events that already came through the annotation overlay', () => {
    const originalElementFromPoint = document.elementFromPoint
    const elementFromPoint = vi.fn()
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: elementFromPoint,
    })

    try {
      const { container } = renderLayer()
      const overlay = container.querySelector('.react-flow__annotation-layer')
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 20,
        deltaY: 120,
      })
      Object.defineProperty(wheelEvent, '__annotationWheelForwarded', {
        value: true,
      })

      overlay.dispatchEvent(wheelEvent)

      expect(elementFromPoint).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: originalElementFromPoint,
      })
    }
  })

  it('shows a pan cursor while temporary pan mode is active', () => {
    const { container } = renderLayer({ isTemporaryPanMode: true })

    expect(container.querySelector('.react-flow__annotation-layer')).toHaveStyle({
      cursor: 'grab',
    })
  })
})
