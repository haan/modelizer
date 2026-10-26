import ControlTooltip from '../../ui/ControlTooltip.jsx'
import PanelDeleteButton from '../../ui/PanelDeleteButton.jsx'
import { useEffect, useRef, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import ClassColorControl from '../classes/ClassColorControl.jsx'
import { CLASS_COLOR_PALETTE } from '../../../classPalette.js'
import Input from '../../ui/Input.jsx'
import CheckboxInput from '../../ui/Checkbox.jsx'

export default function AreasPanelItem({
  area,
  isOpen = false,
  onToggleOpen,
  onRename,
  onUpdateColor,
  onUpdateVisibility,
  onDelete,
  onHighlight,
}) {
  const label = area.data?.label ?? ''
  const color = area.data?.color ?? CLASS_COLOR_PALETTE[0]
  const areaVisibility = area.data?.visibility ?? {}
  const isConceptual =
    typeof areaVisibility.conceptual === 'boolean'
      ? areaVisibility.conceptual
      : true
  const isLogical =
    typeof areaVisibility.logical === 'boolean' ? areaVisibility.logical : true
  const accentBorderColor = color || 'transparent'
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
    onToggleOpen?.(isOpen ? '' : area.id)
  }

  return (
    <Accordion.Item value={area.id} className="group">
      <Accordion.Header asChild>
        <div
          className="group/area-header w-full rounded-b-md border-b border-base-content/20 group-data-[state=open]:border-b-0"
          onClick={toggleOpen}
        >
          <div
            className="flex items-center gap-2 rounded-l-md border-l-[6px] px-2 py-2 text-sm font-semibold transition-colors hover:bg-base-200 group-data-[state=open]:rounded-b-none"
            style={{ borderColor: accentBorderColor }}
          >
            <Accordion.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-md text-base-content/60 hover:bg-base-200 hover:text-base-content"
                aria-label="Toggle area details"
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
                  placeholder="Area name"
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDraft(nextValue)
                    onRename?.(area.id, nextValue)
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
                      onRename?.(area.id, originalLabel)
                      window.dispatchEvent(new CustomEvent('model-text-edit-end'))
                    }
                  }}
                />
              ) : (
                <span className="truncate text-md p-1">
                  {label || 'Untitled area'}
                </span>
              )}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 pointer-events-none transition-opacity group-data-[state=open]:opacity-100 group-data-[state=open]:pointer-events-auto group-hover/area-header:opacity-100 group-hover/area-header:pointer-events-auto group-has-[:focus-visible]/area-header:opacity-100 group-has-[:focus-visible]/area-header:pointer-events-auto has-[[data-state=open]]:opacity-100 has-[[data-state=open]]:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto">
              <ClassColorControl color={color} entityNoun="area" onChange={value => onUpdateColor?.(area.id, value)} />
              <ControlTooltip label="Focus area on diagram">
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onHighlight?.(area.id)
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  aria-label="Focus area"
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
              <ControlTooltip label="Rename area">
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    startEditing()
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  aria-label="Edit area name"
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
              <PanelDeleteButton label="Delete area" onClick={() => onDelete?.(area.id)} />
            </div>
          </div>
        </div>
      </Accordion.Header>
      <Accordion.Content>
        <div className="w-full rounded-b-md border-b border-base-content/20">
          <div
            className="border-l-[6px] px-2 pb-3 pt-1.5 text-xs rounded-bl-md"
            style={{ borderColor: accentBorderColor }}
          >
            <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2">
              <div className="text-[11px] text-base-content/65">
                Visibility
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px]">
                <label className="flex items-center gap-2">
                  <CheckboxInput
                    checked={isConceptual}
                    onCheckedChange={(value) =>
                      onUpdateVisibility?.(area.id, {
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
                      onUpdateVisibility?.(area.id, {
                        logical: Boolean(value),
                        physical: Boolean(value),
                      })
                    }
                  />
                  <span>Logical/Physical</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

