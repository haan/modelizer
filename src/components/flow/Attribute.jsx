export default function Attribute({
  name,
  type,
  nullable,
  primaryKey,
  unique,
  autoIncrement,
}) {
  const label = typeof name === 'string' ? name : ''
  const typeLabel = typeof type === 'string' ? type : ''

  return (
    <li className="flex items-center justify-between gap-2">
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex items-center gap-2 text-[11px] text-base-content/60">
        {primaryKey ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3 text-accent"
            aria-hidden="true"
          >
            <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
          </svg>
        ) : null}
        {nullable ? (
          <span className="rounded border border-base-content/20 px-1 text-[10px]">
            N
          </span>
        ) : null}
        {unique ? (
          <span className="rounded border border-base-content/20 px-1 text-[10px]">
            U
          </span>
        ) : null}
        {autoIncrement ? (
          <span className="rounded border border-base-content/20 px-1 text-[10px]">
            AI
          </span>
        ) : null}
        {typeLabel ? <span className="truncate">{typeLabel}</span> : null}
      </span>
    </li>
  )
}
