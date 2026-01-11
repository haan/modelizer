import { Position } from 'reactflow'
import ClassHandle from './ClassHandle.jsx'

export default function AssociationHelperNode() {
  return (
    <div
      className="rounded-full border border-base-content/40 bg-base-300 shadow-sm"
      data-no-export="true"
    >
      <ClassHandle
        id="association-target"
        type="target"
        position={Position.Top}
      />
    </div>
  )
}
