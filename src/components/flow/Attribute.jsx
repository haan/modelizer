import { formatAttributeType } from '../../attributes.js'

export default function Attribute({
  name,
  type,
  typeParams,
  alternateNNDisplay,
  nullable,
  unique,
  autoIncrement,
}) {
  const label = typeof name === 'string' ? name : ''
  const rawTypeLabel = formatAttributeType(type, typeParams)
  const typeLabel =
    alternateNNDisplay && !nullable && rawTypeLabel
      ? `${rawTypeLabel}?`
      : rawTypeLabel
  const constraints = [
    !nullable && !alternateNNDisplay ? 'NN' : null,
    unique ? 'U' : null,
    autoIncrement ? 'AI' : null,
  ].filter(Boolean)

  return (
    <li className="flex items-center justify-between gap-2">
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex items-center gap-2 text-[11px] text-base-content/60">
        {typeLabel ? <span className="truncate">{typeLabel}</span> : null}
        {constraints.length > 0 ? (
          <span className="text-[10px]">
            {constraints.join(', ')}
          </span>
        ) : null}
      </span>
    </li>
  )
}
