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
  showCompositionAggregation,
  onRenameAssociation,
  onDeleteAssociation,
  onUpdateAssociationMultiplicity,
  onUpdateAssociationRole,
  onToggleAssociationComposition,
  onHighlightAssociation,
  openAssociationId,
  onOpenAssociationIdChange,
  openRelationshipId,
  onOpenRelationshipIdChange,
}) {
  const hideAssociations = activeView !== VIEW_CONCEPTUAL
  const hideRelationships = activeView === VIEW_CONCEPTUAL

  return (
    <div className="flex flex-col gap-2 text-sm">
      {hideAssociations ? null : (
        <AssociationsPanel
          edges={edges}
          nodes={nodes}
          showCompositionAggregation={showCompositionAggregation}
          onRenameAssociation={onRenameAssociation}
          onDeleteAssociation={onDeleteAssociation}
          onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
          onUpdateAssociationRole={onUpdateAssociationRole}
          onToggleAssociationComposition={onToggleAssociationComposition}
          onHighlightAssociation={onHighlightAssociation}
          openAssociationId={openAssociationId}
          onOpenAssociationIdChange={onOpenAssociationIdChange}
        />
      )}
      {hideRelationships ? null : (
        <RelationshipsPanel
          edges={edges}
          nodes={nodes}
          onDeleteAssociation={onDeleteAssociation}
          onHighlightAssociation={onHighlightAssociation}
          openRelationshipId={openRelationshipId}
          onOpenRelationshipIdChange={onOpenRelationshipIdChange}
        />
      )}
    </div>
  )
}

