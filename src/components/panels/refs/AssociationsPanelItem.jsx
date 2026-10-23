import EndpointConnector from './EndpointConnector.jsx'
import ControlTooltip from '../../ui/ControlTooltip.jsx'
import PanelDeleteButton from '../../ui/PanelDeleteButton.jsx'
import { useEffect, useId, useRef, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Tooltip from '@radix-ui/react-tooltip'
import SelectField from '../../ui/Select.jsx'
import Input from '../../ui/Input.jsx'
import CheckboxInput from '../../ui/Checkbox.jsx'
import {
  ASSOCIATION_LINE_STYLE_ORTHOGONAL,
  ASSOCIATION_LINE_STYLE_MANUAL,
  ASSOCIATION_LINE_STYLE_STRAIGHT,
} from '../../../model/constants.js'

const UNDEFINED_MULTIPLICITY_VALUE = '__undefined__'
const MULTIPLICITY_OPTIONS = [
  { value: UNDEFINED_MULTIPLICITY_VALUE, label: 'Undefined' },
  { value: '0..1', label: '0..1' },
  { value: '1..1', label: '1..1' },
  { value: '0..*', label: '0..*' },
  { value: '1..*', label: '1..*' },
]
const TOOLTIP_CONTENT_CLASS =
  'rounded-md border border-base-content/10 bg-base-100 px-2 py-1 text-xs text-base-content shadow-lg'

export default function AssociationsPanelItem({
  edge,
  sourceLabel,
  targetLabel,
  sourceIsAssociation = false,
  targetIsAssociation = false,
  onRenameAssociation,
  onDeleteAssociation,
  onUpdateAssociationMultiplicity,
  onUpdateAssociationRole,
  onUpdateAssociationComment,
  onUpdateAssociationLineStyle,
  onResetAssociationRouting,
  showCompositionAggregation = false,
  onToggleAssociationComposition,
  onHighlightAssociation,
  isOpen = false,
  onToggleOpen,
}) {
  const canRename = edge.type !== 'associativeAssociation'
  const canEditMultiplicity = edge.type !== 'associativeAssociation'
  const canEditRole =
    edge.type === 'association' || edge.type === 'reflexiveAssociation'
  const canToggleComposition =
    showCompositionAggregation &&
    (edge.type === 'association' || edge.type === 'composition')
  const canEditLineStyle =
    edge.type === 'association' || edge.type === 'composition'
  const canComment =
    edge.type === 'association' ||
    edge.type === 'reflexiveAssociation' ||
    edge.type === 'composition'
  const isComposition = edge.type === 'composition'
  const isReflexive = edge.source === edge.target
  const label = edge.data?.name ?? ''
  const endpointSummary = isReflexive ? `${sourceLabel} (self)` : `${sourceLabel} and ${targetLabel}`
  const multiplicityA = edge.data?.multiplicityA ?? ''
  const multiplicityB = edge.data?.multiplicityB ?? ''
  const roleA = edge.data?.roleA ?? ''
  const roleB = edge.data?.roleB ?? ''
  const comment = edge.data?.comment ?? ''
  const lineStyle =
    edge.data?.lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT
      ? ASSOCIATION_LINE_STYLE_STRAIGHT
      : edge.data?.lineStyle === ASSOCIATION_LINE_STYLE_MANUAL
        ? ASSOCIATION_LINE_STYLE_MANUAL
        : ASSOCIATION_LINE_STYLE_ORTHOGONAL
  const controlPoints = Array.isArray(edge.data?.controlPoints)
    ? edge.data.controlPoints
    : []
  const hasManualControlPoints = canEditLineStyle && controlPoints.length > 0
  const isManualLineStyle =
    canEditLineStyle && lineStyle === ASSOCIATION_LINE_STYLE_MANUAL
  const isManualRouting = isManualLineStyle || hasManualControlPoints
  const applyAutoStyle = (nextStyle) => {
    if (hasManualControlPoints) {
      onResetAssociationRouting?.(edge.id)
    }
    onUpdateAssociationLineStyle?.(edge.id, nextStyle)
  }
  const applyManualStyle = () => {
    onResetAssociationRouting?.(edge.id)
    onUpdateAssociationLineStyle?.(edge.id, ASSOCIATION_LINE_STYLE_MANUAL)
  }
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef(null)
  const fieldId = useId()
  const originalLabelRef = useRef(label)
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const manualDeleteModifierLabel = isMac
    ? 'Option (Alt) + click a handle: remove it'
    : 'Alt + click a handle: remove it'
  const normalizeMultiplicity = (value) =>
    MULTIPLICITY_OPTIONS.some((option) => option.value === value)
      ? value
      : ''
  const multiplicityAValue = normalizeMultiplicity(multiplicityA)
  const multiplicityBValue = normalizeMultiplicity(multiplicityB)
  const selectMultiplicityAValue =
    multiplicityAValue || UNDEFINED_MULTIPLICITY_VALUE
  const selectMultiplicityBValue =
    multiplicityBValue || UNDEFINED_MULTIPLICITY_VALUE

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
    if (!canRename) {
      return
    }
    originalLabelRef.current = label
    setDraft(label)
    setIsEditing(true)
    window.dispatchEvent(new CustomEvent('model-text-edit-start'))
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
                aria-label="Toggle association details"
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
              {isEditing && canRename ? (
                <Input
                  ref={inputRef}
                  size="sm"
                  className="min-w-0 font-semibold"
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
                      window.dispatchEvent(new CustomEvent('model-text-edit-end'))
                    }
                  }}
                />
              ) : (
                <span className="flex w-full min-w-0 items-center gap-1 text-sm leading-5">
                  {label ? (
                    <span className="truncate">{label}</span>
                  ) : isReflexive ? (
                    <span className="truncate">{`${sourceLabel} (self)`}</span>
                  ) : (
                    <>
                      <span className="truncate">{sourceLabel}</span>
                      <EndpointConnector />
                      <span className="truncate">{targetLabel}</span>
                    </>
                  )}
                </span>
              )}
              {!isEditing && label && (
                <span className="flex w-full min-w-0 items-center gap-1 text-[11px] font-normal leading-4 text-muted-foreground" title={endpointSummary}>
                  <span className="truncate">{sourceLabel}</span>
                  {isReflexive ? <span>(self)</span> : <>
                    <EndpointConnector />
                    <span className="sr-only">and</span>
                    <span className="truncate">{targetLabel}</span>
                  </>}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 pointer-events-none transition-opacity group-data-[state=open]:opacity-100 group-data-[state=open]:pointer-events-auto group-hover/ref-header:opacity-100 group-hover/ref-header:pointer-events-auto group-has-[:focus-visible]/ref-header:opacity-100 group-has-[:focus-visible]/ref-header:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto">
              <ControlTooltip label="Focus association on diagram">
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content focus-visible:ring-2 focus-visible:ring-ring"
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
              </ControlTooltip>
              <ControlTooltip label={canRename ? 'Rename association' : 'Associative associations cannot be renamed.'}>
                <button
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring ${canRename ? 'text-base-content/60 hover:bg-base-300 hover:text-base-content' : 'cursor-default text-base-content/25'}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    startEditing()
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  aria-label="Edit association name"
                  aria-disabled={!canRename}
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
              <PanelDeleteButton label="Delete association" onClick={() => onDeleteAssociation?.(edge.id)} />
            </div>
          </div>
        </div>
      </Accordion.Header>
      <Accordion.Content>
        <div className="w-full">
          <div className="rounded-b-md border-b border-base-content/20 px-3 pb-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              {[
                { side: 'A', name: sourceLabel, isAssociation: sourceIsAssociation, multiplicity: selectMultiplicityAValue, role: roleA },
                { side: 'B', name: targetLabel, isAssociation: targetIsAssociation, multiplicity: selectMultiplicityBValue, role: roleB },
              ].map(({ side, name, isAssociation, multiplicity, role }) => (
                <section key={side} aria-label={`Endpoint ${side}: ${name}`} className="min-w-0 space-y-2">
                  <div>
                    <div className="text-[11px] text-base-content/65">{isAssociation ? 'Association' : edge.type === 'associativeAssociation' ? 'Class' : `Class ${side}`}</div>
                    <div className="mt-0.5 truncate text-sm font-medium" title={name}>{name}</div>
                  </div>
                  {canEditMultiplicity && (
                    <div className="space-y-1">
                      <label htmlFor={`${fieldId}-multiplicity-${side}`} className="text-[11px] text-base-content/65">Multiplicity</label>
                      <SelectField
                        id={`${fieldId}-multiplicity-${side}`}
                        aria-label={`Multiplicity ${side} (${name})`}
                        value={multiplicity}
                        items={MULTIPLICITY_OPTIONS}
                        placeholder="Select"
                        onValueChange={value => onUpdateAssociationMultiplicity?.(
                          edge.id, side, value === UNDEFINED_MULTIPLICITY_VALUE ? '' : value,
                        )}
                      />
                    </div>
                  )}
                  {canEditRole && (
                    <div className="space-y-1">
                      <label htmlFor={`${fieldId}-role-${side}`} className="text-[11px] text-base-content/65">Role</label>
                      <Input
                        id={`${fieldId}-role-${side}`}
                        aria-label={`Role ${side} (${name})`}
                        size="xs" value={role} placeholder="Role"
                        onFocus={() => window.dispatchEvent(new CustomEvent('model-text-edit-start'))}
                        onBlur={() => window.dispatchEvent(new CustomEvent('model-text-edit-end'))}
                        onChange={event => onUpdateAssociationRole?.(edge.id, side, event.target.value)}
                      />
                    </div>
                  )}
                </section>
              ))}
            </div>
            {canToggleComposition ? (
              <div className="mt-3">
                <label className="flex items-center gap-2 text-xs">
                  <CheckboxInput
                    checked={isComposition}
                    onCheckedChange={(checked) =>
                      onToggleAssociationComposition?.(
                        edge.id,
                        Boolean(checked),
                      )
                    }
                    onClick={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    aria-label="Toggle composition"
                  />
                  <span>Composite aggregation</span>
                </label>
              </div>
            ) : null}
            {canEditLineStyle ? (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] text-base-content/65">
                  Line style
                </div>
                <div
                  className="grid grid-cols-3 gap-1"
                  role="radiogroup"
                  aria-label="Association style"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={
                      lineStyle === ASSOCIATION_LINE_STYLE_STRAIGHT
                      && !isManualRouting
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
                      lineStyle === ASSOCIATION_LINE_STYLE_ORTHOGONAL
                      && !isManualRouting
                    }
                    className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                      lineStyle === ASSOCIATION_LINE_STYLE_ORTHOGONAL && !isManualRouting
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
            ) : null}
            {canComment ? (
              <div className="mt-3">
                <label htmlFor={`${fieldId}-comment`} className="mb-1.5 block text-[11px] text-base-content/65">
                  Comment
                </label>
                <textarea
                  id={`${fieldId}-comment`}
                  rows={3}
                  className="min-h-16 w-full resize-y rounded-md border border-base-content/20 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Write your comment..."
                  value={comment}
                  onFocus={() =>
                    window.dispatchEvent(new CustomEvent('model-text-edit-start'))
                  }
                  onBlur={() =>
                    window.dispatchEvent(new CustomEvent('model-text-edit-end'))
                  }
                  onChange={(event) =>
                    onUpdateAssociationComment?.(edge.id, event.target.value)
                  }
                />
              </div>
            ) : null}

          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

