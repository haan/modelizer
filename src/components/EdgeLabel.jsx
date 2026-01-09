export function EdgeLabel({ transform, label }) {
  return (
    <div
      style={{ transform }}
      className="nodrag nopan absolute px-1 py-0 text-[12px]"
    >
      {label}
    </div>
  )
}
