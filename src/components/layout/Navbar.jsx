import { useRef, useState } from 'react'
import * as Menubar from '@radix-ui/react-menubar'
import Input from '../ui/Input.jsx'

export default function Navbar({
  modelName,
  onRenameModel,
  onNewModel,
  onOpenModel,
  onSaveModel,
  onSaveModelAs,
  onExportPng,
  examples = [],
  onLoadExample,
  showMiniMap,
  showBackground,
  onToggleMiniMap,
  onToggleBackground,
  showAccentColors,
  onToggleAccentColors,
  isDirty,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  const originalNameRef = useRef(modelName ?? '')
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const shortcutPrefix = isMac ? 'Cmd' : 'Ctrl'

  const startEditing = () => {
    originalNameRef.current = modelName ?? ''
    setDraft(modelName ?? '')
    setIsEditing(true)
    queueMicrotask(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const commit = () => {
    setIsEditing(false)
    setDraft('')
  }

  const cancel = () => {
    setIsEditing(false)
    setDraft('')
    onRenameModel?.(originalNameRef.current)
  }

  return (
    <nav className="w-full border-b border-base-content/10 bg-base-100">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-content font-bold">
            M
          </div>
          <div>
            <div className="text-lg font-semibold">Modelizer</div>
            <div className="text-xs opacity-70">
              Database modeling workspace
            </div>
          </div>
          <Menubar.Root className="flex items-center gap-1 bg-base-100 p-1 text-xs">
            <Menubar.Menu>
              <Menubar.Trigger className="rounded-sm px-3 py-1 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200 focus:outline-none">
                File
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content
                  className="z-50 min-w-[140px] rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg"
                  align="start"
                  sideOffset={6}
                >
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onNewModel?.()}
                  >
                    <span>New…</span>
                    <span className="text-[10px] text-base-content/50">
                      {shortcutPrefix}+N
                    </span>
                  </Menubar.Item>
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onOpenModel?.()}
                  >
                    <span>Open…</span>
                    <span className="text-[10px] text-base-content/50">
                      {shortcutPrefix}+O
                    </span>
                  </Menubar.Item>
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onSaveModel?.()}
                  >
                    <span>Save</span>
                    <span className="text-[10px] text-base-content/50">
                      {shortcutPrefix}+S
                    </span>
                  </Menubar.Item>
                  <Menubar.Item
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onSaveModelAs?.()}
                  >
                    Save As…
                  </Menubar.Item>
                  <Menubar.Separator className="my-1 h-px bg-base-content/20" />
                  {examples.length ? (
                    <Menubar.Sub>
                      <Menubar.SubTrigger className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none">
                        Examples
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5 opacity-60"
                          aria-hidden="true"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Menubar.SubTrigger>
                      <Menubar.Portal>
                        <Menubar.SubContent className="z-50 min-w-[160px] rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg">
                          {examples.map((example) => (
                            <Menubar.Item
                              key={example.id}
                              className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                              onSelect={() => onLoadExample?.(example)}
                            >
                              {example.label}
                            </Menubar.Item>
                          ))}
                        </Menubar.SubContent>
                      </Menubar.Portal>
                    </Menubar.Sub>
                  ) : (
                    <Menubar.Item
                      className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content/60 transition-colors hover:bg-base-200 focus:outline-none"
                      onSelect={(event) => event.preventDefault()}
                    >
                      Examples
                    </Menubar.Item>
                  )}
                  <Menubar.Sub>
                    <Menubar.SubTrigger className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none">
                      Export as
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5 opacity-60"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Menubar.SubTrigger>
                    <Menubar.Portal>
                      <Menubar.SubContent className="z-50 min-w-[140px] rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg">
                        <Menubar.Item
                          className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                          onSelect={() => onExportPng?.()}
                        >
                          PNG
                        </Menubar.Item>
                      </Menubar.SubContent>
                    </Menubar.Portal>
                  </Menubar.Sub>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
              <Menubar.Trigger className="rounded-sm px-3 py-1 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200 focus:outline-none">
                View
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content
                  className="z-50 min-w-[180px] rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg"
                  align="start"
                  sideOffset={6}
                >
                  <Menubar.Item
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onToggleMiniMap?.()}
                  >
                    {showMiniMap ? 'Hide' : 'Show'} Mini Map
                  </Menubar.Item>
                  <Menubar.Item
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onToggleBackground?.()}
                  >
                    {showBackground ? 'Hide' : 'Show'} Background
                  </Menubar.Item>
                  <Menubar.Item
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onToggleAccentColors?.()}
                  >
                    {showAccentColors ? 'Hide' : 'Show'} Accent Colors
                  </Menubar.Item>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
          </Menubar.Root>
        </div>
        <div className="group flex items-center justify-center gap-2">
          {isEditing ? (
            <Input
              ref={inputRef}
              size="sm"
              className="max-w-[240px] text-center font-semibold"
              value={draft}
              placeholder="Model name"
              onChange={(event) => {
                const nextValue = event.target.value
                setDraft(nextValue)
                onRenameModel?.(nextValue)
              }}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commit()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancel()
                }
              }}
            />
          ) : (
            <>
              <span className="text-md font-semibold">
                {modelName || 'Untitled model'}
                {isDirty ? (
                  <span className="ml-1 text-primary">*</span>
                ) : null}
              </span>
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 opacity-0 transition-opacity hover:bg-base-200 hover:text-base-content group-hover:opacity-100"
                onClick={startEditing}
                aria-label="Edit model name"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-2" />
      </div>
    </nav>
  )
}
