import CheckboxInput from '../../ui/Checkbox.jsx'

export default function ClassesPanelVisibilityPanel({
  accentColor,
  showAccentColors = true,
  classVisibility,
  onUpdateClassVisibility,
}) {
  const accentBorderColor = showAccentColors ? accentColor : 'transparent'
  const classViewVisibility = classVisibility ?? {}
  const isClassConceptual =
    typeof classViewVisibility.conceptual === 'boolean'
      ? classViewVisibility.conceptual
      : true
  const isClassLogical =
    typeof classViewVisibility.logical === 'boolean'
      ? classViewVisibility.logical
      : true
  return (
    <div className="w-full">
      <div
        className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2 border-l-[6px] px-2 py-1.5 text-xs"
        style={{ borderColor: accentBorderColor }}
      >
        <div className="text-[11px] text-base-content/65">
          Visibility
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px]">
          <label className="flex items-center gap-2">
            <CheckboxInput
              checked={isClassConceptual}
              onCheckedChange={(value) =>
                onUpdateClassVisibility?.({
                  conceptual: Boolean(value),
                })
              }
            />
            <span>Conceptual</span>
          </label>
          <label className="flex items-center gap-2">
            <CheckboxInput
              checked={isClassLogical}
              onCheckedChange={(value) =>
                onUpdateClassVisibility?.({
                  logical: Boolean(value),
                  physical: Boolean(value),
                })
              }
            />
            <span>Logical/Physical</span>
          </label>
        </div>
      </div>
    </div>
  )
}

