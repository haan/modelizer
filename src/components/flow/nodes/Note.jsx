export default function Note({ data, selected }) {
  const label = typeof data?.label === 'string' ? data.label : ''
  const text = typeof data?.text === 'string' ? data.text : ''
  const borderClass = selected ? 'border-primary' : 'border-note-border'

  return (
    <div
      className={`min-w-[160px] max-w-[260px] rounded-md border bg-note text-note-content shadow-sm ${borderClass}`}
    >
      <div className="border-b border-note-border px-2 py-1 text-xs font-semibold">
        {label || 'Untitled note'}
      </div>
      <div className="px-2 py-1 text-xs whitespace-pre-wrap">
        {text || 'Empty note'}
      </div>
    </div>
  )
}
