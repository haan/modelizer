import * as Accordion from '@radix-ui/react-accordion'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  ASSOCIATION_LINE_STYLE_ORTHOGONAL,
  ASSOCIATION_LINE_STYLE_MANUAL,
  ASSOCIATION_LINE_STYLE_STRAIGHT,
} from '../../../model/constants.js'

const TOOLTIP_CONTENT_CLASS =
  'rounded-md border border-base-content/10 bg-base-100 px-2 py-1 text-xs text-base-content shadow-lg'

export default function RelationshipsPanelItem({
  edge,
  sourceLabel,
  targetLabel,
  sourceAttributeLabel,
  targetAttributeLabel,
  onDeleteAssociation,
  onHighlightAssociation,
  onUpdateRelationshipLineStyle,
  onResetRelationshipRouting,
  isOpen = false,
  onToggleOpen,
}) {
  const lineStyle =
    edge.data?.lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT
      ? ASSOCIATION_LINE_STYLE_STRAIGHT
      : edge.data?.lineStyle === ASSOCIATION_LINE_STYLE_MANUAL
        ? ASSOCIATION_LINE_STYLE_MANUAL
        : ASSOCIATION_LINE_STYLE_ORTHOGONAL
  const controlPoints = Array.isArray(edge.data?.controlPoints)
    ? edge.data.controlPoints
    : []
  const hasManualControlPoints = controlPoints.length > 0
  const isManualLineStyle = lineStyle === ASSOCIATION_LINE_STYLE_MANUAL
  const isManualRouting = isManualLineStyle || hasManualControlPoints
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const manualDeleteModifierLabel = isMac
    ? 'Option (Alt) + click a handle: remove it'
    : 'Alt + click a handle: remove it'
  const applyAutoStyle = (nextStyle) => {
    if (hasManualControlPoints) {
      onResetRelationshipRouting?.(edge.id)
    }
    onUpdateRelationshipLineStyle?.(edge.id, nextStyle)
  }
  const applyManualStyle = () => {
    onResetRelationshipRouting?.(edge.id)
    onUpdateRelationshipLineStyle?.(edge.id, ASSOCIATION_LINE_STYLE_MANUAL)
  }

  const toggleOpen = () => {
    onToggleOpen?.(isOpen ? '' : edge.id)
  }

  return (
    <Accordion.Item value={edge.id} className="group">
      <Accordion.Header asChild>
        <div
          className="w-full rounded-b-md border-b border-base-content/20 group-data-[state=open]:border-b-0"
          onClick={toggleOpen}
        >
          <div className="flex items-center gap-2 rounded-b-md border-l-[6px] border-transparent px-2 py-2 text-sm font-semibold transition-colors hover:bg-base-200 group-data-[state=open]:rounded-b-none">
            <Accordion.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-md text-base-content/60 hover:bg-base-200 hover:text-base-content"
                aria-label="Toggle relationship details"
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
                  d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                />
              </svg>
              <span className="truncate">{targetLabel}</span>
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
                aria-label="Highlight relationship"
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
            </div>
          </div>
          </div>
        </Accordion.Header>
        <Accordion.Content>
          <div className="rounded-l-md border-b border-base-content/20 px-2 pb-3 pt-2 text-xs">
            <div className="flex items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                  <span className="font-bold text-base-content/70">
                    Table From
                  </span>
                </div>
                <button type="button" className="text-left">
                  <div className="truncate text-sm">{sourceLabel}</div>
                </button>
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
                      d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                  <span className="font-bold text-base-content/70">
                    Column From
                  </span>
                </div>
                <button type="button" className="text-left">
                  <div className="truncate text-sm">
                    {sourceAttributeLabel}
                  </div>
                </button>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                  <span className="font-bold text-base-content/70">
                    Table To
                  </span>
                </div>
                <button type="button" className="text-left">
                  <div className="truncate text-sm">{targetLabel}</div>
                </button>
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
                      d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                  <span className="font-bold text-base-content/70">
                    Column To
                  </span>
                </div>
                <button type="button" className="text-left">
                  <div className="truncate text-sm">
                    {targetAttributeLabel}
                  </div>
                </button>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
                Style
              </div>
              <div
                className="grid grid-cols-3 gap-2"
                role="radiogroup"
                aria-label="Relationship style"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={
                    lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT &&
                    !isManualRouting
                  }
                  className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT && !isManualRouting
                      ? 'border-primary bg-primary/15 text-base-content'
                      : 'border-base-content/20 hover:bg-base-200'
                  }`}
                  onClick={() => applyAutoStyle(ASSOCIATION_LINE_STYLE_STRAIGHT)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <line x1="6" y1="14" x2="14" y2="6" />
                    <rect x="2" y="14" width="4" height="4" />
                    <rect x="14" y="2" width="4" height="4" />
                  </svg>
                  <span>Straight</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={
                    lineStyle === ASSOCIATION_LINE_STYLE_ORTHOGONAL &&
                    !isManualRouting
                  }
                  className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    lineStyle === ASSOCIATION_LINE_STYLE_ORTHOGONAL &&
                    !isManualRouting
                      ? 'border-primary bg-primary/15 text-base-content'
                      : 'border-base-content/20 hover:bg-base-200'
                  }`}
                  onClick={() => applyAutoStyle(ASSOCIATION_LINE_STYLE_ORTHOGONAL)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <polyline points="6,14 6,10 14,10 14,6" />
                    <rect x="2" y="14" width="4" height="4" />
                    <rect x="14" y="2" width="4" height="4" />
                  </svg>
                  <span>Orthogonal</span>
                </button>
                <Tooltip.Provider delayDuration={100}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isManualRouting}
                        className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                          isManualRouting
                            ? 'border-primary bg-primary/15 text-base-content'
                            : 'border-base-content/20 hover:bg-base-200'
                        }`}
                        onClick={applyManualStyle}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="butt"
                          strokeLinejoin="miter"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <polyline points="6,14 6,8 14,14 14,6" />
                          <rect x="2" y="14" width="4" height="4" />
                          <rect x="14" y="2" width="4" height="4" />
                        </svg>
                        <span>Manual</span>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="bottom"
                        align="center"
                        sideOffset={8}
                        className={TOOLTIP_CONTENT_CLASS}
                      >
                        <div>Double-click a segment: add a handle</div>
                        <div>{manualDeleteModifierLabel}</div>
                        <Tooltip.Arrow className="fill-base-100" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center pt-2">
              <button
                className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md p-2 text-xs font-medium transition-colors hover:bg-base-300 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                type="button"
                onClick={() => onDeleteAssociation?.(edge.id)}
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
        </Accordion.Content>
      </Accordion.Item>
  )
}

