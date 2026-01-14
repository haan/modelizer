import { memo } from 'react'
import { Position } from 'reactflow'
import { formatAttributeType } from '../../attributes.js'
import AttributeHandle from './AttributeHandle.jsx'

function Attribute({
  attributeId,
  name,
  displayName,
  type,
  typeParams,
  showType = true,
  showConstraints = true,
  alternateNNDisplay,
  nullable,
  unique,
  autoIncrement,
  showHandles = false,
}) {
  const label =
    typeof displayName === 'string'
      ? displayName
      : typeof name === 'string'
        ? name
        : ''
  const rawTypeLabel = showType ? formatAttributeType(type, typeParams) : ''
  const typeLabel =
    alternateNNDisplay && !nullable && rawTypeLabel
      ? `${rawTypeLabel}?`
      : rawTypeLabel
  const constraints = showConstraints
    ? [
        !nullable && !alternateNNDisplay ? 'NN' : null,
        unique ? 'UQ' : null,
        autoIncrement ? 'AI' : null,
      ].filter(Boolean)
    : []

  return (
    <li className="relative -mx-3 flex items-center gap-2 px-3">
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
      <span className="min-w-0 flex-1 truncate">
        {label}
      </span>
      <span className="shrink-0 whitespace-nowrap pr-2 text-[11px] text-base-content/60">
        {typeLabel}
      </span>
      <span className="shrink-0 whitespace-nowrap text-right text-[10px] text-base-content/60">
        {constraints.length > 0 ? constraints.join(', ') : ''}
      </span>
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
    prev.alternateNNDisplay !== next.alternateNNDisplay ||
    prev.nullable !== next.nullable ||
    prev.unique !== next.unique ||
    prev.autoIncrement !== next.autoIncrement ||
    prev.showHandles !== next.showHandles
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
