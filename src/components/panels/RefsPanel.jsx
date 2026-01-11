import AssociationsPanel from './AssociationsPanel.jsx'

export default function RefsPanel({
  edges,
  nodes,
  onRenameAssociation,
  onDeleteAssociation,
  onUpdateAssociationMultiplicity,
  onHighlightAssociation,
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
        Associations
      </div>
      <AssociationsPanel
        edges={edges}
        nodes={nodes}
        onRenameAssociation={onRenameAssociation}
        onDeleteAssociation={onDeleteAssociation}
        onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
        onHighlightAssociation={onHighlightAssociation}
      />
    </div>
  )
}
