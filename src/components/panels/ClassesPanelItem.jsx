import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CLASS_COLOR_PALETTE } from '../../classPalette.js'
import { normalizeAttributes } from '../../attributes.js'
import ClassesPanelAttributesPanel from './ClassesPanelAttributesPanel.jsx'
import ClassesPanelOptionsPanel from './ClassesPanelOptionsPanel.jsx'
import ClassesPanelVisibilityPanel from './ClassesPanelVisibilityPanel.jsx'
import Input from '../ui/Input.jsx'

export default function ClassesPanelItem({
  node,
  onRename,
  onReorderAttributes,
  onUpdateAttribute,
  onAddAttribute,
  onDeleteAttribute,
  onUpdateClassColor,
  onDeleteClass,
  onHighlightClass,
}) {
  const accentColor = node.data?.color ?? CLASS_COLOR_PALETTE[0]
  const attributes = normalizeAttributes(node.id, node.data?.attributes)
  const label = node.data?.label ?? ''
  const color = node.data?.color ?? CLASS_COLOR_PALETTE[0]
  const {
    attributes: sortableAttributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef(null)
  const originalLabelRef = useRef(label)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    setIsEditing(false)
  }

  const startEditing = () => {
    originalLabelRef.current = label
    setDraft(label)
    setIsEditing(true)
  }


  return (
    <details
      ref={setNodeRef}
      style={style}
      className={`group ${isDragging ? 'opacity-60' : ''}`}
    >
      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <div className="w-full rounded-b-md border-b border-base-content/20 group-open:border-b-0">
          <div
            className="flex items-center gap-2 rounded-l-md border-l-[6px] px-2 py-2 text-sm font-semibold transition-colors hover:bg-base-200 group-open:rounded-b-none"
            style={{ borderColor: accentColor }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 opacity-60 transition-transform group-open:rotate-90"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/50 transition-opacity hover:bg-base-200 hover:text-base-content cursor-grab active:cursor-grabbing"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label="Reorder class"
              {...sortableAttributes}
              {...listeners}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <circle cx="9" cy="5" r="1" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="15" cy="5" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="15" cy="19" r="1" />
              </svg>
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isEditing ? (
                <Input
                  ref={inputRef}
                  size="sm"
                  className="min-w-0 font-semibold"
                  value={draft}
                  placeholder="Class name"
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDraft(nextValue)
                    onRename?.(node.id, nextValue)
                  }}
                  onBlur={commit}
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    event.stopPropagation()
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      commit()
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      const originalLabel = originalLabelRef.current
                      setIsEditing(false)
                      setDraft(originalLabel)
                      onRename?.(node.id, originalLabel)
                    }
                  }}
                />
              ) : (
                <span className="truncate text-md p-1">
                  {label || 'Untitled class'}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 opacity-0 transition-opacity hover:bg-base-300 hover:text-base-content group-hover:opacity-100"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onHighlightClass?.(node.id)
                }}
                onMouseDown={(event) => event.stopPropagation()}
                aria-label="Highlight class"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0" />
                  <path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" />
                  <path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8" />
                  <path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" />
                  <path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0" />
                  <path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" />
                  <path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8" />
                  <path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" />
                  <circle cx="12" cy="12" r="1" />
                </svg>
              </button>
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 opacity-0 transition-opacity hover:bg-base-300 hover:text-base-content group-hover:opacity-100"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  startEditing()
                }}
                onMouseDown={(event) => event.stopPropagation()}
                aria-label="Edit class name"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </summary>
      <ClassesPanelVisibilityPanel accentColor={accentColor} />
      <div className="w-full">
        <div
          className="border-l-[6px] px-2 pb-3 pt-1 text-xs opacity-100"
          style={{ borderColor: accentColor }}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide opacity-70">
            <span>Attributes</span>
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-base-content/60 hover:bg-base-300 hover:text-base-content"
              onClick={(event) => {
                event.stopPropagation()
                onAddAttribute?.(node.id)
              }}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label="Add attribute"
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
            </button>
          </div>
          <ClassesPanelAttributesPanel
            attributes={attributes}
            nodeId={node.id}
            onReorderAttributes={onReorderAttributes}
            onUpdateAttribute={onUpdateAttribute}
            onAddAttribute={onAddAttribute}
            onDeleteAttribute={onDeleteAttribute}
          />
        </div>
      </div>
      <ClassesPanelOptionsPanel
        accentColor={accentColor}
        color={color}
        nodeId={node.id}
        onChangeColor={onUpdateClassColor}
        onDeleteClass={onDeleteClass}
      />
    </details>
  )
}
