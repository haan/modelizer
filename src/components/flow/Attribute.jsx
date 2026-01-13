import { formatAttributeType } from '../../attributes.js'

export default function Attribute({
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
    <li className="table-row">
      <span className="table-cell w-full min-w-0 truncate pr-2 align-middle">
        {label}
      </span>
      <span className="table-cell whitespace-nowrap pr-2 text-[11px] text-base-content/60 align-middle">
        {typeLabel}
      </span>
      <span className="table-cell whitespace-nowrap text-right text-[10px] text-base-content/60 align-middle">
        {constraints.length > 0 ? constraints.join(', ') : ''}
      </span>
    </li>
  )
}
