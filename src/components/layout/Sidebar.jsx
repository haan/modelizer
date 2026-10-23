import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../model/constants.js'
import * as Tooltip from '@radix-ui/react-tooltip'

const SIDEBAR_TOOLTIP_CLASS =
  'z-50 max-w-64 rounded-md border border-base-content/10 bg-base-100 px-2 py-1 text-xs text-base-content shadow-lg'

// Keep the compact visual weight of the sidebar, with one size and no transforms.
function SidebarIcon({ children }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="block h-4 w-4 shrink-0 opacity-80"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

function SidebarTooltip({ label, shortcut, children }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={10} className={SIDEBAR_TOOLTIP_CLASS}>
          <span>{label}</span>
          {shortcut && <kbd className="ml-2 text-[11px] text-muted-foreground">{shortcut}</kbd>}
          <Tooltip.Arrow className="fill-base-100" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default function Sidebar({
  activeItem,
  onSelect,
  activeView,
  onViewChange,
  onSyncViewPositions,
  showNotes = true,
  showAreas = true,
}) {
  const appVersion =
    typeof __APP_VERSION__ === 'string' ? `v${__APP_VERSION__}` : 'v0.0.0'
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const shortcutPrefix = isMac ? 'Cmd' : 'Ctrl'
  const syncDisabled = activeView === VIEW_CONCEPTUAL
  const syncTooltip = syncDisabled
    ? 'Sync is unavailable in conceptual view: there is no previous modeling phase.'
    : activeView === VIEW_LOGICAL
      ? 'Sync positions from conceptual view'
      : 'Sync positions from logical view'
  const sidebarButtonClass =
    'peer/menu-button relative flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[10px] leading-3 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring hover:bg-base-300 data-[active=true]:bg-primary/10 before:absolute before:-left-1 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:opacity-0 data-[active=true]:before:opacity-100 data-[active=true]:font-medium data-[active=true]:text-primary-label aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-transparent'

  return (
    <aside className="box-content w-16 shrink-0 border-r border-base-content/10 bg-base-200">
      <div data-sidebar="sidebar" className="flex h-full flex-col bg-base-200">
        <div
          data-sidebar="content"
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto"
        >
          <Tooltip.Provider delayDuration={100}>
          <div
            data-sidebar="group"
            className="relative flex w-full min-w-0 flex-col px-2 py-1"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                aria-label="File actions"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="New model" shortcut={shortcutPrefix + '+N'}>
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'new' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('new')}
                      type="button"
                    >
                      <SidebarIcon>
                        <path d="M3 12h18M12 3v18" />
                      </SidebarIcon>
                      <span>New</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Open model" shortcut={shortcutPrefix + '+O'}>
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'open' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('open')}
                      type="button"
                    >
                      <SidebarIcon>
                        <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
                      </SidebarIcon>
                      <span>Open</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Save model" shortcut={shortcutPrefix + '+S'}>
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'save' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('save')}
                      type="button"
                    >
                      <SidebarIcon>
                        <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M12 3v12m-5-5 5 5 5-5" />
                      </SidebarIcon>
                      <span>Save</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Export PNG…">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'export' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('export')}
                      type="button"
                    >
                      <SidebarIcon>
                        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
                        <path d="M14 3v6h6M7 17l3-3 3 3 2-2 2 2" />
                        <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
                      </SidebarIcon>
                      <span>Export</span>
                    </button>
                  </SidebarTooltip>
                </li>
              </ul>
            </div>
          </div>
          <div
            data-sidebar="separator"
            className="mx-2 h-px w-auto bg-base-content/10"
            data-orientation="horizontal"
            role="none"
          />
          <div
            data-sidebar="group"
            className="relative flex w-full min-w-0 flex-col px-2 py-1"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                aria-label="Panels"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Classes panel">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'tables' ? 'true' : 'false'}
                      aria-pressed={activeItem === 'tables'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('tables')}
                      type="button"
                    >
                      <SidebarIcon>
                        <path d="M12 3v18" />
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M3 15h18" />
                      </SidebarIcon>
                      <span>Classes</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Relations panel">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'refs' ? 'true' : 'false'}
                      aria-pressed={activeItem === 'refs'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('refs')}
                      type="button"
                    >
                      <SidebarIcon>
                        <rect width="8" height="8" x="3" y="3" rx="2" />
                        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
                        <rect width="8" height="8" x="13" y="13" rx="2" />
                      </SidebarIcon>
                      <span>Relations</span>
                    </button>
                  </SidebarTooltip>
                </li>
                {showNotes ? (
                  <li data-sidebar="menu-item" className="group/menu-item relative">
                    <SidebarTooltip label="Notes panel">
                      <button
                        data-sidebar="menu-button"
                        data-size="default"
                        data-active={activeItem === 'notes' ? 'true' : 'false'}
                        aria-pressed={activeItem === 'notes'}
                        className={sidebarButtonClass}
                        onClick={() => onSelect('notes')}
                        type="button"
                      >
                        <SidebarIcon>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </SidebarIcon>
                        <span>Notes</span>
                      </button>
                    </SidebarTooltip>
                  </li>
                ) : null}
                {showAreas ? (
                  <li data-sidebar="menu-item" className="group/menu-item relative">
                    <SidebarTooltip label="Areas panel">
                      <button
                        data-sidebar="menu-button"
                        data-size="default"
                        data-active={activeItem === 'areas' ? 'true' : 'false'}
                        aria-pressed={activeItem === 'areas'}
                        className={sidebarButtonClass}
                        onClick={() => onSelect('areas')}
                        type="button"
                      >
                        <SidebarIcon>
                          <path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
                          <rect x="9" y="9" width="12" height="12" rx="2" />
                        </SidebarIcon>
                        <span>Areas</span>
                      </button>
                    </SidebarTooltip>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          <div
            data-sidebar="separator"
            className="mx-2 h-px w-auto bg-base-content/10"
            data-orientation="horizontal"
            role="none"
          />
          <div
            data-sidebar="group"
            className="relative flex w-full min-w-0 flex-col px-2 py-1"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                aria-label="Model views"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Conceptual view">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeView === VIEW_CONCEPTUAL ? 'true' : 'false'}
                      aria-pressed={activeView === VIEW_CONCEPTUAL}
                      className={sidebarButtonClass}
                      onClick={() => onViewChange?.(VIEW_CONCEPTUAL)}
                      type="button"
                    >
                      <SidebarIcon>
                        <rect x="9" y="3" width="6" height="6" rx="1" />
                        <rect x="3" y="15" width="6" height="6" rx="1" />
                        <rect x="15" y="15" width="6" height="6" rx="1" />
                        <path d="M12 9v3M6 15v-3h12v3" />
                      </SidebarIcon>
                      <span>Concept</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Logical view">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeView === VIEW_LOGICAL ? 'true' : 'false'}
                      aria-pressed={activeView === VIEW_LOGICAL}
                      className={sidebarButtonClass}
                      onClick={() => onViewChange?.(VIEW_LOGICAL)}
                      type="button"
                    >
                      <SidebarIcon>
                        <rect x="3" y="3" width="6" height="6" rx="1" />
                        <rect x="15" y="3" width="6" height="6" rx="1" />
                        <rect x="9" y="15" width="6" height="6" rx="1" />
                        <path d="M6 9v3h12V9M12 12v3" />
                      </SidebarIcon>
                      <span>Logical</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Physical view">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeView === VIEW_PHYSICAL ? 'true' : 'false'}
                      aria-pressed={activeView === VIEW_PHYSICAL}
                      className={sidebarButtonClass}
                      onClick={() => onViewChange?.(VIEW_PHYSICAL)}
                      type="button"
                    >
                      <SidebarIcon>
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
                        <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
                      </SidebarIcon>
                      <span>Physical</span>
                    </button>
                  </SidebarTooltip>
                </li>
              </ul>
            </div>
          </div>
          <div
            data-sidebar="separator"
            className="mx-2 h-px w-auto bg-base-content/10"
            data-orientation="horizontal"
            role="none"
          />
          <div
            data-sidebar="group"
            className="relative flex w-full min-w-0 flex-col px-2 py-1"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                aria-label="Layout actions"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label={syncTooltip}>
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active="false"
                      className={sidebarButtonClass}
                      onClick={() => { if (!syncDisabled) onSyncViewPositions?.() }}
                      type="button"
                      aria-disabled={syncDisabled}
                    >
                      <SidebarIcon>
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                        <path d="M3 21v-5h5" />
                      </SidebarIcon>
                      <span>Sync</span>
                    </button>
                  </SidebarTooltip>
                </li>
              </ul>
            </div>
          </div>
          </Tooltip.Provider>
        </div>
        <div data-sidebar="footer" className="flex flex-col gap-2 p-2">
          <div className="text-xs text-subtle">{appVersion}</div>
        </div>
      </div>
    </aside>
  )
}
