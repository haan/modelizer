import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../model/constants.js'
import * as Tooltip from '@radix-ui/react-tooltip'

const SIDEBAR_TOOLTIP_CLASS =
  'rounded-md border border-base-content/10 bg-base-100 px-2 py-1 text-xs text-base-content shadow-lg'

function SidebarTooltip({ label, children }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={10} className={SIDEBAR_TOOLTIP_CLASS}>
          {label}
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
  const sidebarButtonClass =
    'peer/menu-button flex w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[10px] leading-tight text-center outline-none transition-[width,height,padding] focus-visible:ring-2 focus-visible:ring-base-content/20 hover:bg-base-300 data-[active=true]:bg-base-300 data-[active=true]:font-medium data-[active=true]:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'

  return (
    <aside className="w-16 shrink-0 border-r border-base-content/10 bg-base-200">
      <div data-sidebar="sidebar" className="flex h-full flex-col bg-base-200">
        <div
          data-sidebar="content"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto"
        >
          <Tooltip.Provider delayDuration={100}>
          <div
            data-sidebar="group"
            className="relative flex w-full min-w-0 flex-col p-2"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="New model">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'new' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('new')}
                      type="button"
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
                        className="h-4 w-4 shrink-0 scale-100"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                      <span>New</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Open model">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'open' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('open')}
                      type="button"
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
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Open</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Save model">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'save' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('save')}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                      <span>Save</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Export as PNG">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'export' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('export')}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14 4.5V14a2 2 0 0 1-2 2v-1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zm-3.76 8.132q.114.23.14.492h-.776a.8.8 0 0 0-.097-.249.7.7 0 0 0-.17-.19.7.7 0 0 0-.237-.126 1 1 0 0 0-.299-.044q-.427 0-.665.302-.234.301-.234.85v.498q0 .351.097.615a.9.9 0 0 0 .304.413.87.87 0 0 0 .519.146 1 1 0 0 0 .457-.096.67.67 0 0 0 .272-.264q.09-.164.091-.363v-.255H8.82v-.59h1.576v.798q0 .29-.097.55a1.3 1.3 0 0 1-.293.458 1.4 1.4 0 0 1-.495.313q-.296.111-.697.111a2 2 0 0 1-.753-.132 1.45 1.45 0 0 1-.533-.377 1.6 1.6 0 0 1-.32-.58 2.5 2.0 0 0 1-.105-.745v-.506q0-.543.2-.95.201-.406.582-.633.384-.228.926-.228.357 0 .636.1.281.1.48.275.2.176.314.407Zm-8.64-.706H0v4h.791v-1.343h.803q.43 0 .732-.172.305-.177.463-.475a1.4 1.4 0 0 0 .161-.677q0-.374-.158-.677a1.2 1.2 0 0 0-.46-.477q-.3-.18-.732-.179m.545 1.333a.8.8 0 0 1-.085.381.57.57 0 0 1-.238.24.8.8 0 0 1-.375.082H.788v-1.406h.66q.327 0 .512.182.185.181.185.521m1.964 2.666V13.25h.032l1.761 2.675h.656v-3.999h-.75v2.66h-.032l-1.752-2.66h-.662v4z"
                        />
                      </svg>
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
            className="relative flex w-full min-w-0 flex-col p-2"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Classes panel">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'tables' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('tables')}
                      type="button"
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
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M12 3v18" />
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M3 15h18" />
                      </svg>
                      <span>Classes</span>
                    </button>
                  </SidebarTooltip>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="References panel">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeItem === 'refs' ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onSelect('refs')}
                      type="button"
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
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <rect width="8" height="8" x="3" y="3" rx="2" />
                        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
                        <rect width="8" height="8" x="13" y="13" rx="2" />
                      </svg>
                      <span>Refs</span>
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
                        className={sidebarButtonClass}
                        onClick={() => onSelect('notes')}
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
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
                        className={sidebarButtonClass}
                        onClick={() => onSelect('areas')}
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
                          />
                        </svg>
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
            className="relative flex w-full min-w-0 flex-col p-2"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Conceptual view">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active={activeView === VIEW_CONCEPTUAL ? 'true' : 'false'}
                      className={sidebarButtonClass}
                      onClick={() => onViewChange?.(VIEW_CONCEPTUAL)}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4 shrink-0 scale-130"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 5 7h2.5V6A1.5 1.5 0 0 1 6 4.5zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5zM3 11.5A1.5 1.5 0 0 1 4.5 10h1A1.5 1.5 0 0 1 7 11.5v1A1.5 1.5 0 0 1 5.5 14h-1A1.5 1.5 0 0 1 3 12.5zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm4.5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 12.5zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"
                        />
                      </svg>
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
                      className={sidebarButtonClass}
                      onClick={() => onViewChange?.(VIEW_LOGICAL)}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 shrink-0 scale-120"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="6" height="4" rx="1" />
                        <rect x="15" y="4" width="6" height="4" rx="1" />
                        <rect x="9" y="14" width="6" height="4" rx="1" />
                        <path d="M6 8v3" />
                        <path d="M18 8v3" />
                        <path d="M6 11h12" />
                        <path d="M12 11v3" />
                      </svg>
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
                      className={sidebarButtonClass}
                      onClick={() => onViewChange?.(VIEW_PHYSICAL)}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 shrink-0 scale-110"
                        aria-hidden="true"
                      >
                        <ellipse cx="12" cy="5" rx="6.5" ry="2.5" />
                        <path d="M5.5 5v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V5" />
                        <path d="M5.5 11v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-6" />
                      </svg>
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
            className="relative flex w-full min-w-0 flex-col p-2"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                <li data-sidebar="menu-item" className="group/menu-item relative">
                  <SidebarTooltip label="Sync positions from previous modeling phase">
                    <button
                      data-sidebar="menu-button"
                      data-size="default"
                      data-active="false"
                      className={sidebarButtonClass}
                      onClick={() => onSyncViewPositions?.()}
                      type="button"
                      disabled={activeView === VIEW_CONCEPTUAL}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
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
          <div className="text-xs text-base-content/50">{appVersion}</div>
        </div>
      </div>
    </aside>
  )
}
