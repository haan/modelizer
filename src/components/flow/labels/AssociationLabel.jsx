export function AssociationLabel({ transform, label, className = '' }) {
  return (
    <div
      data-association-label="true"
      style={{ transform }}
      className={`nodrag nopan absolute px-1 py-0 text-[12px] ${className}`}
    >
      {label}
    </div>
  )
}
