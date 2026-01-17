import * as Accordion from '@radix-ui/react-accordion'
import AssociationsPanelItem from './AssociationsPanelItem.jsx'

const ASSOCIATION_TYPES = new Set([
  'association',
  'associativeAssociation',
  'reflexiveAssociation',
])

export default function AssociationsPanel({
  edges,
  nodes,
  onRenameAssociation,
  onDeleteAssociation,
  onUpdateAssociationMultiplicity,
  onUpdateAssociationRole,
  onHighlightAssociation,
}) {
  const nodeLabels = new Map(
    nodes.map((node) => [node.id, node.data?.label ?? node.id]),
  )
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]))
  const associations = edges.filter((edge) => ASSOCIATION_TYPES.has(edge.type))

  if (!associations.length) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
            Associations
          </div>
        </div>
      </div>
    )
  }

  const getNodeLabel = (nodeId) => {
    if (!nodeId) {
      return 'Unknown'
    }
    return nodeLabels.get(nodeId) ?? nodeId
  }

  const getAssociationLabel = (nodeId) => {
    if (!nodeId?.startsWith('assoc-edge-')) {
      return null
    }

    const assocEdgeId = nodeId.replace('assoc-edge-', '')
    const assocEdge = edgeById.get(assocEdgeId)
    return assocEdge?.data?.name || 'Association'
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
          Associations
        </div>
      </div>
      <Accordion.Root type="single" collapsible className="flex flex-col gap-1">
        {associations.map((edge) => {
          const sourceIsAssociation = edge.source?.startsWith('assoc-edge-')
          const targetIsAssociation = edge.target?.startsWith('assoc-edge-')
          const sourceAssociationLabel = sourceIsAssociation
            ? getAssociationLabel(edge.source)
            : null
          const targetAssociationLabel = targetIsAssociation
            ? getAssociationLabel(edge.target)
            : null

          return (
            <AssociationsPanelItem
              key={edge.id}
              edge={edge}
              sourceLabel={sourceAssociationLabel ?? getNodeLabel(edge.source)}
              targetLabel={targetAssociationLabel ?? getNodeLabel(edge.target)}
              sourceIsAssociation={sourceIsAssociation}
              targetIsAssociation={targetIsAssociation}
              onRenameAssociation={onRenameAssociation}
              onDeleteAssociation={onDeleteAssociation}
              onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
              onUpdateAssociationRole={onUpdateAssociationRole}
              onHighlightAssociation={onHighlightAssociation}
            />
          )
        })}
      </Accordion.Root>
    </div>
  )
}
