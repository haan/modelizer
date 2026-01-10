export default function Navbar() {
  return (
    <nav className="w-full border-b border-base-content/10 bg-base-100">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-content font-bold">
            M
          </div>
          <div>
            <div className="text-lg font-semibold">Modelizer</div>
            <div className="text-xs opacity-70">
              Database modeling workspace
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" type="button">
            Docs
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            New model
          </button>
        </div>
      </div>
    </nav>
  )
}
