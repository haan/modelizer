import { useEffect, useId, useRef } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ControlTooltip from '../../ui/ControlTooltip.jsx'
import PanelDeleteButton from '../../ui/PanelDeleteButton.jsx'
import Input from '../../ui/Input.jsx'
import SelectField from '../../ui/Select.jsx'
import CheckboxInput from '../../ui/Checkbox.jsx'
import { ATTRIBUTE_TYPE_OPTIONS, ATTRIBUTE_TYPE_PARAMS_DEFAULT, ATTRIBUTE_TYPE_UNDEFINED, getTypeParamKind, formatAttributeType } from '../../../attributes.js'
import { normalizeVisibility } from '../../../model/viewUtils.js'
import { VIEW_CONCEPTUAL, VIEW_PHYSICAL } from '../../../model/constants.js'

function Field({ label, id, children }) {
  return <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2">
    {id ? <label htmlFor={id} className="text-[11px] text-base-content/65">{label}</label> : <span className="text-[11px] text-base-content/65">{label}</span>}
    <div className="min-w-0">{children}</div>
  </div>
}

function Constraint({ label, description, pressed, onClick }) {
  return <ControlTooltip label={description}>
    <button type="button" aria-label={description} aria-pressed={pressed}
      className="inline-flex h-7 items-center justify-center rounded-md border border-base-content/15 px-2 text-[11px] text-base-content/65 transition-colors hover:bg-base-200 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary-label focus-visible:ring-2 focus-visible:ring-ring"
      onClick={event => { event.stopPropagation(); onClick?.() }}>{label}</button>
  </ControlTooltip>
}

export default function ClassesPanelAttributesItem({
  id, name, logicalName, type, typeParams, defaultValue, nullable, unique, autoIncrement,
  visibility, activeView, viewSpecificSettingsOnly, attributeNoun = 'attribute', isOpen = false,
  shouldAutoEditName = false, onAutoEditNameConsumed, onChangeName, onChangeLogicalName,
  onChangeType, onChangeTypeParams, onChangeDefaultValue, onToggleNullable, onToggleUnique,
  onToggleAutoIncrement, onChangeVisibility, onDelete,
}) {
  const { attributes: sortableAttributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const nameInputRef = useRef(null)
  const fieldId = useId()
  const typeValue = ATTRIBUTE_TYPE_OPTIONS.some(option => option.value === type) ? type : ''
  const selectTypeValue = typeValue || ATTRIBUTE_TYPE_UNDEFINED
  const params = typeParams ?? ATTRIBUTE_TYPE_PARAMS_DEFAULT
  const typeParamKind = getTypeParamKind(typeValue)
  const visibilityState = normalizeVisibility(visibility)
  const hideAttributeDetails = viewSpecificSettingsOnly && activeView !== VIEW_PHYSICAL
  const hideLogicalName = viewSpecificSettingsOnly && activeView === VIEW_CONCEPTUAL
  const attributeNameLabel = attributeNoun.charAt(0).toUpperCase() + attributeNoun.slice(1)
  const summary = formatAttributeType(typeValue, params)

  useEffect(() => {
    if (!shouldAutoEditName) return
    const frame = requestAnimationFrame(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
      onAutoEditNameConsumed?.()
    })
    return () => cancelAnimationFrame(frame)
  }, [onAutoEditNameConsumed, shouldAutoEditName])

  return <li ref={setNodeRef} style={style} className={`rounded-md border-b border-base-content/10 px-1 py-0.5 text-xs transition-colors ${isDragging ? 'opacity-60' : ''}`}>
    <Accordion.Item value={id} className="group/attribute">
      <Accordion.Header asChild>
        <div className="flex items-center gap-1 rounded-md px-1 py-1">
          <Accordion.Trigger asChild>
            <button type="button" aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${attributeNoun}`} aria-expanded={isOpen}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-base-content/60 hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 opacity-60 transition-transform group-data-[state=open]/attribute:rotate-90" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </Accordion.Trigger>
          <button ref={setActivatorNodeRef} type="button" aria-label={`Reorder ${attributeNoun}`} {...sortableAttributes} {...listeners}
            className="inline-flex h-5 w-5 shrink-0 cursor-grab items-center justify-center rounded-md text-subtle hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
            onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true">
              <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
            </svg>
          </button>
          <Input ref={nameInputRef} size="xs" className="min-w-0 flex-1" value={name ?? ''} placeholder={attributeNameLabel} aria-label={`${attributeNameLabel} name`}
            onFocus={() => window.dispatchEvent(new CustomEvent('model-text-edit-start'))}
            onBlur={() => window.dispatchEvent(new CustomEvent('model-text-edit-end'))}
            onChange={event => onChangeName?.(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); event.currentTarget.blur() } }}
            onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} />
          {!isOpen && !hideAttributeDetails && <span className="w-16 shrink-0 truncate text-[10px] text-base-content/55" title={summary}>{summary}</span>}
          <PanelDeleteButton label={`Delete ${attributeNoun}`} onClick={onDelete} />
        </div>
      </Accordion.Header>
      <Accordion.Content className="space-y-2 px-1 pb-3 pt-2 text-xs">
        <Field label="Visibility">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px]">
            <label className="flex items-center gap-1.5"><CheckboxInput checked={visibilityState.conceptual} onCheckedChange={value => onChangeVisibility?.({ conceptual: Boolean(value) })} /><span>Conceptual</span></label>
            <label className="flex items-center gap-1.5"><CheckboxInput checked={visibilityState.logical} onCheckedChange={value => onChangeVisibility?.({ logical: Boolean(value), physical: Boolean(value) })} /><span>Logical/Physical</span></label>
          </div>
        </Field>
        {!hideLogicalName && <Field label="Logical name" id={fieldId + '-logical'}>
          <Input id={fieldId + '-logical'} size="xs" value={logicalName ?? ''} placeholder="Logical name"
            onFocus={() => window.dispatchEvent(new CustomEvent('model-text-edit-start'))}
            onBlur={() => window.dispatchEvent(new CustomEvent('model-text-edit-end'))}
            onChange={event => onChangeLogicalName?.(event.target.value)} />
        </Field>}
        {!hideAttributeDetails && <>
          <Field label="Constraints"><div className="flex flex-wrap gap-1">
            <Constraint label="Null" description="Allow null values" pressed={Boolean(nullable)} onClick={onToggleNullable} />
            <Constraint label="Unique" description="Require unique values" pressed={Boolean(unique)} onClick={onToggleUnique} />
            <Constraint label="Auto" description="Auto increment" pressed={Boolean(autoIncrement)} onClick={onToggleAutoIncrement} />
          </div></Field>
          <Field label="Type" id={fieldId + '-type'}><SelectField id={fieldId + '-type'} value={selectTypeValue} items={ATTRIBUTE_TYPE_OPTIONS} placeholder="Select type" onValueChange={value => onChangeType?.(value === ATTRIBUTE_TYPE_UNDEFINED ? '' : value)} /></Field>
          {typeParamKind === 'length' && <Field label="Max length" id={fieldId + '-length'}><Input id={fieldId + '-length'} size="xs" value={params.maxLength} placeholder="Length" onChange={event => onChangeTypeParams?.({ maxLength: event.target.value })} /></Field>}
          {typeParamKind === 'precisionScale' && <>
            <Field label="Precision" id={fieldId + '-precision'}><Input id={fieldId + '-precision'} size="xs" value={params.precision} placeholder="Precision" onChange={event => onChangeTypeParams?.({ precision: event.target.value })} /></Field>
            <Field label="Scale" id={fieldId + '-scale'}><Input id={fieldId + '-scale'} size="xs" value={params.scale} placeholder="Scale" onChange={event => onChangeTypeParams?.({ scale: event.target.value })} /></Field>
          </>}
          {typeParamKind === 'enum' && <Field label="Enumeration" id={fieldId + '-enum'}><Input id={fieldId + '-enum'} size="xs" value={params.enumValues} placeholder="A, B, C" onChange={event => onChangeTypeParams?.({ enumValues: event.target.value })} /></Field>}
          {selectTypeValue !== ATTRIBUTE_TYPE_UNDEFINED && <Field label="Default value" id={fieldId + '-default'}><Input id={fieldId + '-default'} size="xs" value={defaultValue ?? ''} placeholder="Default" onChange={event => onChangeDefaultValue?.(event.target.value)} /></Field>}
        </>}
      </Accordion.Content>
    </Accordion.Item>
  </li>
}
