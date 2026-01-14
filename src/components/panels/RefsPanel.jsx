import AssociationsPanel from './AssociationsPanel.jsx'
import RelationshipsPanel from './RelationshipsPanel.jsx'

export default function RefsPanel({
  edges,
  nodes,
  onRenameAssociation,
  onDeleteAssociation,
  onUpdateAssociationMultiplicity,
  onUpdateAssociationRole,
  onHighlightAssociation,
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <AssociationsPanel
        edges={edges}
        nodes={nodes}
        onRenameAssociation={onRenameAssociation}
        onDeleteAssociation={onDeleteAssociation}
        onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
        onUpdateAssociationRole={onUpdateAssociationRole}
        onHighlightAssociation={onHighlightAssociation}
      />
      <RelationshipsPanel edges={edges} nodes={nodes} />
    </div>
  )
}
