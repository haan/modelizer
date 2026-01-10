export default function Sidebar({ activeItem, onSelect }) {
  const sidebarButtonClass =
    'peer/menu-button flex w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[10px] leading-tight text-center outline-none transition-[width,height,padding] focus-visible:ring-2 focus-visible:ring-base-content/20 hover:bg-base-300 data-[active=true]:bg-base-300 data-[active=true]:font-medium data-[active=true]:text-primary'

  return (
    <aside className="w-16 shrink-0 border-r border-base-content/10 bg-base-200">
      <div data-sidebar="sidebar" className="flex h-full flex-col bg-base-200">
        <div
          data-sidebar="content"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto"
        >
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
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                    <span>New</span>
                  </button>
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
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
                </li>
                <li data-sidebar="menu-item" className="group/menu-item relative">
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
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div data-sidebar="footer" className="flex flex-col gap-2 p-2" />
      </div>
    </aside>
  )
}
