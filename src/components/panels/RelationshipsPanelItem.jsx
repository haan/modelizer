export default function RelationshipsPanelItem({ sourceLabel, targetLabel }) {
  return (
    <div className="w-full rounded-b-md border-b border-base-content/20">
      <div className="flex items-center gap-2 rounded-b-md border-l-[6px] border-transparent px-2 py-2 pl-8 text-sm font-semibold transition-colors hover:bg-base-200">
        <span className="truncate">{sourceLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="h-4 w-4 shrink-0 opacity-70"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
          />
        </svg>
        <span className="truncate">{targetLabel}</span>
      </div>
    </div>
  )
}
