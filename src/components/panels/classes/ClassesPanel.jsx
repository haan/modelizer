import { useEffect, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Tooltip from '@radix-ui/react-tooltip'
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

const TOOLTIP_CLASS =
  'rounded-md border border-base-content/10 bg-base-100 px-2 py-1 text-xs text-base-content shadow-lg'

function AddClassButton({ onAddClass, shortcutLabel }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
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
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom" sideOffset={8} className={TOOLTIP_CLASS}>
          {shortcutLabel}
          <Tooltip.Arrow className="fill-base-100" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

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
  openClassId: controlledOpenClassId,
  onOpenClassIdChange,
  openAttributeId,
  onOpenAttributeIdChange,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const shortcutLabel = isMac ? 'Cmd+Opt+C' : 'Ctrl+Alt+C'
  const addAttributeShortcutLabel = isMac ? 'Cmd+Opt+A' : 'Ctrl+Alt+A'
  const itemIds = nodes.map((node) => node.id)
  const [uncontrolledOpenClassId, setUncontrolledOpenClassId] = useState('')
  const openClassId =
    typeof controlledOpenClassId === 'string'
      ? controlledOpenClassId
      : uncontrolledOpenClassId
  const setOpenClassId = onOpenClassIdChange ?? setUncontrolledOpenClassId

  useEffect(() => {
    if (!onAddClass) {
      return
    }

    const handleKeyDown = (event) => {
      const target = event.target
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      if (isEditable) {
        return
      }

      const key = event.key?.toLowerCase()
      if (key !== 'c') {
        return
      }

      const modifierOk = isMac ? event.metaKey : event.ctrlKey
      if (!modifierOk || !event.altKey || event.shiftKey) {
        return
      }

      event.preventDefault()
      onAddClass()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMac, onAddClass])

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

  return (
    <div className="flex flex-col gap-1 text-sm">
      <Tooltip.Provider delayDuration={100}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
            Classes
          </div>
          <AddClassButton onAddClass={onAddClass} shortcutLabel={shortcutLabel} />
        </div>
        {nodes.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
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
                    openAttributeId={openAttributeId}
                    onOpenAttributeIdChange={onOpenAttributeIdChange}
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
                  addAttributeShortcutLabel={addAttributeShortcutLabel}
                />
              ))}
              </Accordion.Root>
            </SortableContext>
          </DndContext>
        ) : null}
      </Tooltip.Provider>
    </div>
  )
}

