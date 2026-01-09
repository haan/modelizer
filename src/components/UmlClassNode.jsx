import { Handle, Position } from 'reactflow'

export function UmlClassNode({ data }) {
  const attributes = Array.isArray(data.attributes) ? data.attributes : []
  const handleBaseClass =
    'opacity-0 transition-opacity rounded-full w-4 h-4 border-2 border-base-100 bg-accent'
  const handleVisibleClass =
    'group-hover/node:opacity-100 group-[.is-connecting]/flow:opacity-100'
  const handleClassName = `${handleBaseClass} ${handleVisibleClass}`

  return (
    <div className="group/node min-w-[180px] rounded-lg border border-base-content bg-base-100 text-base-content shadow-sm">
      <div className="border-b border-base-content px-3 py-2 text-sm font-semibold">
        {data.label ?? ''}
      </div>
      <div className="px-3 py-2 text-xs">
        {attributes.length === 0 ? (
          <div className="opacity-60">No attributes</div>
        ) : (
          <ul className="space-y-1">
            {attributes.map((attr) => (
              <li key={attr}>{attr}</li>
            ))}
          </ul>
        )}
      </div>
      <Handle
        className={handleClassName}
        id="left"
        type="target"
        position={Position.Left}
      />
      <Handle
        className={handleClassName}
        id="right"
        type="source"
        position={Position.Right}
      />
      <Handle
        className={handleClassName}
        id="top"
        type="target"
        position={Position.Top}
      />
      <Handle
        className={handleClassName}
        id="bottom"
        type="source"
        position={Position.Bottom}
      />
    </div>
  )
}
