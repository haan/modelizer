import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../App.jsx'

beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', 'test')
  vi.stubGlobal('DOMMatrixReadOnly', class { m22 = 1 })
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it.each(['conceptual', 'logical', 'physical'])(
  'keeps %s anchors available for dragging after an accidental click', async view => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const payload = { nodes: ['a', 'b'].map((id, index) => ({
      id, type: 'class', position: { x: index * 300, y: 0 },
      data: { label: id, attributes: [{ id: `${id}-attr`, name: 'id' }] },
    })), edges: [] }
    fireEvent.drop(window, { dataTransfer: { files: [{
      name: 'anchors.mdlz', text: async () => JSON.stringify(payload),
    }] } })
    await waitFor(() => expect(container.querySelectorAll('.react-flow__node-class')).toHaveLength(2))
    if (view !== 'conceptual') {
      await user.click(screen.getByRole('button', {
        name: view === 'logical' ? 'Logical' : 'Physical', exact: true,
      }))
    }
    const sources = [...container.querySelectorAll('.react-flow__handle.source')]
    const targets = [...container.querySelectorAll('.react-flow__handle.target')]
    expect(sources.length).toBeGreaterThan(0)
    const expectDragReady = () => {
      expect(sources.every(handle => handle.classList.contains('connectionindicator'))).toBe(true)
      expect(targets.every(handle => !handle.classList.contains('connectionindicator'))).toBe(true)
      expect(container.querySelector('.clickconnecting')).toBeNull()
      expect(container.querySelector('.is-connecting')).toBeNull()
    }
    expectDragReady()
    fireEvent.click(sources[0])
    expectDragReady()
    fireEvent.click(container.querySelector('.react-flow__pane'))
    fireEvent.click(sources[sources.length - 1])
    expectDragReady()
  },
)
