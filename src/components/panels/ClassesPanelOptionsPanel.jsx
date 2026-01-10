import { useState } from 'react'
import { CirclePicker } from 'react-color'
import { CLASS_COLOR_PALETTE } from '../../classPalette'

export default function ClassesPanelOptionsPanel({
  accentColor,
  color,
  onChangeColor,
  nodeId,
}) {
  const currentColor = color ?? accentColor
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  return (
    <div className="w-full rounded-l-md border-b border-base-content/20">
      <div
        className="border-l-[6px] px-2 py-2 text-xs rounded-bl-md"
        style={{ borderColor: accentColor }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Options
          </span>
        </div>
        <div className="relative mt-2">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:ring-2 hover:ring-base-content/30 hover:ring-offset-2 hover:ring-offset-base-100"
            onClick={(event) => {
              event.stopPropagation()
              setIsPickerOpen((open) => !open)
            }}
            onMouseDown={(event) => event.stopPropagation()}
            aria-haspopup="dialog"
            aria-expanded={isPickerOpen}
            aria-label="Choose class color"
            style={{ backgroundColor: currentColor }}
          >
            <span className="sr-only">Choose class color</span>
          </button>
          {isPickerOpen ? (
            <div className="absolute right-0 top-10 z-20">
              <button
                type="button"
                className="fixed inset-0 h-full w-full cursor-default"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsPickerOpen(false)
                }}
                aria-hidden="true"
                tabIndex={-1}
              />
              <div className="relative rounded-lg border border-base-content/20 bg-base-100 p-2 shadow-xl">
                <CirclePicker
                  color={currentColor}
                  colors={CLASS_COLOR_PALETTE}
                  circleSize={22}
                  circleSpacing={10}
                  onChange={(nextColor) =>
                    onChangeColor?.(nodeId, nextColor.hex)
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
