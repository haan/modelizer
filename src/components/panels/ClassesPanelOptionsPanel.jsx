import { useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
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
    <div className="w-full rounded-b-md border-b border-base-content/20">
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
          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <button
                className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md p-2 text-xs font-medium transition-colors hover:bg-base-300 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                type="button"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
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
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
              <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-xl">
                <AlertDialog.Title className="text-sm font-semibold">
                  Delete class?
                </AlertDialog.Title>
                <AlertDialog.Description className="mt-2 text-xs text-base-content/70">
                  This removes the class and any connected associations. This
                  action cannot be undone.
                </AlertDialog.Description>
                <div className="mt-4 flex justify-end gap-2">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      className="inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium text-base-content/70 transition-colors hover:bg-base-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      className="inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium text-red-700 transition-colors hover:bg-base-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onClick={() => onDeleteClass?.(nodeId)}
                    >
                      Delete
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </div>
    </div>
  )
}
