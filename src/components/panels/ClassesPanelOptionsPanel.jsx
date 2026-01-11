import { useState } from 'react'
import { CirclePicker } from 'react-color'
import { CLASS_COLOR_PALETTE } from '../../classPalette'

export default function ClassesPanelOptionsPanel({
  accentColor,
  color,
  onChangeColor,
  nodeId,
  onDeleteClass,
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
        <div className="flex flex-1 items-center justify-center pt-2">
          <button
            className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md p-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDeleteClass?.(nodeId)
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-trash2 lucide-trash-2 mr-1 h-3.5 w-3.5 text-red-700"
              aria-hidden="true"
            >
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <div className="text-red-700">Delete</div>
          </button>
        </div>
      </div>
    </div>
  )
}
