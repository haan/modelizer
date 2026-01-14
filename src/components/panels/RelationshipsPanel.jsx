import RelationshipsPanelItem from './RelationshipsPanelItem.jsx'

export default function RelationshipsPanel({ edges, nodes }) {
  const relationships = edges.filter((edge) => edge.type === 'relationship')
  const nodeLabels = new Map(
    nodes.map((node) => [node.id, node.data?.label ?? node.id]),
  )

  const getNodeLabel = (nodeId) => {
    if (!nodeId) {
      return 'Unknown'
    }
    return nodeLabels.get(nodeId) ?? nodeId
  }

  if (!relationships.length) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
            Relationships
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
          Relationships
        </div>
      </div>
      {relationships.map((edge) => (
        <RelationshipsPanelItem
          key={edge.id}
          sourceLabel={getNodeLabel(edge.source)}
          targetLabel={getNodeLabel(edge.target)}
        />
      ))}
    </div>
  )
}
