import { useRef, useState } from 'react'
import * as Menubar from '@radix-ui/react-menubar'
import { CheckIcon, DotFilledIcon } from '@radix-ui/react-icons'
import Input from '../ui/Input.jsx'
import { HelpDialog } from '../dialogs/HelpDialog.jsx'

const choiceItemClass =
  'relative cursor-pointer rounded-sm py-1 pl-6 pr-2 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none'
const indicatorClass =
  'absolute inset-y-0 left-1.5 flex w-3.5 items-center justify-center'

function MenuCheckbox({ checked, onCheckedChange, children }) {
  return (
    <Menubar.CheckboxItem
      className={choiceItemClass}
      checked={Boolean(checked)}
      onCheckedChange={onCheckedChange}
    >
      <Menubar.ItemIndicator className={indicatorClass}>
        <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </Menubar.ItemIndicator>
      {children}
    </Menubar.CheckboxItem>
  )
}

export default function Navbar({
  theme = 'light',
  onToggleTheme,
  modelName,
  onRenameModel,
  onNewModel,
  onOpenModel,
  onSaveModel,
  onSaveModelAs,
  onImportJavaModelizer,
  onImportMySql,
  onExportPng,
  showBackground,
  onToggleBackground,
  showAccentColors,
  onToggleAccentColors,
  showConceptualOperationsCompartment,
  onToggleConceptualOperationsCompartment,
  showFullscreen,
  onToggleFullscreen,
  showCompositionAggregation,
  onToggleCompositionAggregation,
  showNotes,
  onToggleNotes,
  showAreas,
  onToggleAreas,
  showAnnotations,
  onToggleAnnotations,
  viewSpecificSettingsOnly,
  onToggleViewSpecificSettingsOnly,
  nullDisplayMode,
  onNullDisplayModeChange,
  confirmDelete,
  onToggleConfirmDelete,
  isDirty,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
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
    window.dispatchEvent(new CustomEvent('model-text-edit-start'))
    queueMicrotask(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const commit = () => {
    setIsEditing(false)
    setDraft('')
    window.dispatchEvent(new CustomEvent('model-text-edit-end'))
  }

  const cancel = () => {
    setIsEditing(false)
    setDraft('')
    onRenameModel?.(originalNameRef.current)
    window.dispatchEvent(new CustomEvent('model-text-edit-end'))
  }

  return (
    <nav className="w-full border-b border-base-content/10 bg-base-100">
      <div className="relative mx-auto flex max-w-screen-2xl items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <img
            src="/images/logo.svg"
            alt="Modelizer"
            className="h-10 w-10 object-contain"
          />
          <div>
            <div className="text-lg font-semibold">Modelizer</div>
            <div className="text-xs opacity-70">
              Database modeling tool
            </div>
          </div>
          <Menubar.Root className="flex items-center gap-1 bg-base-100 p-1 text-xs">
            <Menubar.Menu>
              <Menubar.Trigger className="rounded-sm px-3 py-1 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none">
                File
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content
                  className="z-50 min-w-[140px] rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg"
                  align="start"
                  sideOffset={6}
                >
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                    onSelect={() => onNewModel?.()}
                  >
                    <span>New…</span>
                    <span className="text-[10px] text-subtle">
                      {shortcutPrefix}+N
                    </span>
                  </Menubar.Item>
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                    onSelect={() => onOpenModel?.()}
                  >
                    <span>Open…</span>
                    <span className="text-[10px] text-subtle">
                      {shortcutPrefix}+O
                    </span>
                  </Menubar.Item>
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                    onSelect={() => onSaveModel?.()}
                  >
                    <span>Save</span>
                    <span className="text-[10px] text-subtle">
                      {shortcutPrefix}+S
                    </span>
                  </Menubar.Item>
                  <Menubar.Item
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                    onSelect={() => onSaveModelAs?.()}
                  >
                    Save As…
                  </Menubar.Item>
                  <Menubar.Separator className="my-1 h-px bg-base-content/20" />
                  <Menubar.Sub>
                    <Menubar.SubTrigger className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none">
                      Import
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
                        <Menubar.Item
                          className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                          onSelect={() => onImportJavaModelizer?.()}
                        >
                          Java Modelizer
                        </Menubar.Item>
                        <Menubar.Item
                          className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                          onSelect={() => onImportMySql?.()}
                        >
                          MySQL
                        </Menubar.Item>
                      </Menubar.SubContent>
                    </Menubar.Portal>
                  </Menubar.Sub>
                  <Menubar.Item
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                    onSelect={() => onExportPng?.()}
                  >
                    Export PNG…
                  </Menubar.Item>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
              <Menubar.Trigger className="rounded-sm px-3 py-1 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none">
                Edit
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content
                  className="z-50 min-w-35 rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg"
                  align="start"
                  sideOffset={6}
                >
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none data-disabled:pointer-events-none data-disabled:opacity-40"
                    onSelect={() => onUndo?.()}
                    disabled={!canUndo}
                  >
                    <span>Undo</span>
                    <span className="text-[10px] text-subtle">
                      {shortcutPrefix}+Z
                    </span>
                  </Menubar.Item>
                  <Menubar.Item
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none data-disabled:pointer-events-none data-disabled:opacity-40"
                    onSelect={() => onRedo?.()}
                    disabled={!canRedo}
                  >
                    <span>Redo</span>
                    <span className="text-[10px] text-subtle">
                      {shortcutPrefix}+Y
                    </span>
                  </Menubar.Item>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
              <Menubar.Trigger className="rounded-sm px-3 py-1 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none">
                Settings
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content
                  className="z-50 min-w-[180px] rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg"
                  align="start"
                  sideOffset={6}
                >
                  <MenuCheckbox checked={showCompositionAggregation} onCheckedChange={onToggleCompositionAggregation}>
                    Composite aggregation
                  </MenuCheckbox>
                  <MenuCheckbox checked={showConceptualOperationsCompartment} onCheckedChange={onToggleConceptualOperationsCompartment}>
                    Operations compartment
                  </MenuCheckbox>
                  <Menubar.Separator className="my-1 h-px bg-base-content/20" />
                  <MenuCheckbox checked={showNotes} onCheckedChange={onToggleNotes}>
                    Notes
                  </MenuCheckbox>
                  <MenuCheckbox checked={showAreas} onCheckedChange={onToggleAreas}>
                    Areas
                  </MenuCheckbox>
                  <MenuCheckbox checked={showAnnotations} onCheckedChange={onToggleAnnotations}>
                    Annotations
                  </MenuCheckbox>
                  <Menubar.Separator className="my-1 h-px bg-base-content/20" />
                  <MenuCheckbox checked={confirmDelete} onCheckedChange={onToggleConfirmDelete}>
                    Confirmation dialogs
                  </MenuCheckbox>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
              <Menubar.Trigger className="rounded-sm px-3 py-1 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none">
                View
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content
                  className="z-50 min-w-[180px] rounded-sm border border-base-content/20 bg-base-100 p-1 shadow-lg"
                  align="start"
                  sideOffset={6}
                >
                  <MenuCheckbox checked={theme === 'dark'} onCheckedChange={onToggleTheme}>
                    Dark mode
                  </MenuCheckbox>
                  <Menubar.Separator className="my-1 h-px bg-base-content/20" />
                  <MenuCheckbox checked={showBackground} onCheckedChange={onToggleBackground}>
                    Background grid
                  </MenuCheckbox>
                  <MenuCheckbox checked={showAccentColors} onCheckedChange={onToggleAccentColors}>
                    Accent colors
                  </MenuCheckbox>
                  <MenuCheckbox checked={showFullscreen} onCheckedChange={onToggleFullscreen}>
                    Fullscreen
                  </MenuCheckbox>
                  <MenuCheckbox checked={viewSpecificSettingsOnly} onCheckedChange={onToggleViewSpecificSettingsOnly}>
                    View-specific settings only
                  </MenuCheckbox>
                  <Menubar.Separator className="my-1 h-px bg-base-content/20" />
                  <Menubar.Sub>
                    <Menubar.SubTrigger className={`flex items-center justify-between gap-4 ${choiceItemClass}`}>
                      Constraints
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
                        <Menubar.RadioGroup value={nullDisplayMode} onValueChange={onNullDisplayModeChange}>
                          {[
                            ['null', 'Null'],
                            ['not-null', 'Not Null'],
                            ['null-as-question', 'Null as ?'],
                          ].map(([value, label]) => (
                            <Menubar.RadioItem key={value} value={value} className={choiceItemClass}>
                              <Menubar.ItemIndicator className={indicatorClass}>
                                <DotFilledIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              </Menubar.ItemIndicator>
                              {label}
                            </Menubar.RadioItem>
                          ))}
                        </Menubar.RadioGroup>
                      </Menubar.SubContent>
                    </Menubar.Portal>
                  </Menubar.Sub>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
              <Menubar.Trigger
                className="rounded-sm px-3 py-1 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 focus:outline-none"
                onClick={() => setIsHelpOpen(true)}
              >
                Help
              </Menubar.Trigger>
            </Menubar.Menu>
          </Menubar.Root>
        </div>
        <div className="group ml-auto flex items-center justify-end gap-2 xl:absolute xl:left-1/2 xl:ml-0 xl:-translate-x-1/2 xl:justify-center">
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
      </div>
      <HelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </nav>
  )
}
