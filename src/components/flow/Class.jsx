import { Position } from 'reactflow'
import { CLASS_COLOR_PALETTE } from '../../classPalette.js'
import { normalizeAttributes } from '../../attributes.js'
import { normalizeVisibility } from '../../model/viewUtils.js'
import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../model/constants.js'
import Attribute from './Attribute.jsx'
import ClassHandle from './ClassHandle.jsx'

export function Class({ data, id, selected }) {
  const attributes = normalizeAttributes(id, data.attributes)
  const accentColor = data?.color ?? CLASS_COLOR_PALETTE[0]
  const showAccentColors = data?.showAccentColors ?? true
  const alternateNNDisplay = data?.alternateNNDisplay ?? false
  const activeView = data?.activeView ?? VIEW_CONCEPTUAL
  const showHandles = activeView === VIEW_CONCEPTUAL
  const handleVisibilityClass = showHandles ? '' : 'opacity-0 pointer-events-none'
  const showTypeDetails = activeView === VIEW_PHYSICAL
  const showConstraints = activeView === VIEW_PHYSICAL
  const visibleAttributes = attributes.filter((attribute) => {
    const visibility = normalizeVisibility(attribute.visibility)
    if (activeView === VIEW_LOGICAL) {
      return visibility.logical
    }
    if (activeView === VIEW_PHYSICAL) {
      return visibility.physical
    }
    return visibility.conceptual
  })
  const borderClass = selected ? 'border-primary' : 'border-base-content/70'

  return (
    <div
      className={`group/node min-w-[180px] rounded-lg border-2 bg-base-100 text-base-content shadow-sm hover:border-primary ${borderClass}`}
    >
      <div
        data-no-export="true"
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
          <ul className="table w-full border-separate border-spacing-y-1">
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
                  name={attr.name}
                  displayName={displayName}
                  type={attr.type}
                  typeParams={attr.typeParams}
                  showType={showTypeDetails}
                  showConstraints={showConstraints}
                  alternateNNDisplay={alternateNNDisplay}
                  nullable={attr.nullable}
                  unique={attr.unique}
                  autoIncrement={attr.autoIncrement}
                />
              )
            })}
          </ul>
        )}
      </div>
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
      </>
    </div>
  )
}
