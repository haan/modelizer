import { useEffect, useRef, useState } from 'react'

export default function AssociationsPanelItem({
  edge,
  sourceLabel,
  targetLabel,
  onRenameAssociation,
  onHighlightAssociation,
}) {
  const canRename = edge.type !== 'associativeAssociation'
  const isReflexive = edge.source === edge.target
  const label = edge.data?.name ?? ''
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef(null)
  const originalLabelRef = useRef(label)

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
        <div className="border-l-[6px] border-transparent px-2 pb-3 pt-2 text-xs opacity-80">
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-wide opacity-60">From</span>
            <span className="font-medium">{sourceLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-wide opacity-60">To</span>
            <span className="font-medium">{targetLabel}</span>
          </div>
          {edge.data?.multiplicityA || edge.data?.multiplicityB ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="uppercase tracking-wide opacity-60">
                Multiplicity
              </span>
              <span className="font-medium">
                {edge.data?.multiplicityA || '?'} /{' '}
                {edge.data?.multiplicityB || '?'}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </details>
  )
}
