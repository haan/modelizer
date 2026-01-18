import {
  ATTRIBUTE_TYPE_PARAMS_DEFAULT,
  ATTRIBUTE_TYPE_UNDEFINED,
} from '../attributes.js'
import { CLASS_COLOR_PALETTE } from '../classPalette.js'
import {
  ASSOCIATION_EDGE_TYPE,
  ASSOCIATIVE_EDGE_TYPE,
  CLASS_NODE_TYPE,
  MODEL_VERSION,
  REFLEXIVE_EDGE_TYPE,
  RELATIONSHIP_EDGE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from './constants.js'

const POSITION_PADDING = 40
const POSITION_SCALE = 1.5
const ID_FALLBACK_SUFFIX = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`

const normalizeText = (value) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeBoolean = (value, fallback = true) =>
  typeof value === 'boolean' ? value : fallback

const normalizeNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const parseDob = (value) => {
  const trimmed = normalizeText(value)
  if (!trimmed) {
    return { table: null, field: null }
  }
  const dotIndex = trimmed.indexOf('.')
  if (dotIndex === -1) {
    return { table: trimmed, field: null }
  }
  return {
    table: trimmed.slice(0, dotIndex),
    field: trimmed.slice(dotIndex + 1),
  }
}

const deriveModelName = (fileName) => {
  const safeName = normalizeText(fileName)
  if (!safeName) {
    return 'Imported model'
  }
  return safeName.replace(/\.[^/.]+$/, '') || 'Imported model'
}

const normalizeParams = (params) => {
  if (!params) {
    return []
  }
  return params
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

const mapDatatype = (raw) => {
  const value = normalizeText(raw).toLowerCase()
  if (!value) {
    return { type: ATTRIBUTE_TYPE_UNDEFINED, typeParams: { ...ATTRIBUTE_TYPE_PARAMS_DEFAULT } }
  }

  const match = value.match(/^([a-z0-9_]+)\s*(?:\(([^)]*)\))?$/i)
  const base = match ? match[1] : value
  const params = match ? normalizeParams(match[2]) : []
  const typeParams = { ...ATTRIBUTE_TYPE_PARAMS_DEFAULT }

  if (
    base === 'int' ||
    base === 'integer' ||
    base === 'smallint' ||
    base === 'bigint'
  ) {
    return { type: 'int', typeParams }
  }

  if (base.startsWith('varchar') || base === 'char' || base === 'character') {
    if (params[0]) {
      typeParams.maxLength = params[0]
    }
    return { type: 'varchar(n)', typeParams }
  }

  if (base === 'decimal' || base === 'numeric' || base === 'number') {
    if (params[0]) {
      typeParams.precision = params[0]
    }
    if (params[1]) {
      typeParams.scale = params[1]
    }
    return { type: 'decimal(p,s)', typeParams }
  }

  if (base === 'enum') {
    if (params.length) {
      typeParams.enumValues = params.join(',')
    }
    return { type: 'enum(e)', typeParams }
  }

  if (base === 'text') {
    return { type: 'text', typeParams }
  }
  if (base === 'boolean' || base === 'bool') {
    return { type: 'boolean', typeParams }
  }
  if (base === 'datetime') {
    return { type: 'datetime', typeParams }
  }
  if (base === 'timestamp') {
    return { type: 'timestamp', typeParams }
  }
  if (base === 'date') {
    return { type: 'date', typeParams }
  }
  if (base === 'time') {
    return { type: 'time', typeParams }
  }

  return { type: ATTRIBUTE_TYPE_UNDEFINED, typeParams }
}

const shiftPositions = (nodes) => {
  const views = [VIEW_CONCEPTUAL, VIEW_LOGICAL, VIEW_PHYSICAL]
  const offsets = {}

  const scalePosition = (position) => ({
    x: position.x * POSITION_SCALE,
    y: position.y * POSITION_SCALE,
  })

  views.forEach((view) => {
    let minX = Infinity
    let minY = Infinity
    nodes.forEach((node) => {
      const position = node.data?.viewPositions?.[view]
      if (!position) {
        return
      }
      const scaled = scalePosition(position)
      minX = Math.min(minX, scaled.x)
      minY = Math.min(minY, scaled.y)
    })

    if (minX === Infinity || minY === Infinity) {
      offsets[view] = { x: 0, y: 0 }
      return
    }

    offsets[view] = {
      x: minX < POSITION_PADDING ? POSITION_PADDING - minX : 0,
      y: minY < POSITION_PADDING ? POSITION_PADDING - minY : 0,
    }
  })

  return nodes.map((node) => {
    const viewPositions = { ...node.data?.viewPositions }
    views.forEach((view) => {
      const position = viewPositions[view]
      if (!position) {
        return
      }
      const scaled = scalePosition(position)
      viewPositions[view] = {
        x: scaled.x + offsets[view].x,
        y: scaled.y + offsets[view].y,
      }
    })
    return {
      ...node,
      position: viewPositions[VIEW_CONCEPTUAL] ?? node.position,
      data: {
        ...node.data,
        viewPositions,
      },
    }
  })
}

const createId = (prefix, index) =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${index}-${ID_FALLBACK_SUFFIX()}`

export function importJavaModelizer(text, fileName) {
  if (typeof text !== 'string') {
    return null
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    console.error('Failed to parse .mod file', error)
    return null
  }

  if (!parsed || !Array.isArray(parsed.tables)) {
    return null
  }

  const tables = parsed.tables
  const classIdByName = new Map()
  const attributeIdByKey = new Map()
  const nodes = tables.map((table, index) => {
    const tableName = normalizeText(table?.name)
    const nodeId = createId('class', index)
    classIdByName.set(tableName, nodeId)

    const conceptualPos = {
      x: normalizeNumber(table?.x0) ?? index * 40,
      y: normalizeNumber(table?.y0) ?? index * 40,
    }
    const logicalPos = {
      x: normalizeNumber(table?.x1) ?? conceptualPos.x,
      y: normalizeNumber(table?.y1) ?? conceptualPos.y,
    }
    const physicalPos = {
      x: normalizeNumber(table?.x2) ?? conceptualPos.x,
      y: normalizeNumber(table?.y2) ?? conceptualPos.y,
    }

    const visibility = {
      conceptual: normalizeBoolean(table?.conceptual, true),
      logical: normalizeBoolean(table?.logical, true),
      physical: normalizeBoolean(table?.physical, true),
    }

    const attributes = Array.isArray(table?.fields)
      ? table.fields.map((field, fieldIndex) => {
          const attrId = createId(`attr-${nodeId}`, fieldIndex)
          const attributeName = normalizeText(field?.name)
          const { type, typeParams } = mapDatatype(field?.datatype)
          const rawDefault = field?.defaultValue
          const defaultValue =
            typeof rawDefault === 'string'
              ? rawDefault
              : rawDefault != null
                ? String(rawDefault)
                : ''
          const attrVisibility = {
            conceptual:
              visibility.conceptual &&
              !normalizeBoolean(field?.noConceptual, false),
            logical: visibility.logical,
            physical: visibility.physical,
          }
          if (tableName && attributeName) {
            attributeIdByKey.set(`${tableName}.${attributeName}`, attrId)
          }
          return {
            id: attrId,
            name: attributeName,
            logicalName: normalizeText(field?.secName),
            type,
            typeParams,
            defaultValue,
            nullable: normalizeBoolean(field?.null, false),
            unique: normalizeBoolean(field?.unique, false),
            autoIncrement: normalizeBoolean(field?.autoIncrement, false),
            visibility: attrVisibility,
          }
        })
      : []

    return {
      id: nodeId,
      type: CLASS_NODE_TYPE,
      position: conceptualPos,
      data: {
        label: tableName,
        attributes,
        color: CLASS_COLOR_PALETTE[index % CLASS_COLOR_PALETTE.length],
        visibility,
        viewPositions: {
          [VIEW_CONCEPTUAL]: conceptualPos,
          [VIEW_LOGICAL]: logicalPos,
          [VIEW_PHYSICAL]: physicalPos,
        },
        viewPositionsMeta: {
          conceptual: true,
          logical: true,
          physical: true,
        },
      },
    }
  })

  const edges = []
  const associationIdByKey = new Map()
  const relationshipKeySet = new Set()
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  const getNodePosition = (nodeId) => {
    const node = nodeById.get(nodeId)
    const viewPositions = node?.data?.viewPositions
    return (
      viewPositions?.[VIEW_LOGICAL] ??
      viewPositions?.[VIEW_CONCEPTUAL] ??
      node?.position ?? { x: 0, y: 0 }
    )
  }

  const getRelationshipHandles = (sourceId, targetId, sourceAttrId, targetAttrId) => {
    const sourcePos = getNodePosition(sourceId)
    const targetPos = getNodePosition(targetId)
    const isTargetToRight = targetPos.x >= sourcePos.x
    return {
      sourceHandle: `${isTargetToRight ? 'right' : 'left'}-${sourceAttrId}-source`,
      targetHandle: `${isTargetToRight ? 'left' : 'right'}-${targetAttrId}-target`,
    }
  }

  const addAssociationEdge = (edge) => {
    edges.push(edge)
    return edge.id
  }

  tables.forEach((table, tableIndex) => {
    const links = Array.isArray(table?.links) ? table.links : []

    links.forEach((link, linkIndex) => {
      const endpoints = Array.isArray(link?.endpoints) ? link.endpoints : []
      const endpointA = endpoints[0] ?? {}
      const endpointB = endpoints[1] ?? {}
      const endpointC = endpoints[2] ?? {}
      const parsedA = parseDob(endpointA.dob)
      const parsedB = parseDob(endpointB.dob)
      const parsedC = parseDob(endpointC.dob)
      if (!parsedA.table || !parsedB.table) {
        return
      }
      const sourceId = classIdByName.get(parsedA.table)
      const targetId = classIdByName.get(parsedB.table)
      if (!sourceId || !targetId) {
        return
      }

      const associationClassName = parsedC.table
      const associationKey = [
        normalizeText(link?.name),
        [sourceId, targetId].sort().join('|'),
        associationClassName ?? '',
      ].join('::')
      if (associationIdByKey.has(associationKey)) {
        return
      }

      const edgeId = createId('edge', tableIndex * 100 + linkIndex)
      associationIdByKey.set(associationKey, edgeId)

      const isReflexive = sourceId === targetId
      addAssociationEdge({
        id: edgeId,
        source: sourceId,
        target: targetId,
        type: isReflexive ? REFLEXIVE_EDGE_TYPE : ASSOCIATION_EDGE_TYPE,
        data: {
          multiplicityA: normalizeText(endpointA.cardinality),
          multiplicityB: normalizeText(endpointB.cardinality),
          roleA: normalizeText(endpointA.role),
          roleB: normalizeText(endpointB.role),
          name: normalizeText(link?.name),
          type: isReflexive ? 'reflexive' : 'association',
        },
      })

      if (associationClassName) {
        const assocClassId = classIdByName.get(associationClassName)
        if (assocClassId) {
          edges.push({
            id: createId('edge-assoc', tableIndex * 100 + linkIndex),
            source: assocClassId,
            target: `assoc-edge-${edgeId}`,
            type: ASSOCIATIVE_EDGE_TYPE,
            data: {
              name: associationClassName,
              type: 'associative',
              autoName: true,
            },
          })
        }
      }
    })

    const fields = Array.isArray(table?.fields) ? table.fields : []
    fields.forEach((field) => {
      const fieldLinks = Array.isArray(field?.links) ? field.links : []
      fieldLinks.forEach((fieldLink, linkIndex) => {
        const endpoints = Array.isArray(fieldLink?.endpoints)
          ? fieldLink.endpoints
          : []
        const endpointA = endpoints[0] ?? {}
        const endpointB = endpoints[1] ?? {}
        const parsedA = parseDob(endpointA.dob)
        const parsedB = parseDob(endpointB.dob)
        if (!parsedA.table || !parsedA.field || !parsedB.table || !parsedB.field) {
          return
        }

        const sourceId = classIdByName.get(parsedA.table)
        const targetId = classIdByName.get(parsedB.table)
        const sourceAttrId = attributeIdByKey.get(
          `${parsedA.table}.${parsedA.field}`,
        )
        const targetAttrId = attributeIdByKey.get(
          `${parsedB.table}.${parsedB.field}`,
        )
        if (!sourceId || !targetId || !sourceAttrId || !targetAttrId) {
          return
        }

        const relationshipKey = [sourceAttrId, targetAttrId].sort().join('|')
        if (relationshipKeySet.has(relationshipKey)) {
          return
        }
        relationshipKeySet.add(relationshipKey)

        edges.push({
          id: createId('edge-rel', linkIndex),
          source: sourceId,
          target: targetId,
          ...getRelationshipHandles(
            sourceId,
            targetId,
            sourceAttrId,
            targetAttrId,
          ),
          type: RELATIONSHIP_EDGE_TYPE,
          data: { type: 'relationship' },
        })
      })
    })
  })

  const shiftedNodes = shiftPositions(nodes)

  return {
    version: MODEL_VERSION,
    modelName: deriveModelName(fileName),
    nodes: shiftedNodes,
    edges,
  }
}
