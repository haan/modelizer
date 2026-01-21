export default function AntiCheatPanel({ entries, status }) {
  if (!entries?.length) {
    return null
  }
  const statusLabel =
    status === 'ok'
      ? 'Anti-Cheat: no tampering detected'
      : 'Anti-Cheat: potential tampering'

  return (
    <div className="pointer-events-none absolute right-4 top-4 rounded-md border border-base-content/20 bg-base-100/90 px-3 py-2 text-xs shadow-md">
      <div className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
        Anti-cheat
      </div>
      <div
        className={`mt-1 text-[11px] ${status === 'ok' ? 'text-base-content/60' : 'text-secondary'}`}
      >
        {statusLabel}
      </div>
      <dl className="mt-1 space-y-1 text-xs">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          >
            <dt className="truncate text-base-content/80">{entry.name}</dt>
            <dd className="text-base-content/60">{entry.id}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
