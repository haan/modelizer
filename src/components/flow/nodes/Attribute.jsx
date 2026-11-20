import { memo } from 'react'
import { Position } from '@xyflow/react'
import { formatAttributeType } from '../../../attributes.js'
import AttributeHandle from '../handles/AttributeHandle.jsx'

function KeyGlyph({ primary }) {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={primary ? 'text-(--key-primary)' : 'text-(--key-foreign)'}>
      {primary
        ? <circle cx="4.8" cy="11.2" r="3.2" />
        : <path d="m4.8 7.4 3.8 3.8L4.8 15 1 11.2Z" />}
      <path d="m7.1 8.9 6.1-6.1 1.6 1.6 M10.7 5.3l1.6 1.6" />
    </svg>
  )
}

function KeySymbols({ name }) {
  const combined = name.startsWith('pkfk_')
  const primary = combined || name.startsWith('pk_')
  const foreign = combined || name.startsWith('fk_')
  if (!primary && !foreign) return null

  const label = combined ? 'Primary and foreign key' : primary ? 'Primary key' : 'Foreign key'
  return (
    <span role="img" aria-label={label} title={label}
      className="ml-1 inline-flex gap-px align-[-1px]">
      {primary && <KeyGlyph primary />}
      {foreign && <KeyGlyph />}
    </span>
  )
}

function Attribute({
  attributeId,
  name,
  displayName,
  type,
  typeParams,
  showType = true,
  showConstraints = true,
  showDefaultMarker = false,
  showKeySymbols = false,
  nullDisplayMode,
  nullable,
  unique,
  autoIncrement,
  showHandles = false,
  defaultValue,
}) {
  const showNullAsQuestion = nullDisplayMode === 'null-as-question'
  const showNull = nullDisplayMode === 'null'
  const showNotNull = nullDisplayMode === 'not-null'
  const label =
    typeof displayName === 'string'
      ? displayName
      : typeof name === 'string'
        ? name
        : ''
  const hasDefaultValue =
    typeof defaultValue === 'string' ? defaultValue.trim().length > 0 : false
  const displayLabel =
    showDefaultMarker && hasDefaultValue ? `${label}*` : label
  const rawTypeLabel = showType ? formatAttributeType(type, typeParams) : ''
  const typeLabel =
    showNullAsQuestion && nullable && rawTypeLabel
      ? `${rawTypeLabel}?`
      : rawTypeLabel
  const constraints = showConstraints
    ? [
        showNull && nullable ? 'N' : null,
        showNotNull && !nullable ? 'NN' : null,
        unique ? 'UQ' : null,
        autoIncrement ? 'AI' : null,
      ].filter(Boolean)
    : []
  const constraintLabel = constraints.length > 0 ? constraints.join(', ') : ''
  const rowLayout = showType ? 'col-span-full grid grid-cols-subgrid' : 'flex'

  return (
    <li
      className={`relative -mx-3 items-baseline px-3 ${rowLayout}`}
      data-attribute-id={attributeId}
    >
      {showHandles ? (
        <>
          <AttributeHandle
            id={`left-${attributeId}-source`}
            type="source"
            position={Position.Left}
            isActive={showHandles}
            style={{ left: -1 }}
          />
          <AttributeHandle
            id={`right-${attributeId}-source`}
            type="source"
            position={Position.Right}
            isActive={showHandles}
            style={{ right: -1 }}
          />
          <AttributeHandle
            id={`left-${attributeId}-target`}
            type="target"
            position={Position.Left}
            isActive={showHandles}
            style={{ left: -1 }}
          />
          <AttributeHandle
            id={`right-${attributeId}-target`}
            type="target"
            position={Position.Right}
            isActive={showHandles}
            style={{ right: -1 }}
          />
        </>
      ) : null}
      <span className="min-w-0 truncate">
        {displayLabel}{showKeySymbols && <KeySymbols name={label} />}
      </span>
      {showType && <span className="whitespace-nowrap text-xs text-base-content/60">{typeLabel}</span>}
      {showConstraints && <span className="whitespace-nowrap text-[10px] text-base-content/60">{constraintLabel}</span>}
    </li>
  )
}

const compareProps = (prev, next) => {
  if (prev.attributeId !== next.attributeId) {
    return false
  }
  if (prev.name !== next.name || prev.displayName !== next.displayName) {
    return false
  }
  if (
    prev.type !== next.type ||
    prev.showType !== next.showType ||
    prev.showConstraints !== next.showConstraints ||
    prev.showDefaultMarker !== next.showDefaultMarker ||
    prev.showKeySymbols !== next.showKeySymbols ||
    prev.nullDisplayMode !== next.nullDisplayMode ||
    prev.nullable !== next.nullable ||
    prev.unique !== next.unique ||
    prev.autoIncrement !== next.autoIncrement ||
    prev.showHandles !== next.showHandles ||
    prev.defaultValue !== next.defaultValue
  ) {
    return false
  }
  const prevParams = prev.typeParams || {}
  const nextParams = next.typeParams || {}
  return (
    prevParams.maxLength === nextParams.maxLength &&
    prevParams.precision === nextParams.precision &&
    prevParams.scale === nextParams.scale &&
    prevParams.enumValues === nextParams.enumValues
  )
}

export default memo(Attribute, compareProps)
