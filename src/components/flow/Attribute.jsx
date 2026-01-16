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
  nullDisplayMode,
  nullable,
  unique,
  autoIncrement,
  showHandles = false,
  columnTemplate,
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
  const useGridLayout = Boolean(columnTemplate)
  const rowClassName = useGridLayout
    ? 'grid w-full items-center gap-2'
    : 'flex w-full items-center gap-2'
  const rowStyle = useGridLayout ? { gridTemplateColumns: columnTemplate } : undefined

  return (
    <li className="relative -mx-3 px-3">
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
      <div className={rowClassName} style={rowStyle}>
        <span className="min-w-0 truncate">{label}</span>
        {showType ? (
          <span className="shrink-0 whitespace-nowrap text-xs text-base-content/60">
            {typeLabel}
          </span>
        ) : null}
        {showConstraints ? (
          <span className="shrink-0 whitespace-nowrap text-[10px] text-base-content/60">
            {constraintLabel}
          </span>
        ) : null}
      </div>
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
    prev.nullDisplayMode !== next.nullDisplayMode ||
    prev.nullable !== next.nullable ||
    prev.unique !== next.unique ||
    prev.autoIncrement !== next.autoIncrement ||
    prev.showHandles !== next.showHandles ||
    prev.columnTemplate !== next.columnTemplate
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
