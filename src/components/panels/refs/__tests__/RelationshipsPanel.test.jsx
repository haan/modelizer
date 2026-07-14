import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

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
