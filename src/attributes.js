export function normalizeAttributes(nodeId, attributes) {
  if (!Array.isArray(attributes)) {
    return []
  }

  return attributes.map((attribute, index) => {
    if (typeof attribute === 'string') {
      return {
        id: `${nodeId}-attr-${index}`,
        name: attribute,
        type: '',
        nullable: false,
        primaryKey: false,
        unique: false,
        autoIncrement: false,
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
        type: typeof attribute.type === 'string' ? attribute.type : '',
        nullable: typeof attribute.nullable === 'boolean' ? attribute.nullable : false,
        primaryKey:
          typeof attribute.primaryKey === 'boolean' ? attribute.primaryKey : false,
        unique: typeof attribute.unique === 'boolean' ? attribute.unique : false,
        autoIncrement:
          typeof attribute.autoIncrement === 'boolean'
            ? attribute.autoIncrement
            : false,
      }
    }

    return {
      id: `${nodeId}-attr-${index}`,
      name: '',
      type: '',
      nullable: false,
      primaryKey: false,
      unique: false,
      autoIncrement: false,
    }
  })
}

export const ATTRIBUTE_TYPE_UNDEFINED = '__undefined__'

export const ATTRIBUTE_TYPE_OPTIONS = [
  { value: ATTRIBUTE_TYPE_UNDEFINED, label: 'Undefined' },
  { value: 'int', label: 'int' },
  { value: 'bigint', label: 'bigint' },
  { value: 'varchar(255)', label: 'varchar(255)' },
  { value: 'text', label: 'text' },
  { value: 'boolean', label: 'boolean' },
  { value: 'date', label: 'date' },
  { value: 'timestamp', label: 'timestamp' },
  { value: 'numeric', label: 'numeric' },
]

export function createAttribute(nodeId, name) {
  const idSuffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1000)}`

  return {
    id: `attr-${nodeId}-${idSuffix}`,
    name,
    type: '',
    nullable: false,
    primaryKey: false,
    unique: false,
    autoIncrement: false,
  }
}
