import { Position } from 'reactflow'
import ClassHandle from '../handles/ClassHandle.jsx'

export default function AssociationHelperNode() {
  return (
    <div className="relative h-full w-full" data-no-export="true">
      <div className="pointer-events-none absolute inset-0 rounded-full border border-base-content/40 bg-base-300 shadow-sm opacity-0 transition-opacity group-[.is-connecting]/flow:opacity-100" />
      <ClassHandle
        id="association-target"
        type="target"
        position={Position.Top}
      />
    </div>
  )
}
