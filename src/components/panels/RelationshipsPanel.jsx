import { useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import RelationshipsPanelItem from './RelationshipsPanelItem.jsx'

const getAttributeIdFromHandle = (handleId) => {
  if (!handleId) {
    return null
  }

  const suffix = handleId.endsWith('-source')
    ? '-source'
    : handleId.endsWith('-target')
      ? '-target'
      : null
  if (!suffix) {
    return null
  }

  const trimmed = handleId.slice(0, -suffix.length)
  if (trimmed.startsWith('left-')) {
    return trimmed.slice('left-'.length)
  }
  if (trimmed.startsWith('right-')) {
    return trimmed.slice('right-'.length)
  }
  return null
}

export default function RelationshipsPanel({
  edges,
  nodes,
  onDeleteAssociation,
  onHighlightAssociation,
}) {
  const relationships = edges.filter((edge) => edge.type === 'relationship')
  const [openRelationshipId, setOpenRelationshipId] = useState('')
  const nodeLabels = new Map(
    nodes.map((node) => [node.id, node.data?.label ?? node.id]),
  )
  const nodeAttributes = new Map(
    nodes.map((node) => [node.id, node.data?.attributes ?? []]),
  )

  const getNodeLabel = (nodeId) => {
    if (!nodeId) {
      return 'Unknown'
    }
    return nodeLabels.get(nodeId) ?? nodeId
  }

  const getAttributeLabel = (nodeId, handleId) => {
    if (!nodeId || !handleId) {
      return 'Unknown'
    }
    const attributeId = getAttributeIdFromHandle(handleId)
    if (!attributeId) {
      return 'Unknown'
    }
    const attributes = nodeAttributes.get(nodeId) ?? []
    const attribute = attributes.find((entry) => entry.id === attributeId)
    if (!attribute) {
      return 'Unknown'
    }
    const logicalName =
      typeof attribute.logicalName === 'string' && attribute.logicalName.trim()
        ? attribute.logicalName
        : ''
    return logicalName || attribute.name || attributeId
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
      <Accordion.Root
        type="single"
        collapsible
        value={openRelationshipId}
        onValueChange={setOpenRelationshipId}
        className="flex flex-col gap-1"
      >
        {relationships.map((edge) => (
          <RelationshipsPanelItem
            key={edge.id}
            edge={edge}
            sourceLabel={getNodeLabel(edge.source)}
            targetLabel={getNodeLabel(edge.target)}
            sourceAttributeLabel={getAttributeLabel(edge.source, edge.sourceHandle)}
            targetAttributeLabel={getAttributeLabel(edge.target, edge.targetHandle)}
            isOpen={openRelationshipId === edge.id}
            onToggleOpen={setOpenRelationshipId}
            onDeleteAssociation={onDeleteAssociation}
            onHighlightAssociation={onHighlightAssociation}
          />
        ))}
      </Accordion.Root>
    </div>
  )
}
