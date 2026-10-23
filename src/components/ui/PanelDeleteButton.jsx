import ControlTooltip from './ControlTooltip.jsx'

export default function PanelDeleteButton({ label, onClick }) {
  return (
    <ControlTooltip label={label}>
      <button type="button" aria-label={label}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-base-content/50 hover:bg-base-200 hover:text-danger focus-visible:ring-2 focus-visible:ring-ring"
        onMouseDown={event => event.stopPropagation()}
        onClick={event => { event.stopPropagation(); onClick?.() }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M3 6h18M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </ControlTooltip>
  )
}
