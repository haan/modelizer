import { Position } from 'reactflow'
import { CLASS_COLOR_PALETTE } from '../../classPalette.js'
import { normalizeAttributes } from '../../attributes.js'
import Attribute from './Attribute.jsx'
import ClassHandle from './ClassHandle.jsx'

export function Class({ data, id, selected }) {
  const attributes = normalizeAttributes(id, data.attributes)
  const accentColor = data?.color ?? CLASS_COLOR_PALETTE[0]
  const borderClass = selected ? 'border-primary' : 'border-base-content/70'

  return (
    <div
      className={`group/node min-w-[180px] rounded-lg border-2 bg-base-100 text-base-content shadow-sm hover:border-primary ${borderClass}`}
    >
      <div
        className="h-2 rounded-t-md"
        style={{ backgroundColor: accentColor }}
      />
      <div className="border-b border-base-content px-3 py-2 text-sm font-semibold">
        {data.label ?? ''}
      </div>
      <div className="px-3 py-2 text-xs">
        {attributes.length === 0 ? (
          <div className="opacity-60">No attributes</div>
        ) : (
          <ul className="space-y-1">
            {attributes.map((attr) => (
              <Attribute
                key={attr.id}
                name={attr.name}
                type={attr.type}
                nullable={attr.nullable}
                primaryKey={attr.primaryKey}
              />
            ))}
          </ul>
        )}
      </div>
      <ClassHandle
        id="left-target"
        type="target"
        position={Position.Left}
      />
      <ClassHandle
        id="left-source"
        type="source"
        position={Position.Left}
      />
      <ClassHandle
        id="right-source"
        type="source"
        position={Position.Right}
      />
      <ClassHandle
        id="right-target"
        type="target"
        position={Position.Right}
      />
      <ClassHandle
        id="top-target"
        type="target"
        position={Position.Top}
      />
      <ClassHandle
        id="top-source"
        type="source"
        position={Position.Top}
      />
      <ClassHandle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
      />
      <ClassHandle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
      />
    </div>
  )
}
