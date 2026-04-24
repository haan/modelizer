import { render, screen } from '@testing-library/react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { describe, expect, it, vi } from 'vitest'

import { VIEW_CONCEPTUAL } from '../../../../model/constants.js'
import ClassesPanelItem from '../ClassesPanelItem.jsx'

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
})
