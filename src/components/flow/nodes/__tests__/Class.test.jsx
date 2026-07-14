import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../../../model/constants.js'
import { Class } from '../Class.jsx'

vi.mock('reactflow', () => ({
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
