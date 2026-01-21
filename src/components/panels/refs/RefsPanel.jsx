import AssociationsPanel from './AssociationsPanel.jsx'
import RelationshipsPanel from './RelationshipsPanel.jsx'
import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../../model/constants.js'

export default function RefsPanel({
  edges,
  nodes,
  activeView,
  onRenameAssociation,
  onDeleteAssociation,
  onUpdateAssociationMultiplicity,
  onUpdateAssociationRole,
  onHighlightAssociation,
}) {
  const hideAssociations = activeView !== VIEW_CONCEPTUAL
  const hideRelationships = activeView === VIEW_CONCEPTUAL

  return (
    <div className="flex flex-col gap-2 text-sm">
      {hideAssociations ? null : (
        <AssociationsPanel
          edges={edges}
          nodes={nodes}
          onRenameAssociation={onRenameAssociation}
          onDeleteAssociation={onDeleteAssociation}
          onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
          onUpdateAssociationRole={onUpdateAssociationRole}
          onHighlightAssociation={onHighlightAssociation}
        />
      )}
      {hideRelationships ? null : (
        <RelationshipsPanel
          edges={edges}
          nodes={nodes}
          onDeleteAssociation={onDeleteAssociation}
          onHighlightAssociation={onHighlightAssociation}
        />
      )}
    </div>
  )
}

