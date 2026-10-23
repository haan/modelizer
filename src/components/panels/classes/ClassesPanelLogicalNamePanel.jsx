import { useId } from 'react'
import Input from '../../ui/Input.jsx'

export default function ClassesPanelLogicalNamePanel({
  accentColor,
  showAccentColors = true,
  logicalName,
  onChange,
}) {
  const inputId = useId()
  const accentBorderColor = showAccentColors ? accentColor : 'transparent'

  return (
    <div className="w-full">
      <div
        className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2 border-l-[6px] px-2 py-1.5 text-xs"
        style={{ borderColor: accentBorderColor }}
      >
        <label htmlFor={inputId} className="text-[11px] text-base-content/65">
          Logical name
        </label>
        <div className="min-w-0">
          <Input
            id={inputId}
            size="xs"
            className="w-full"
            value={logicalName ?? ''}
            placeholder="Logical name"
            onFocus={() =>
              window.dispatchEvent(new CustomEvent('model-text-edit-start'))
            }
            onBlur={() =>
              window.dispatchEvent(new CustomEvent('model-text-edit-end'))
            }
            onChange={(event) => onChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') {
                return
              }
              event.preventDefault()
              event.stopPropagation()
              event.currentTarget.blur()
            }}
          />
        </div>
      </div>
    </div>
  )
}
