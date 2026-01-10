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
  onHighlightAssociation,
}) {
  const nodeLabels = new Map(
    nodes.map((node) => [node.id, node.data?.label ?? node.id]),
  )
  const associations = edges.filter((edge) => ASSOCIATION_TYPES.has(edge.type))

  if (!associations.length) {
    return (
      <div className="text-sm opacity-70">No associations yet.</div>
    )
  }

  const getNodeLabel = (nodeId) => {
    if (!nodeId) {
      return 'Unknown'
    }
    if (nodeId.startsWith('assoc-edge-')) {
      return 'Association'
    }
    return nodeLabels.get(nodeId) ?? nodeId
  }

  return (
    <div className="flex flex-col gap-2">
      {associations.map((edge) => (
        <AssociationsPanelItem
          key={edge.id}
          edge={edge}
          sourceLabel={getNodeLabel(edge.source)}
          targetLabel={getNodeLabel(edge.target)}
          onRenameAssociation={onRenameAssociation}
          onHighlightAssociation={onHighlightAssociation}
        />
      ))}
    </div>
  )
}
