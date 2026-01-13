import { normalizeVisibility } from './model/viewUtils.js'

export function normalizeAttributes(nodeId, attributes) {
  if (!Array.isArray(attributes)) {
    return []
  }

  return attributes.map((attribute, index) => {
    if (typeof attribute === 'string') {
      return {
        id: `${nodeId}-attr-${index}`,
        name: attribute,
        logicalName: '',
        type: '',
        typeParams: normalizeTypeParams(),
        defaultValue: '',
        nullable: false,
        unique: false,
        autoIncrement: false,
        visibility: normalizeVisibility(),
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
        logicalName:
          typeof attribute.logicalName === 'string' ? attribute.logicalName : '',
        type: typeof attribute.type === 'string' ? attribute.type : '',
        typeParams: normalizeTypeParams(attribute.typeParams),
        defaultValue:
          typeof attribute.defaultValue === 'string' ? attribute.defaultValue : '',
        nullable: typeof attribute.nullable === 'boolean' ? attribute.nullable : false,
        unique: typeof attribute.unique === 'boolean' ? attribute.unique : false,
        autoIncrement:
          typeof attribute.autoIncrement === 'boolean'
            ? attribute.autoIncrement
            : false,
        visibility: normalizeVisibility(attribute.visibility),
      }
    }

    return {
      id: `${nodeId}-attr-${index}`,
      name: '',
      logicalName: '',
      type: '',
      typeParams: normalizeTypeParams(),
      defaultValue: '',
      nullable: false,
      unique: false,
      autoIncrement: false,
      visibility: normalizeVisibility(),
    }
  })
}

export const ATTRIBUTE_TYPE_UNDEFINED = '__undefined__'
export const ATTRIBUTE_TYPE_PARAMS_DEFAULT = {
  maxLength: '',
  precision: '',
  scale: '',
  enumValues: '',
}

export function normalizeTypeParams(params) {
  if (!params || typeof params !== 'object') {
    return { ...ATTRIBUTE_TYPE_PARAMS_DEFAULT }
  }

  return {
    maxLength:
      typeof params.maxLength === 'string' ? params.maxLength : '',
    precision:
      typeof params.precision === 'string' ? params.precision : '',
    scale: typeof params.scale === 'string' ? params.scale : '',
    enumValues:
      typeof params.enumValues === 'string' ? params.enumValues : '',
  }
}

export function getTypeParamKind(type) {
  if (typeof type !== 'string') {
    return null
  }
  if (type.endsWith('(n)')) {
    return 'length'
  }
  if (type.endsWith('(p,s)')) {
    return 'precisionScale'
  }
  if (type.endsWith('(e)')) {
    return 'enum'
  }
  return null
}

export function formatAttributeType(type, typeParams) {
  if (typeof type !== 'string' || !type) {
    return ''
  }

  const params = normalizeTypeParams(typeParams)
  const kind = getTypeParamKind(type)
  if (kind === 'length') {
    const value = params.maxLength.trim()
    return value ? type.replace('(n)', `(${value})`) : type
  }
  if (kind === 'precisionScale') {
    const precision = params.precision.trim()
    const scale = params.scale.trim()
    if (precision && scale) {
      return type.replace('(p,s)', `(${precision},${scale})`)
    }
    if (precision) {
      return type.replace('(p,s)', `(${precision})`)
    }
    return type
  }
  if (kind === 'enum') {
    const values = params.enumValues.trim()
    return values ? type.replace('(e)', `(${values})`) : type
  }

  return type
}

export const ATTRIBUTE_TYPE_OPTIONS = [
  { value: ATTRIBUTE_TYPE_UNDEFINED, label: 'Undefined' },
  { value: 'int', label: 'int' },
  { value: 'decimal(p,s)', label: 'decimal(p,s)' },
  { value: 'varchar(n)', label: 'varchar(n)' },
  { value: 'text', label: 'text' },
  { value: 'boolean', label: 'boolean' },
  { value: 'datetime', label: 'datetime' },
  { value: 'timestamp', label: 'timestamp' },
  { value: 'date', label: 'date' },
  { value: 'time', label: 'time' },
  { value: 'enum(e)', label: 'enum(e)' }
]

export function createAttribute(nodeId, name) {
  const idSuffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1000)}`

  return {
    id: `attr-${nodeId}-${idSuffix}`,
    name,
    logicalName: '',
    type: '',
    typeParams: normalizeTypeParams(),
    defaultValue: '',
    nullable: false,
    unique: false,
    autoIncrement: false,
    visibility: normalizeVisibility(),
  }
}
