export function normalizeAttributes(nodeId, attributes) {
  if (!Array.isArray(attributes)) {
    return []
  }

  return attributes.map((attribute, index) => {
    if (typeof attribute === 'string') {
      return {
        id: `${nodeId}-attr-${index}`,
        name: attribute,
      }
    }

    if (attribute && typeof attribute === 'object') {
      const name =
        typeof attribute.name === 'string'
          ? attribute.name
          : typeof attribute.label === 'string'
            ? attribute.label
            : ''
      return {
        id: attribute.id ?? `${nodeId}-attr-${index}`,
        name,
      }
    }

    return {
      id: `${nodeId}-attr-${index}`,
      name: '',
    }
  })
}

export function createAttribute(nodeId, name) {
  const idSuffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1000)}`

  return {
    id: `attr-${nodeId}-${idSuffix}`,
    name,
  }
}
