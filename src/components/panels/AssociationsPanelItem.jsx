import { useEffect, useRef, useState } from 'react'

const MULTIPLICITY_OPTIONS = [
  { value: '', label: 'Undefined' },
  { value: '0..1', label: '0..1' },
  { value: '1..1', label: '1..1' },
  { value: '0..*', label: '0..*' },
  { value: '1..*', label: '1..*' },
]

export default function AssociationsPanelItem({
  edge,
  sourceLabel,
  targetLabel,
  sourceIsAssociation = false,
  targetIsAssociation = false,
  onRenameAssociation,
  onUpdateAssociationMultiplicity,
  onHighlightAssociation,
}) {
  const canRename = edge.type !== 'associativeAssociation'
  const canEditMultiplicity = edge.type !== 'associativeAssociation'
  const isReflexive = edge.source === edge.target
  const label = edge.data?.name ?? ''
  const multiplicityA = edge.data?.multiplicityA ?? ''
  const multiplicityB = edge.data?.multiplicityB ?? ''
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef(null)
  const originalLabelRef = useRef(label)
  const normalizeMultiplicity = (value) =>
    MULTIPLICITY_OPTIONS.some((option) => option.value === value)
      ? value
      : ''
  const multiplicityAValue = normalizeMultiplicity(multiplicityA)
  const multiplicityBValue = normalizeMultiplicity(multiplicityB)

  useEffect(() => {
    if (!isEditing) {
      setDraft(label)
    }
  }, [label, isEditing])

  useEffect(() => {
    if (!canRename && isEditing) {
      setIsEditing(false)
    }
  }, [canRename, isEditing])

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
    if (!canRename) {
      return
    }
    originalLabelRef.current = label
    setDraft(label)
    setIsEditing(true)
  }

  return (
    <details className="group">
      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <div className="w-full rounded-b-md border-b border-base-content/20 group-open:border-b-0">
          <div className="flex items-center gap-2 rounded-b-md border-l-[6px] border-transparent px-2 py-2 text-sm font-semibold transition-colors hover:bg-base-200 group-open:rounded-b-none">
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
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isEditing && canRename ? (
                <input
                  ref={inputRef}
                  className="w-full min-w-0 rounded-md border border-base-content/20 bg-transparent px-1 py-0.5 text-sm font-semibold focus:outline-none"
                  value={draft}
                  placeholder="Association name"
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDraft(nextValue)
                    onRenameAssociation?.(edge.id, nextValue)
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
                      onRenameAssociation?.(edge.id, originalLabel)
                    }
                  }}
                />
              ) : (
                <span className="flex min-w-0 items-center gap-1 text-sm">
                  {label ? (
                    <span className="truncate">{label}</span>
                  ) : isReflexive ? (
                    <span className="truncate">{`${sourceLabel} (self)`}</span>
                  ) : (
                    <>
                      <span className="truncate">{sourceLabel}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-4 w-4 shrink-0 opacity-70"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                        />
                      </svg>
                      <span className="truncate">{targetLabel}</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 opacity-0 transition-opacity hover:bg-base-300 hover:text-base-content group-hover:opacity-100"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onHighlightAssociation?.(edge.id)
                }}
                onMouseDown={(event) => event.stopPropagation()}
                aria-label="Highlight association"
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
              {canRename ? (
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 opacity-0 transition-opacity hover:bg-base-300 hover:text-base-content group-hover:opacity-100"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    startEditing()
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  aria-label="Edit association name"
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
              ) : null}
            </div>
          </div>
        </div>
      </summary>
      <div className="w-full">
        <div className="rounded-l-md border-b border-base-content/20 px-2 pb-3 pt-2">
          <div className="flex items-center justify-between gap-1 text-xs">
            <div className="flex basis-1/2 flex-col gap-2 overflow-hidden text-xs">
              <div className="flex flex-row items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-4 w-4 text-base-content/60"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
                  />
                </svg>
                <div className="font-bold text-base-content/70">
                  {sourceIsAssociation ? 'Association' : 'Table A'}
                </div>
              </div>
              <button type="button" className="text-left">
                <div className="truncate text-left text-sm">
                  {sourceLabel}
                </div>
              </button>
              {canEditMultiplicity ? (
                <>
                  <div className="flex flex-row items-center gap-1">
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
                      className="lucide lucide-chevrons-left-right-ellipsis size-4 text-subtitle"
                      aria-hidden="true"
                    >
                      <path d="M12 12h.01" />
                      <path d="M16 12h.01" />
                      <path d="m17 7 5 5-5 5" />
                      <path d="m7 7-5 5 5 5" />
                      <path d="M8 12h.01" />
                    </svg>
                    <div className="font-bold text-subtitle">
                      Cardinality
                    </div>
                  </div>
                  <div className="p-1">
                    <select
                      className="select select-bordered select-xs w-full appearance-none outline-offset-2 focus:ring-0 focus:ring-offset-0"
                      value={multiplicityAValue}
                      onChange={(event) =>
                        onUpdateAssociationMultiplicity?.(
                          edge.id,
                          'A',
                          event.target.value,
                        )
                      }
                    >
                      {MULTIPLICITY_OPTIONS.map((option) => (
                        <option
                          key={option.value || 'undefined'}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}
            </div>
            <div className="flex basis-1/2 flex-col gap-2 overflow-hidden text-xs">
              <div className="flex flex-row items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-4 w-4 text-base-content/60"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
                  />
                </svg>
                <div className="font-bold text-base-content/70">
                  {targetIsAssociation ? 'Association' : 'Table B'}
                </div>
              </div>
              <button type="button" className="text-left">
                <div className="truncate text-left text-sm">
                  {targetLabel}
                </div>
              </button>
              {canEditMultiplicity ? (
                <>
                  <div className="flex flex-row items-center gap-1">
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
                      className="lucide lucide-chevrons-left-right-ellipsis size-4 text-subtitle"
                      aria-hidden="true"
                    >
                      <path d="M12 12h.01" />
                      <path d="M16 12h.01" />
                      <path d="m17 7 5 5-5 5" />
                      <path d="m7 7-5 5 5 5" />
                      <path d="M8 12h.01" />
                    </svg>
                    <div className="font-bold text-subtitle">
                      Cardinality
                    </div>
                  </div>
                  <div className="p-1">
                    <select
                      className="select select-bordered select-xs w-full appearance-none outline-offset-2 focus:ring-0 focus:ring-offset-0"
                      value={multiplicityBValue}
                      onChange={(event) =>
                        onUpdateAssociationMultiplicity?.(
                          edge.id,
                          'B',
                          event.target.value,
                        )
                      }
                    >
                      {MULTIPLICITY_OPTIONS.map((option) => (
                        <option
                          key={option.value || 'undefined'}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </details>
  )
}
