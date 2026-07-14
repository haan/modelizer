import Input from '../../ui/Input.jsx'

export default function ClassesPanelLogicalNamePanel({
  accentColor,
  showAccentColors = true,
  logicalName,
  onChange,
}) {
  const accentBorderColor = showAccentColors ? accentColor : 'transparent'

  return (
    <div className="w-full">
      <div
        className="border-l-[6px] px-2 py-2 text-xs"
        style={{ borderColor: accentBorderColor }}
      >
        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
          Logical name
        </div>
        <div className="mt-2">
          <Input
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
