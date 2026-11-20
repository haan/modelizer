import { memo } from 'react'
import { Position } from '@xyflow/react'
import { formatAttributeType } from '../../../attributes.js'
import AttributeHandle from '../handles/AttributeHandle.jsx'

function KeyGlyph({ primary }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"
      className={primary ? 'text-(--key-primary)' : 'text-(--key-foreign)'}>
      <g transform="rotate(45 8 8)">
        <path fillRule="evenodd" d="M.8 8a4.4 4.4 0 1 0 8.8 0 4.4 4.4 0 0 0-8.8 0Zm2.5 0a1.9 1.9 0 1 1 3.8 0 1.9 1.9 0 0 1-3.8 0Z" />
        <path d="M8.4 6.8h7v4.6h-2.2V9.1h-1.9v1.5H9.5V9.1H8.4Z" />
      </g>
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
      className="ml-1 inline-flex gap-px align-[-2px]">
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
