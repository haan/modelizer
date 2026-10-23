import { useRef, useState } from 'react'
import * as Menubar from '@radix-ui/react-menubar'
import { CheckIcon, DotFilledIcon } from '@radix-ui/react-icons'
import Input from '../ui/Input.jsx'
import ControlTooltip from '../ui/ControlTooltip.jsx'
import { HelpDialog } from '../dialogs/HelpDialog.jsx'

const menuTriggerClass =
  'shrink-0 rounded-md px-2.5 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200 data-[highlighted]:bg-base-200 data-[state=open]:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary'

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
      <div className="flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 xl:grid xl:grid-cols-[1fr_minmax(0,20rem)_1fr] xl:gap-x-4 2xl:grid-cols-[1fr_minmax(0,28rem)_1fr]">
        <div className="flex min-w-0 max-w-full items-center gap-3 xl:min-w-max">
          <div className="-ml-4 flex shrink-0 items-center">
            {/* Match the sidebar's 4rem content width and 1px divider. */}
            <div className="box-content flex w-16 shrink-0 items-center justify-center border-r border-transparent">
              <img
                src="/images/logo.svg"
                alt=""
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="modelizer-wordmark hidden shrink-0 text-lg sm:block">Modelizer</div>
          </div>
          <Menubar.Root aria-label="Main menu" className="flex min-w-0 items-center gap-0.5 overflow-x-auto bg-base-100 text-xs">
            <Menubar.Menu>
              <Menubar.Trigger className={menuTriggerClass}>
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
              <Menubar.Trigger className={menuTriggerClass}>
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
              <Menubar.Trigger className={menuTriggerClass}>View</Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content className="z-50 min-w-[220px] max-h-[var(--radix-menubar-content-available-height)] overflow-y-auto rounded-md border border-base-content/20 bg-base-100 p-1 shadow-lg" align="start" sideOffset={6}>
                  <Menubar.Label className="px-2 pb-1 pt-2 text-xs font-medium text-base-content/70">Diagram content</Menubar.Label>
                  <MenuCheckbox checked={showNotes} onCheckedChange={onToggleNotes}>
                    Notes
                  </MenuCheckbox>
                  <MenuCheckbox checked={showAreas} onCheckedChange={onToggleAreas}>
                    Areas
                  </MenuCheckbox>
                  <MenuCheckbox checked={showAnnotations} onCheckedChange={onToggleAnnotations}>
                    Annotations
                  </MenuCheckbox>
                  <Menubar.Separator className="my-1 h-px bg-base-content/15" />
                  <Menubar.Label className="px-2 pb-1 pt-2 text-xs font-medium text-base-content/70">Notation</Menubar.Label>
                  <MenuCheckbox checked={showConceptualOperationsCompartment} onCheckedChange={onToggleConceptualOperationsCompartment}>
                    Operations compartment
                  </MenuCheckbox>
                  <Menubar.Sub>
                    <Menubar.SubTrigger className={`flex items-center justify-between gap-4 ${choiceItemClass}`}>
                      Nullability notation
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
                  <Menubar.Separator className="my-1 h-px bg-base-content/15" />
                  <Menubar.Label className="px-2 pb-1 pt-2 text-xs font-medium text-base-content/70">Canvas</Menubar.Label>
                  <MenuCheckbox checked={showBackground} onCheckedChange={onToggleBackground}>
                    Background grid
                  </MenuCheckbox>
                  <MenuCheckbox checked={showAccentColors} onCheckedChange={onToggleAccentColors}>
                    Accent colors
                  </MenuCheckbox>
                  <MenuCheckbox checked={showFullscreen} onCheckedChange={onToggleFullscreen}>
                    Fullscreen
                  </MenuCheckbox>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
              <Menubar.Trigger className={menuTriggerClass}>Preferences</Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content className="z-50 min-w-[220px] max-h-[var(--radix-menubar-content-available-height)] overflow-y-auto rounded-md border border-base-content/20 bg-base-100 p-1 shadow-lg" align="start" sideOffset={6}>
                  <Menubar.Label className="px-2 pb-1 pt-2 text-xs font-medium text-base-content/70">Appearance</Menubar.Label>
                  <MenuCheckbox checked={theme === 'dark'} onCheckedChange={onToggleTheme}>
                    Dark mode
                  </MenuCheckbox>
                  <Menubar.Separator className="my-1 h-px bg-base-content/15" />
                  <Menubar.Label className="px-2 pb-1 pt-2 text-xs font-medium text-base-content/70">Modeling</Menubar.Label>
                  <MenuCheckbox checked={showCompositionAggregation} onCheckedChange={onToggleCompositionAggregation}>
                    Enable composite aggregation
                  </MenuCheckbox>
                  <Menubar.Separator className="my-1 h-px bg-base-content/15" />
                  <Menubar.Label className="px-2 pb-1 pt-2 text-xs font-medium text-base-content/70">Editing</Menubar.Label>
                  <MenuCheckbox checked={confirmDelete} onCheckedChange={onToggleConfirmDelete}>
                    Confirm before deleting
                  </MenuCheckbox>
                  <MenuCheckbox checked={viewSpecificSettingsOnly} onCheckedChange={onToggleViewSpecificSettingsOnly}>
                    Only show fields for current view
                  </MenuCheckbox>
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
              <Menubar.Trigger
                className={menuTriggerClass}
                onClick={() => setIsHelpOpen(true)}
              >
                Help
              </Menubar.Trigger>
            </Menubar.Menu>
          </Menubar.Root>
        </div>
        <div className="group ml-auto flex min-w-0 flex-1 basis-48 items-center justify-center gap-1 xl:col-start-2 xl:ml-0 xl:w-full">
          {isEditing ? (
            <Input
              ref={inputRef}
              size="sm"
              className="text-center text-base font-semibold"
              aria-label="Model name"
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
              <span className="min-w-0 truncate text-base font-semibold" title={modelName || 'Untitled model'}>
                {modelName || 'Untitled model'}
              </span>
              {isDirty && <span className="shrink-0 font-semibold text-primary" aria-label="Unsaved changes" title="Unsaved changes">*</span>}
              <ControlTooltip label="Rename model">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content focus-visible:outline-2 focus-visible:outline-primary"
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
              </ControlTooltip>
            </>
          )}
        </div>
      </div>
      <HelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </nav>
  )
}
