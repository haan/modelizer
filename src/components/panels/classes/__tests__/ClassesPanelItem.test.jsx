import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
} from '../../../../model/constants.js'
import ClassesPanelItem from '../ClassesPanelItem.jsx'

afterEach(cleanup)

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => children,
  arrayMove: (items, fromIndex, toIndex) => {
    const nextItems = [...items]
    const [item] = nextItems.splice(fromIndex, 1)
    nextItems.splice(toIndex, 0, item)
    return nextItems
  },
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    setActivatorNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}))

const node = {
  id: 'class-1',
  type: 'class',
  data: {
    label: 'Class1',
    logicalName: 'class_one',
    attributes: [],
    color: '#60a5fa',
  },
}

const renderItem = (props = {}) =>
  render(
    <Tooltip.Provider>
      <Accordion.Root type="single" value="class-1">
        <ClassesPanelItem
          node={node}
          isOpen
          activeView={VIEW_CONCEPTUAL}
          {...props}
        />
      </Accordion.Root>
    </Tooltip.Provider>,
  )

describe('ClassesPanelItem', () => {
  it('dispatches text edit start when class auto-edit begins', () => {
    const onTextEditStart = vi.fn()
    window.addEventListener('model-text-edit-start', onTextEditStart)

    try {
      renderItem({ shouldAutoEdit: true })

      expect(screen.getByPlaceholderText('Class name')).toHaveValue('Class1')
      expect(onTextEditStart).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('model-text-edit-start', onTextEditStart)
    }
  })

  it('does not redispatch text edit start while the same auto-edit request stays active', () => {
    const onTextEditStart = vi.fn()
    window.addEventListener('model-text-edit-start', onTextEditStart)

    try {
      const { rerender } = renderItem({ shouldAutoEdit: true })

      rerender(
        <Tooltip.Provider>
          <Accordion.Root type="single" value="class-1">
            <ClassesPanelItem
              node={node}
              isOpen
              shouldAutoEdit
              activeView={VIEW_CONCEPTUAL}
            />
          </Accordion.Root>
        </Tooltip.Provider>,
      )

      expect(onTextEditStart).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('model-text-edit-start', onTextEditStart)
    }
  })

  it('renders and updates the logical name between visibility and attributes', () => {
    const onUpdateClassLogicalName = vi.fn()
    renderItem({ onUpdateClassLogicalName })

    const visibility = screen.getByText('Visibility')
    const logicalName = screen.getByText('Logical name')
    const attributes = screen.getByText('Attributes')
    const following = visibility.ownerDocument.defaultView.Node
      .DOCUMENT_POSITION_FOLLOWING

    expect(visibility.compareDocumentPosition(logicalName) & following).toBeTruthy()
    expect(logicalName.compareDocumentPosition(attributes) & following).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Logical name'), {
      target: { value: 'renamed_table' },
    })
    expect(onUpdateClassLogicalName)
      .toHaveBeenCalledWith('class-1', 'renamed_table')
  })

  it('hides the logical name in filtered conceptual view but shows it in logical view', () => {
    const { rerender } = renderItem({ viewSpecificSettingsOnly: true })
    expect(screen.queryByPlaceholderText('Logical name')).not.toBeInTheDocument()

    rerender(
      <Tooltip.Provider>
        <Accordion.Root type="single" value="class-1">
          <ClassesPanelItem
            node={node}
            isOpen
            activeView={VIEW_LOGICAL}
            viewSpecificSettingsOnly
          />
        </Accordion.Root>
      </Tooltip.Provider>,
    )

    expect(screen.getByPlaceholderText('Logical name')).toHaveValue('class_one')
    expect(screen.getByText('Class1')).toBeInTheDocument()
  })
})
