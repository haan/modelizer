import ControlTooltip from '../../ui/ControlTooltip.jsx'
import PanelDeleteButton from '../../ui/PanelDeleteButton.jsx'
import { useEffect, useRef, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import Input from '../../ui/Input.jsx'
import CheckboxInput from '../../ui/Checkbox.jsx'

export default function NotesPanelItem({
  note,
  isOpen = false,
  onToggleOpen,
  onRename,
  onUpdateText,
  onUpdateVisibility,
  onDelete,
  onHighlight,
}) {
  const label = note.data?.label ?? ''
  const text = note.data?.text ?? ''
  const noteVisibility = note.data?.visibility ?? {}
  const isConceptual =
    typeof noteVisibility.conceptual === 'boolean'
      ? noteVisibility.conceptual
      : true
  const isLogical =
    typeof noteVisibility.logical === 'boolean'
      ? noteVisibility.logical
      : true
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef(null)
  const originalLabelRef = useRef(label)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    setIsEditing(false)
    window.dispatchEvent(new CustomEvent('model-text-edit-end'))
  }

  const startEditing = () => {
    originalLabelRef.current = label
    setDraft(label)
    setIsEditing(true)
    window.dispatchEvent(new CustomEvent('model-text-edit-start'))
  }

  const toggleOpen = () => {
    onToggleOpen?.(isOpen ? '' : note.id)
  }

  return (
    <Accordion.Item value={note.id} className="group">
      <Accordion.Header asChild>
        <div
          className="group/note-header w-full rounded-b-md border-b border-base-content/20 group-data-[state=open]:border-b-0"
          onClick={toggleOpen}
        >
          <div className="flex items-center gap-2 rounded-l-md border-l-[6px] border-transparent px-2 py-2 text-sm font-semibold transition-colors hover:bg-base-200 group-data-[state=open]:rounded-b-none">
            <Accordion.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-md text-base-content/60 hover:bg-base-200 hover:text-base-content"
                aria-label="Toggle note details"
                onClick={(event) => event.stopPropagation()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 opacity-60 transition-transform group-data-[state=open]:rotate-90"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </Accordion.Trigger>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isEditing ? (
                <Input
                  ref={inputRef}
                  size="sm"
                  className="min-w-0 font-semibold"
                  value={draft}
                  placeholder="Note name"
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDraft(nextValue)
                    onRename?.(note.id, nextValue)
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
                      onRename?.(note.id, originalLabel)
                      window.dispatchEvent(new CustomEvent('model-text-edit-end'))
                    }
                  }}
                />
              ) : (
                <span className="truncate text-md p-1">
                  {label || 'Untitled note'}
                </span>
              )}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 pointer-events-none transition-opacity group-data-[state=open]:opacity-100 group-data-[state=open]:pointer-events-auto group-hover/note-header:opacity-100 group-hover/note-header:pointer-events-auto group-has-[:focus-visible]/note-header:opacity-100 group-has-[:focus-visible]/note-header:pointer-events-auto has-[[data-state=open]]:opacity-100 has-[[data-state=open]]:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto">
              <ControlTooltip label="Focus note on diagram">
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onHighlight?.(note.id)
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  aria-label="Focus note"
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
              </ControlTooltip>
              <ControlTooltip label="Rename note">
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    startEditing()
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  aria-label="Edit note name"
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
              </ControlTooltip>
              <PanelDeleteButton label="Delete note" onClick={() => onDelete?.(note.id)} />
            </div>
          </div>
        </div>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden">
        <div className="rounded-b-md border-b border-base-content/20 border-l-[6px] border-l-transparent px-2 pb-3 pt-1.5 text-xs">
          <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2">
            <div className="text-[11px] text-base-content/65">
              Visibility
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px]">
              <label className="flex items-center gap-2">
                <CheckboxInput
                  checked={isConceptual}
                  onCheckedChange={(value) =>
                    onUpdateVisibility?.(note.id, {
                      conceptual: Boolean(value),
                    })
                  }
                />
                <span>Conceptual</span>
              </label>
              <label className="flex items-center gap-2">
                <CheckboxInput
                  checked={isLogical}
                  onCheckedChange={(value) =>
                    onUpdateVisibility?.(note.id, {
                      logical: Boolean(value),
                      physical: Boolean(value),
                    })
                  }
                />
                <span>Logical/Physical</span>
              </label>
            </div>
          </div>
          <textarea
            className="mt-3 min-h-[120px] w-full rounded-md border border-base-content/20 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Note text"
            placeholder="Write your note..."
            value={text}
            onFocus={() =>
              window.dispatchEvent(new CustomEvent('model-text-edit-start'))
            }
            onBlur={() =>
              window.dispatchEvent(new CustomEvent('model-text-edit-end'))
            }
            onChange={(event) => onUpdateText?.(note.id, event.target.value)}
          />
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

