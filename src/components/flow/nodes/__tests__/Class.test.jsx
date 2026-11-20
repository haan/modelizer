import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../../../model/constants.js'
import { Class } from '../Class.jsx'

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: {
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
    Top: 'top',
  },
  useUpdateNodeInternals: () => vi.fn(),
}))

afterEach(cleanup)

const renderClass = (activeView, logicalName = 'customer_table') =>
  render(
    <Class
      id="class-1"
      data={{
        label: 'Customer',
        logicalName,
        activeView,
        attributes: [],
      }}
    />,
  )

describe('Class display name', () => {
  it('renders the conceptual name in conceptual view', () => {
    renderClass(VIEW_CONCEPTUAL)
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.queryByText('customer_table')).not.toBeInTheDocument()
  })

  it.each([VIEW_LOGICAL, VIEW_PHYSICAL])(
    'renders the logical name in %s view',
    (activeView) => {
      renderClass(activeView)
      expect(screen.getByText('customer_table')).toBeInTheDocument()
      expect(screen.queryByText('Customer')).not.toBeInTheDocument()
    },
  )

  it('falls back to the conceptual name when the logical name is blank', () => {
    renderClass(VIEW_PHYSICAL, '   ')
    expect(screen.getByText('Customer')).toBeInTheDocument()
  })
})

describe('Class accent layout', () => {
  it('rounds the accent without clipping attribute handles at the class border', () => {
    const { container } = renderClass(VIEW_LOGICAL)
    const accent = container.querySelector('[data-accent-bar="true"]')
    const classFrame = accent?.parentElement

    expect(accent).toHaveClass('h-2', 'w-full', 'rounded-t-[6px]')
    expect(accent).not.toHaveClass('-mx-2')
    expect(classFrame).not.toHaveClass('overflow-hidden')
  })
})

describe('attribute key symbols', () => {
  it.each([VIEW_LOGICAL, VIEW_PHYSICAL])('marks exact prefixes on the displayed name in %s view', (activeView) => {
    const names = [
      ['pk_number', ''],
      ['pk_oldName', 'fk_course'],
      ['Enrollment', 'pkfk_student'],
      ['pk_hiddenPrefix', 'student'],
      ['PK_number', ''],
      ['old_fk_course', ''],
    ]
    const attributes = names.map(([name, logicalName], id) => ({ id, name, logicalName, defaultValue: '1' }))
    render(<Class id="class-1" data={{ activeView, showKeySymbols: true, attributes }} />)
    const symbols = screen.getAllByRole('img')
    expect(symbols.map(symbol => symbol.getAttribute('aria-label'))).toEqual([
      'Primary key', 'Foreign key', 'Primary and foreign key',
    ])
    expect(symbols[2].querySelectorAll('svg')).toHaveLength(2)
    expect(symbols[2].parentElement).toHaveTextContent(activeView === VIEW_PHYSICAL ? 'pkfk_student*' : 'pkfk_student')
  })

  it('updates the same row when the name, view, or preference changes', () => {
    const node = (name, activeView, showKeySymbols) => (
      <Class id="class-1" data={{ activeView, showKeySymbols, attributes: [{ id: 'a', name }] }} />
    )
    const { rerender } = render(node('id', VIEW_LOGICAL, true))
    expect(screen.queryByRole('img')).toBeNull()
    rerender(node('pk_id', VIEW_LOGICAL, true))
    expect(screen.getByRole('img', { name: 'Primary key' })).toBeInTheDocument()
    rerender(node('id', VIEW_LOGICAL, true))
    expect(screen.queryByRole('img')).toBeNull()
    rerender(node('pk_id', VIEW_CONCEPTUAL, true))
    expect(screen.queryByRole('img')).toBeNull()
    rerender(node('pk_id', VIEW_PHYSICAL, false))
    expect(screen.queryByRole('img')).toBeNull()
    rerender(node('pk_id', VIEW_PHYSICAL, true))
    expect(screen.getByRole('img', { name: 'Primary key' })).toBeInTheDocument()
  })
})
