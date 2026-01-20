export default function Note({ data, selected }) {
  const label = typeof data?.label === 'string' ? data.label : ''
  const text = typeof data?.text === 'string' ? data.text : ''
  const borderClass = selected ? 'border-primary' : 'border-amber-200'

  return (
    <div
      className={`min-w-[160px] max-w-[260px] rounded-md border bg-amber-100 text-amber-900 shadow-sm ${borderClass}`}
    >
      <div className="border-b border-amber-200 px-2 py-1 text-xs font-semibold">
        {label || 'Untitled note'}
      </div>
      <div className="px-2 py-1 text-xs whitespace-pre-wrap">
        {text || 'Empty note'}
      </div>
    </div>
  )
}
