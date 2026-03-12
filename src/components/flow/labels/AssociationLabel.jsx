export function AssociationLabel({ transform, label, className = '' }) {
  return (
    <div
      style={{ transform }}
      className={`nodrag nopan absolute rounded-sm bg-white/80 px-1 py-0 text-[12px] backdrop-blur-[1px] ${className}`}
    >
      {label}
    </div>
  )
}
