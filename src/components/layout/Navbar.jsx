import * as Menubar from '@radix-ui/react-menubar'
import Button from '../ui/Button.jsx'

export default function Navbar({ onNewModel, onExportPng }) {
  return (
    <nav className="w-full border-b border-base-content/10 bg-base-100">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
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
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={() => onNewModel?.()}
                  >
                    New…
                  </Menubar.Item>
                  <Menubar.Item
                    className="cursor-pointer rounded-sm px-2 py-1 text-xs text-base-content/60 transition-colors hover:bg-base-200 focus:outline-none"
                    onSelect={(event) => event.preventDefault()}
                  >
                    Examples
                  </Menubar.Item>
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
          </Menubar.Root>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm">
            Docs
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onNewModel}>
            New model
          </Button>
        </div>
      </div>
    </nav>
  )
}
