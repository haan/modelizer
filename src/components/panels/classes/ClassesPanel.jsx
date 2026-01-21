import { useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import ClassesPanelItem from './ClassesPanelItem.jsx'

export default function ClassesPanel({
  nodes,
  onAddClass,
  onRenameClass,
  onReorderClasses,
  onReorderAttributes,
  onUpdateAttribute,
  onAddAttribute,
  onDeleteAttribute,
  onUpdateClassColor,
  onUpdateClassVisibility,
  onDeleteClass,
  onHighlightClass,
  showAccentColors,
  activeView,
  viewSpecificSettingsOnly,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )
  const itemIds = nodes.map((node) => node.id)
  const [openClassId, setOpenClassId] = useState('')

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = itemIds.indexOf(active.id)
    const newIndex = itemIds.indexOf(over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const nextOrder = arrayMove(itemIds, oldIndex, newIndex)
    onReorderClasses?.(nextOrder)
  }

  if (!nodes.length) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
            Classes
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-base-content/70 hover:bg-base-300 hover:text-base-content"
            type="button"
            onClick={onAddClass}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add class
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
          Classes
        </div>
        <button
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-base-content/70 hover:bg-base-300 hover:text-base-content"
          type="button"
          onClick={onAddClass}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add class
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <Accordion.Root
            type="single"
            collapsible
            value={openClassId}
            onValueChange={setOpenClassId}
            className="flex flex-col gap-1"
          >
            {nodes.map((node) => (
              <ClassesPanelItem
                key={node.id}
                node={node}
                isOpen={openClassId === node.id}
                onToggleOpen={(nextOpen) => setOpenClassId(nextOpen)}
                onRename={onRenameClass}
                onReorderAttributes={onReorderAttributes}
                onUpdateAttribute={onUpdateAttribute}
                onAddAttribute={onAddAttribute}
                onDeleteAttribute={onDeleteAttribute}
                onUpdateClassColor={onUpdateClassColor}
                onUpdateClassVisibility={onUpdateClassVisibility}
                onDeleteClass={onDeleteClass}
                onHighlightClass={onHighlightClass}
                showAccentColors={showAccentColors}
                activeView={activeView}
                viewSpecificSettingsOnly={viewSpecificSettingsOnly}
              />
            ))}
          </Accordion.Root>
        </SortableContext>
      </DndContext>
    </div>
  )
}

