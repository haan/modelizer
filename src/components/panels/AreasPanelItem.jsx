import { useEffect, useRef, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { CirclePicker } from 'react-color'
import { CLASS_COLOR_PALETTE } from '../../classPalette.js'
import Input from '../ui/Input.jsx'

export default function AreasPanelItem({
  area,
  isOpen = false,
  onToggleOpen,
  onRename,
  onUpdateColor,
  onDelete,
  onHighlight,
}) {
  const label = area.data?.label ?? ''
  const color = area.data?.color ?? CLASS_COLOR_PALETTE[0]
  const accentBorderColor = color || 'transparent'
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
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
  }

  const startEditing = () => {
    originalLabelRef.current = label
    setDraft(label)
    setIsEditing(true)
  }

  const toggleOpen = () => {
    onToggleOpen?.(isOpen ? '' : area.id)
  }

  return (
    <Accordion.Item value={area.id} className="group">
      <Accordion.Header asChild>
        <div
          className="w-full rounded-b-md border-b border-base-content/20 group-data-[state=open]:border-b-0"
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
                    }
                  }}
                />
              ) : (
                <span className="truncate text-md p-1">
                  {label || 'Untitled area'}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 opacity-0 transition-opacity hover:bg-base-300 hover:text-base-content group-hover:opacity-100"
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
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 opacity-0 transition-opacity hover:bg-base-300 hover:text-base-content group-hover:opacity-100"
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
            </div>
          </div>
        </div>
      </Accordion.Header>
      <Accordion.Content>
        <div className="w-full rounded-b-md border-b border-base-content/20">
          <div
            className="border-l-[6px] px-2 py-3 text-xs rounded-bl-md"
            style={{ borderColor: accentBorderColor }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Options
              </span>
            </div>
            <div className="relative mt-2">
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:ring-2 hover:ring-base-content/30 hover:ring-offset-2 hover:ring-offset-base-100"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsPickerOpen((open) => !open)
                }}
                onMouseDown={(event) => event.stopPropagation()}
                aria-haspopup="dialog"
                aria-expanded={isPickerOpen}
                aria-label="Choose area color"
                style={{ backgroundColor: color }}
              >
                <span className="sr-only">Choose area color</span>
              </button>
              {isPickerOpen ? (
                <div className="absolute right-0 top-10 z-20">
                  <button
                    type="button"
                    className="fixed inset-0 h-full w-full cursor-default"
                    onClick={(event) => {
                      event.stopPropagation()
                      setIsPickerOpen(false)
                    }}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                  <div className="relative rounded-lg border border-base-content/20 bg-base-100 p-2 shadow-xl">
                    <CirclePicker
                      color={color}
                      colors={CLASS_COLOR_PALETTE}
                      circleSize={22}
                      circleSpacing={10}
                      onChange={(nextColor) =>
                        onUpdateColor?.(area.id, nextColor.hex)
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-1 items-center justify-center pt-2">
              <button
                className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md p-2 text-xs font-medium transition-colors hover:bg-base-300 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                type="button"
                onClick={() => onDelete?.(area.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 h-3.5 w-3.5 text-red-700"
                  aria-hidden="true"
                >
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <div className="text-red-700">Delete</div>
              </button>
            </div>
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
