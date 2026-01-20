import { NodeResizer } from 'reactflow'
import { CLASS_COLOR_PALETTE } from '../../classPalette.js'

const withAlpha = (hex, alpha) => {
  if (typeof hex !== 'string' || !hex.startsWith('#')) {
    return hex
  }
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex
  if (normalized.length !== 7) {
    return hex
  }
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function Area({ data, selected }) {
  const color = data?.color ?? CLASS_COLOR_PALETTE[0]
  const label = typeof data?.label === 'string' ? data.label : ''

  return (
    <div
      className="relative h-full w-full rounded-md border shadow-sm"
      style={{
        borderColor: color,
        backgroundColor: withAlpha(color, 0.16),
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={140}
        handleStyle={{
          backgroundColor: color,
          border: 'none',
          width: 10,
          height: 10,
        }}
        lineStyle={{ borderColor: color }}
      />
      <div className="absolute left-2 top-1 text-xs font-semibold text-base-content">
        {label || 'Untitled area'}
      </div>
    </div>
  )
}
