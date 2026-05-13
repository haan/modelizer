import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import AnnotationLayer from '../AnnotationLayer.jsx'

vi.mock('reactflow', () => ({
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
}))

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
  onPointerDown: vi.fn(),
  onPointerMove: vi.fn(),
  onPointerUp: vi.fn(),
  onCommitText: vi.fn(),
  onUpdateText: vi.fn(),
}

function renderLayer(props = {}) {
  return render(<AnnotationLayer {...baseProps} {...props} />)
}

describe('AnnotationLayer', () => {
  it('opens an editor when an existing text annotation is clicked with the text tool', () => {
    const onPointerDown = vi.fn()
    const onUpdateText = vi.fn()
    const { container } = renderLayer({ onPointerDown, onUpdateText })

    const hitTarget = container.querySelector('[data-annotation-text-id="text-1"] rect')

    fireEvent.pointerDown(hitTarget)

    const editor = screen.getByRole('textbox')
    expect(editor).toHaveValue('Existing annotation')
    expect(onPointerDown).not.toHaveBeenCalled()

    fireEvent.change(editor, { target: { value: 'Updated annotation' } })
    fireEvent.blur(editor)

    expect(onUpdateText).toHaveBeenCalledWith('text-1', 'Updated annotation')
  })
})
