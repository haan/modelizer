import { Parser } from 'node-sql-parser'
import { ATTRIBUTE_TYPE_PARAMS_DEFAULT } from '../attributes.js'
import { CLASS_COLOR_PALETTE } from '../classPalette.js'
import {
  CLASS_NODE_TYPE,
  MODEL_VERSION,
  RELATIONSHIP_EDGE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from './constants.js'

const GRID_PADDING = 80
const GRID_SPACING_X = 320
const GRID_SPACING_Y = 220

const normalizeText = (value) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const createId = (prefix, index) =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${index}-${Date.now()}`

const deriveModelName = (fileName) => {
  const safeName = normalizeText(fileName)
  if (!safeName) {
    return 'Imported model'
  }
  return safeName.replace(/\.[^/.]+$/, '') || 'Imported model'
}

const parseEnumValues = (expr) => {
  if (expr?.type !== 'expr_list') {
    return []
  }
  return expr.value
    .map((entry) => {
      if (typeof entry?.value === 'string') {
        return entry.value
      }
      return normalizeText(entry?.raw)
    })
    .filter(Boolean)
}

const parseDefaultValue = (defaultVal) => {
  if (!defaultVal) {
    return ''
  }
  const value = defaultVal.value ?? defaultVal
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (value?.type === 'single_quote_string' || value?.type === 'double_quote_string') {
    return normalizeText(value.value)
  }
  if (value?.type === 'number') {
    return String(value.value)
  }
  if (value?.type === 'function') {
    const nameParts = value.name?.name ?? []
    const name = nameParts
      .map((part) => normalizeText(part?.value))
      .filter(Boolean)
      .join('.')
    return name || ''
  }
  return ''
}

const mapMySqlDatatype = (definition) => {
  const typeParams = { ...ATTRIBUTE_TYPE_PARAMS_DEFAULT }
  const dataType = normalizeText(definition?.dataType).toLowerCase()

  if (!dataType) {
    return { type: '', typeParams, isFallback: false }
  }

  if (['int', 'integer', 'smallint', 'bigint', 'mediumint'].includes(dataType)) {
    return { type: 'int', typeParams, isFallback: false }
  }

  if (dataType === 'tinyint') {
    const length = normalizeNumber(definition?.length)
    if (length === 1) {
      return { type: 'boolean', typeParams, isFallback: false }
    }
    return { type: 'int', typeParams, isFallback: false }
  }

  if (
    dataType.startsWith('varchar') ||
    dataType === 'char' ||
    dataType === 'character' ||
    dataType === 'nchar' ||
    dataType === 'nvarchar'
  ) {
    const length = normalizeNumber(definition?.length)
    if (length != null) {
      typeParams.maxLength = String(length)
    }
    return { type: 'varchar(n)', typeParams, isFallback: false }
  }

  if (['decimal', 'numeric', 'float', 'double', 'real'].includes(dataType)) {
    const length = normalizeNumber(definition?.length)
    const scale = normalizeNumber(definition?.scale)
    if (length != null) {
      typeParams.precision = String(length)
    }
    if (scale != null) {
      typeParams.scale = String(scale)
    }
    return { type: 'decimal(p,s)', typeParams, isFallback: false }
  }

  if (dataType === 'enum') {
    const values = parseEnumValues(definition?.expr)
    if (values.length) {
      typeParams.enumValues = values.join(', ')
    }
    return { type: 'enum(e)', typeParams, isFallback: false }
  }

  if (
    ['text', 'tinytext', 'mediumtext', 'longtext'].includes(dataType)
  ) {
    return { type: 'text', typeParams, isFallback: false }
  }

  if (dataType === 'boolean' || dataType === 'bool') {
    return { type: 'boolean', typeParams, isFallback: false }
  }

  if (dataType === 'datetime') {
    return { type: 'datetime', typeParams, isFallback: false }
  }

  if (dataType === 'timestamp') {
    return { type: 'timestamp', typeParams, isFallback: false }
  }

  if (dataType === 'date') {
    return { type: 'date', typeParams, isFallback: false }
  }

  if (dataType === 'time') {
    return { type: 'time', typeParams, isFallback: false }
  }

  return { type: '', typeParams, isFallback: true }
}

const buildGridPositions = (count) => {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)))
  return Array.from({ length: count }, (_, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    return {
      x: GRID_PADDING + col * GRID_SPACING_X,
      y: GRID_PADDING + row * GRID_SPACING_Y,
    }
  })
}

const extractColumnNames = (definition) => {
  if (!Array.isArray(definition)) {
    return []
  }
  return definition
    .map((entry) => normalizeText(entry?.column))
    .filter(Boolean)
}

const getForeignKeyDefinition = (constraint) => {
  const columns = extractColumnNames(constraint?.definition)
  const references = extractColumnNames(constraint?.reference_definition?.definition)
  const targetTable = normalizeText(constraint?.reference_definition?.table?.[0]?.table)
  if (columns.length !== 1 || references.length !== 1 || !targetTable) {
    return null
  }
  return {
    sourceColumn: columns[0],
    targetTable,
    targetColumn: references[0],
  }
}

const getRelationshipHandles = (sourcePos, targetPos, sourceAttrId, targetAttrId) => {
  const isTargetToRight = targetPos.x >= sourcePos.x
  return {
    sourceHandle: `${isTargetToRight ? 'right' : 'left'}-${sourceAttrId}-source`,
    targetHandle: `${isTargetToRight ? 'left' : 'right'}-${targetAttrId}-target`,
  }
}

export function importMySql(sqlText, fileName) {
  if (typeof sqlText !== 'string') {
    return null
  }

  let ast
  try {
    const parser = new Parser()
    ast = parser.astify(sqlText, { database: 'MySQL' })
  } catch (error) {
    console.error('Failed to parse MySQL file', error)
    return null
  }

  const statements = Array.isArray(ast) ? ast : [ast]
  const createTables = statements.filter(
    (statement) =>
      normalizeText(statement?.type) === 'create' &&
      normalizeText(statement?.keyword) === 'table',
  )

  if (!createTables.length) {
    return null
  }

  const classIdByName = new Map()
  const attributeIdByKey = new Map()
  let unmatchedTypeCount = 0
  const positions = buildGridPositions(createTables.length)

  const nodes = createTables.map((statement, index) => {
    const tableName =
      normalizeText(statement?.table?.[0]?.table) ||
      normalizeText(statement?.table?.table)
    const nodeId = createId('class', index)
    classIdByName.set(tableName, nodeId)

    const position = positions[index]
    const viewPositions = {
      [VIEW_CONCEPTUAL]: { ...position },
      [VIEW_LOGICAL]: { ...position },
      [VIEW_PHYSICAL]: { ...position },
    }
    const visibility = {
      conceptual: true,
      logical: true,
      physical: true,
    }

    const createDefinitions = Array.isArray(statement?.create_definitions)
      ? statement.create_definitions
      : []
    const primaryKeyColumns = new Set()
    const uniqueColumns = new Set()
    createDefinitions.forEach((definition) => {
      if (definition?.resource !== 'constraint') {
        return
      }
      const constraintType = normalizeText(definition?.constraint_type).toLowerCase()
      if (constraintType.includes('primary key')) {
        extractColumnNames(definition?.definition).forEach((column) =>
          primaryKeyColumns.add(column),
        )
        return
      }
      if (constraintType.includes('unique')) {
        extractColumnNames(definition?.definition).forEach((column) =>
          uniqueColumns.add(column),
        )
        return
      }
      if (constraintType.includes('foreign key')) {
        const fk = getForeignKeyDefinition(definition)
        if (fk) {
          // handled later for relationships
        }
      }
    })

    const attributes = createDefinitions
      .filter((definition) => definition?.resource === 'column')
      .map((definition, columnIndex) => {
        const columnName = normalizeText(definition?.column?.column)
        const { type, typeParams, isFallback } = mapMySqlDatatype(
          definition?.definition,
        )
        if (isFallback) {
          unmatchedTypeCount += 1
        }
        const hasNotNull = normalizeText(definition?.nullable?.type) === 'not null'
        const isPrimaryKey =
          Boolean(definition?.primary_key) || primaryKeyColumns.has(columnName)
        const isUnique = Boolean(definition?.unique) || uniqueColumns.has(columnName)
        const nullable = isPrimaryKey ? false : !hasNotNull
        const defaultValue = parseDefaultValue(definition?.default_val)

        const attrId = createId(`attr-${nodeId}`, columnIndex)
        if (tableName && columnName) {
          attributeIdByKey.set(`${tableName}.${columnName}`, attrId)
        }

        return {
          id: attrId,
          name: columnName,
          logicalName: '',
          type,
          typeParams,
          defaultValue,
          nullable,
          unique: isPrimaryKey ? true : isUnique,
          autoIncrement: Boolean(definition?.auto_increment),
          visibility,
        }
      })

    return {
      id: nodeId,
      type: CLASS_NODE_TYPE,
      position,
      data: {
        label: tableName,
        attributes,
        color: CLASS_COLOR_PALETTE[index % CLASS_COLOR_PALETTE.length],
        visibility,
        viewPositions,
        viewPositionsMeta: {
          conceptual: true,
          logical: true,
          physical: true,
        },
      },
    }
  })

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const getNodePosition = (nodeId) => {
    const node = nodeById.get(nodeId)
    const viewPositions = node?.data?.viewPositions
    return viewPositions?.[VIEW_PHYSICAL] ?? node?.position ?? { x: 0, y: 0 }
  }

  const relationshipKeySet = new Set()
  const edges = []

  const addForeignKeyEdge = (fk, sourceTable, edgeSeed) => {
    const sourceId = classIdByName.get(sourceTable)
    const targetId = classIdByName.get(fk.targetTable)
    if (!sourceId || !targetId) {
      return
    }

    const sourceAttrId = attributeIdByKey.get(
      `${sourceTable}.${fk.sourceColumn}`,
    )
    const targetAttrId = attributeIdByKey.get(
      `${fk.targetTable}.${fk.targetColumn}`,
    )
    if (!sourceAttrId || !targetAttrId) {
      return
    }

    const relationshipKey = [sourceAttrId, targetAttrId].sort().join('|')
    if (relationshipKeySet.has(relationshipKey)) {
      return
    }
    relationshipKeySet.add(relationshipKey)

    const sourcePos = getNodePosition(sourceId)
    const targetPos = getNodePosition(targetId)
    edges.push({
      id: createId('edge-rel', edgeSeed),
      source: sourceId,
      target: targetId,
      ...getRelationshipHandles(
        sourcePos,
        targetPos,
        sourceAttrId,
        targetAttrId,
      ),
      type: RELATIONSHIP_EDGE_TYPE,
      data: { type: 'relationship' },
    })
  }

  createTables.forEach((statement, tableIndex) => {
    const tableName =
      normalizeText(statement?.table?.[0]?.table) ||
      normalizeText(statement?.table?.table)
    if (!tableName) {
      return
    }
    const createDefinitions = Array.isArray(statement?.create_definitions)
      ? statement.create_definitions
      : []
    createDefinitions
      .filter((definition) => definition?.resource === 'constraint')
      .forEach((definition, constraintIndex) => {
        const constraintType = normalizeText(definition?.constraint_type).toLowerCase()
        if (!constraintType.includes('foreign key')) {
          return
        }
        const fk = getForeignKeyDefinition(definition)
        if (!fk) {
          return
        }
        addForeignKeyEdge(
          fk,
          tableName,
          tableIndex * 100 + constraintIndex,
        )
      })
  })

  statements
    .filter((statement) => normalizeText(statement?.type) === 'alter')
    .forEach((statement, alterIndex) => {
      const tableName =
        normalizeText(statement?.table?.[0]?.table) ||
        normalizeText(statement?.table?.table)
      if (!tableName) {
        return
      }
      const expressions = Array.isArray(statement?.expr) ? statement.expr : []
      expressions.forEach((expr, exprIndex) => {
        if (normalizeText(expr?.action) !== 'add') {
          return
        }
        const definition = expr?.create_definitions
        const constraintType = normalizeText(definition?.constraint_type).toLowerCase()
        if (!constraintType.includes('foreign key')) {
          return
        }
        const fk = getForeignKeyDefinition(definition)
        if (!fk) {
          return
        }
        addForeignKeyEdge(fk, tableName, alterIndex * 1000 + exprIndex)
      })
    })

  return {
    version: MODEL_VERSION,
    modelName: deriveModelName(fileName),
    nodes,
    edges,
    importWarnings: {
      unmatchedAttributeTypes: unmatchedTypeCount,
    },
  }
}
