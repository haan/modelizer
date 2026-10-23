import EndpointConnector from './EndpointConnector.jsx'
import PanelDeleteButton from '../../ui/PanelDeleteButton.jsx'
import ControlTooltip from '../../ui/ControlTooltip.jsx'
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
          className="group/ref-header w-full rounded-b-md border-b border-base-content/20 group-data-[state=open]:border-b-transparent"
          onClick={toggleOpen}
        >
          <div className="flex items-center gap-2 rounded-b-md border-l-[6px] border-transparent px-2 py-1 text-sm font-semibold transition-colors hover:bg-base-200 group-data-[state=open]:rounded-b-none">
            <Accordion.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-md text-base-content/60 hover:bg-base-200 hover:text-base-content focus-visible:ring-2 focus-visible:ring-ring"
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
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span className="flex w-full min-w-0 items-center gap-1 text-sm leading-5" title={sourceLabel + ' to ' + targetLabel}>
                <span className="truncate">{sourceLabel}</span>
                <EndpointConnector directional />
                <span className="sr-only">to</span>
                <span className="truncate">{targetLabel}</span>
              </span>
              <span className="flex w-full min-w-0 items-center gap-1 text-[11px] font-normal leading-4 text-muted-foreground" title={sourceAttributeLabel + ' to ' + targetAttributeLabel}>
                <span className="truncate">{sourceAttributeLabel}</span>
                <EndpointConnector directional />
                <span className="sr-only">to</span>
                <span className="truncate">{targetAttributeLabel}</span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 pointer-events-none transition-opacity group-data-[state=open]:opacity-100 group-data-[state=open]:pointer-events-auto group-hover/ref-header:opacity-100 group-hover/ref-header:pointer-events-auto group-has-[:focus-visible]/ref-header:opacity-100 group-has-[:focus-visible]/ref-header:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto">
              <ControlTooltip label="Focus relationship on diagram">
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content focus-visible:ring-2 focus-visible:ring-ring"
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
              </ControlTooltip>
              <PanelDeleteButton label="Delete relationship" onClick={() => onDeleteAssociation?.(edge.id)} />
            </div>
          </div>
        </div>
      </Accordion.Header>
      <Accordion.Content>
        <div className="rounded-b-md border-b border-base-content/20 px-3 pb-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            {[
              { side: 'From', table: sourceLabel, column: sourceAttributeLabel },
              { side: 'To', table: targetLabel, column: targetAttributeLabel },
            ].map(({ side, table, column }) => (
              <section key={side} aria-label={'Endpoint ' + side.toLowerCase() + ': ' + table} className="min-w-0 space-y-2">
                <div>
                  <div className="text-[11px] text-base-content/65">Table {side.toLowerCase()}</div>
                  <div className="mt-0.5 truncate text-sm font-medium" title={table}>{table}</div>
                </div>
                <div>
                  <div className="text-[11px] text-base-content/65">Column {side.toLowerCase()}</div>
                  <div className="mt-0.5 truncate text-xs" title={column}>{column}</div>
                </div>
              </section>
            ))}
          </div>
          <div className="mt-3">
            <div className="mb-1.5 text-[11px] text-base-content/65">
              Line style
            </div>
            <div
              className="grid grid-cols-3 gap-1"
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
                className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
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
                className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
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
                      className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
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
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

