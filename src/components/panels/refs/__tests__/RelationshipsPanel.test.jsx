import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { VIEW_LOGICAL, VIEW_PHYSICAL } from '../../../../model/constants.js'
import RelationshipsPanel from '../RelationshipsPanel.jsx'

afterEach(cleanup)

const nodes = [
  {
    id: 'class-a',
    data: {
      label: 'Customer',
      logicalName: 'customer_table',
      attributes: [{ id: 'id-a', name: 'id', logicalName: 'customer_id' }],
    },
  },
  {
    id: 'class-b',
    data: {
      label: 'Order',
      logicalName: '',
      attributes: [{ id: 'id-b', name: 'id', logicalName: '' }],
    },
  },
]

const edges = [
  {
    id: 'relationship-1',
    type: 'relationship',
    source: 'class-a',
    target: 'class-b',
    sourceHandle: 'right-id-a-source',
    targetHandle: 'left-id-b-target',
    data: {},
  },
]

describe('RelationshipsPanel class labels', () => {
  it.each([VIEW_LOGICAL, VIEW_PHYSICAL])(
    'uses logical class names with conceptual fallback in %s view',
    (activeView) => {
      render(
        <RelationshipsPanel
          nodes={nodes}
          edges={edges}
          activeView={activeView}
        />,
      )

      expect(screen.getByText('customer_table')).toBeInTheDocument()
      expect(screen.getByText('Order')).toBeInTheDocument()
      expect(screen.queryByText('Customer')).not.toBeInTheDocument()
    },
  )
})

it.each([VIEW_LOGICAL, VIEW_PHYSICAL])('keeps header actions independent of expansion and endpoint columns correct in %s', activeView => {
  const onHighlightAssociation = vi.fn(), onDeleteAssociation = vi.fn()
  const onResetRelationshipRouting = vi.fn(), onUpdateRelationshipLineStyle = vi.fn()
  render(<RelationshipsPanel nodes={nodes} edges={edges} activeView={activeView}
    onHighlightAssociation={onHighlightAssociation} onDeleteAssociation={onDeleteAssociation}
    onResetRelationshipRouting={onResetRelationshipRouting} onUpdateRelationshipLineStyle={onUpdateRelationshipLineStyle} />)
  expect(screen.getByTitle('customer_id to id')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Highlight relationship' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete relationship' }))
  expect(onHighlightAssociation).toHaveBeenCalledWith('relationship-1')
  expect(onDeleteAssociation).toHaveBeenCalledWith('relationship-1')
  expect(screen.getByRole('button', { name: 'Toggle relationship details' })).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'Toggle relationship details' }))
  expect(screen.getByTitle('customer_id to id')).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Endpoint from: customer_table' })).getByText('customer_id')).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Endpoint to: Order' })).getByText('id')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'Manual' }))
  expect(onResetRelationshipRouting).toHaveBeenCalledWith('relationship-1')
  expect(onUpdateRelationshipLineStyle).toHaveBeenCalledWith('relationship-1', 'manual')
  expect(onResetRelationshipRouting.mock.invocationCallOrder[0]).toBeLessThan(onUpdateRelationshipLineStyle.mock.invocationCallOrder[0])
})
