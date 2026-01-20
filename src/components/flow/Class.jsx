import { useLayoutEffect, useRef } from 'react'
import { Position, useUpdateNodeInternals } from 'reactflow'
import { CLASS_COLOR_PALETTE } from '../../classPalette.js'
import { normalizeVisibility } from '../../model/viewUtils.js'
import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../model/constants.js'
import { formatAttributeType } from '../../attributes.js'
import Attribute from './Attribute.jsx'
import ClassHandle from './ClassHandle.jsx'
import CompositionHandle from './CompositionHandle.jsx'

export function Class({ data, id, selected }) {
  const nodeRef = useRef(null)
  const updateNodeInternals = useUpdateNodeInternals()
  const accentColor = data?.color ?? CLASS_COLOR_PALETTE[0]
  const showAccentColors = data?.showAccentColors ?? true
  const nullDisplayMode = data?.nullDisplayMode ?? 'not-null'
  const showNullAsQuestion = nullDisplayMode === 'null-as-question'
  const showNull = nullDisplayMode === 'null'
  const showNotNull = nullDisplayMode === 'not-null'
  const activeView = data?.activeView ?? VIEW_CONCEPTUAL
  const showCompositionAggregation = data?.showCompositionAggregation ?? false
  const showHandles = activeView === VIEW_CONCEPTUAL
  const showAttributeHandles = activeView !== VIEW_CONCEPTUAL
  const handleVisibilityClass = showHandles ? '' : 'opacity-0 pointer-events-none'
  const showTypeDetails = activeView === VIEW_PHYSICAL
  const showConstraints = activeView === VIEW_PHYSICAL
  const showDefaultMarker = activeView === VIEW_PHYSICAL
  const visibleAttributes = (() => {
    const attributes = Array.isArray(data?.attributes) ? data.attributes : []
    return attributes.filter((attribute) => {
      const visibility = normalizeVisibility(attribute.visibility)
      if (activeView === VIEW_LOGICAL) {
        return visibility.logical
      }
      if (activeView === VIEW_PHYSICAL) {
        return visibility.physical
      }
      return visibility.conceptual
    })
  })()
  const visibleAttributeKey = visibleAttributes
    .map((attribute) => attribute.id)
    .join('|')
  let columnTemplate = ''
  if (showTypeDetails || showConstraints) {
    let maxTypeLength = 0
    let maxConstraintsLength = 0

    visibleAttributes.forEach((attribute) => {
      if (showTypeDetails) {
        const rawTypeLabel = formatAttributeType(
          attribute.type,
          attribute.typeParams,
        )
        const typeLabel =
          showNullAsQuestion && attribute.nullable && rawTypeLabel
            ? `${rawTypeLabel}?`
            : rawTypeLabel
        maxTypeLength = Math.max(maxTypeLength, typeLabel.length)
      }
      if (showConstraints) {
        const constraintLabel = [
          showNull && attribute.nullable ? 'N' : null,
          showNotNull && !attribute.nullable ? 'NN' : null,
          attribute.unique ? 'UQ' : null,
          attribute.autoIncrement ? 'AI' : null,
        ]
          .filter(Boolean)
          .join(', ')
        maxConstraintsLength = Math.max(
          maxConstraintsLength,
          constraintLabel.length,
        )
      }
    })

    const typeColumnWidth =
      showTypeDetails && maxTypeLength > 0 ? `${maxTypeLength}ch` : '0px'
    const constraintsColumnWidth =
      showConstraints && maxConstraintsLength > 0
        ? `${maxConstraintsLength}ch`
        : '0px'
    columnTemplate = `minmax(0, 1fr) ${typeColumnWidth} ${constraintsColumnWidth}`
  }
  const borderClass = selected ? 'border-primary' : 'border-base-content/70'
  const compositionHandleStyle = {
    left: '100%',
    top: 0,
    transform: 'translate(-50%, -50%)',
  }

  useLayoutEffect(() => {
    if (!showAttributeHandles) {
      return
    }
    updateNodeInternals(id)
  }, [id, showAttributeHandles, updateNodeInternals, visibleAttributeKey])

  useLayoutEffect(() => {
    updateNodeInternals(id)
  }, [
    id,
    showHandles,
    showAttributeHandles,
    showCompositionAggregation,
    updateNodeInternals,
  ])

  return (
    <div
      ref={nodeRef}
      className={`group/node min-w-[180px] rounded-lg border-2 bg-base-100 text-base-content shadow-sm hover:border-primary ${borderClass}`}
    >
      <div
        data-accent-bar="true"
        className="h-2 rounded-t-[6px]"
        style={{ backgroundColor: showAccentColors ? accentColor : 'transparent' }}
      />
      <div className="border-b border-base-content px-3 pb-2 pt-1 text-sm font-semibold">
        {data.label ?? ''}
      </div>
      <div className="px-3 py-2 text-xs">
        {visibleAttributes.length === 0 ? (
          <div className="opacity-60">No attributes</div>
        ) : (
          <ul className="flex w-full flex-col gap-1">
            {visibleAttributes.map((attr) => {
              const logicalName =
                typeof attr.logicalName === 'string' && attr.logicalName.trim()
                  ? attr.logicalName
                  : ''
              const displayName =
                activeView === VIEW_CONCEPTUAL
                  ? attr.name
                  : logicalName || attr.name
              return (
                <Attribute
                  key={attr.id}
                  attributeId={attr.id}
                  name={attr.name}
                  displayName={displayName}
                  type={attr.type}
                  typeParams={attr.typeParams}
                  showType={showTypeDetails}
                  showConstraints={showConstraints}
                  showDefaultMarker={showDefaultMarker}
                  nullDisplayMode={nullDisplayMode}
                  nullable={attr.nullable}
                  unique={attr.unique}
                  autoIncrement={attr.autoIncrement}
                  showHandles={showAttributeHandles}
                  columnTemplate={columnTemplate}
                  defaultValue={attr.defaultValue}
                />
              )
            })}
          </ul>
        )}
      </div>
      {showHandles ? (
        <>
          <ClassHandle
            id="left-target"
            type="target"
            position={Position.Left}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          <ClassHandle
            id="left-source"
            type="source"
            position={Position.Left}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          <ClassHandle
            id="right-source"
            type="source"
            position={Position.Right}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          <ClassHandle
            id="right-target"
            type="target"
            position={Position.Right}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          <ClassHandle
            id="top-target"
            type="target"
            position={Position.Top}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          <ClassHandle
            id="top-source"
            type="source"
            position={Position.Top}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          <ClassHandle
            id="bottom-source"
            type="source"
            position={Position.Bottom}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          <ClassHandle
            id="bottom-target"
            type="target"
            position={Position.Bottom}
            isActive={showHandles}
            className={handleVisibilityClass}
          />
          {showCompositionAggregation ? (
            <CompositionHandle
              id="composition-source"
              type="source"
              position={Position.Top}
              isActive={showHandles}
              className={handleVisibilityClass}
              style={compositionHandleStyle}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
