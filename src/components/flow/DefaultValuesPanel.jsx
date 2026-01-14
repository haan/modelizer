export default function DefaultValuesPanel({ entries }) {
  if (!entries?.length) {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-base-content/20 bg-base-100/90 px-3 py-2 text-xs shadow-md"
    >
      <div className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
        Default values
      </div>
      <dl className="mt-1 space-y-1 text-xs">
        {entries.map((entry) => (
          <div
            key={`${entry.key}-${entry.value}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          >
            <dt className="truncate text-base-content/80">{entry.key}</dt>
            <dd className="text-base-content/60">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
