export function RoleLabel({ transform, label }) {
  return (
    <div
      style={{ transform }}
      className="nodrag nopan absolute px-1 py-0 text-[12px] bg-base-100"
    >
      {label}
    </div>
  )
}
