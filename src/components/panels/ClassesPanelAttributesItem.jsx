import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Input from '../ui/Input.jsx'

export default function ClassesPanelAttributesItem({ id, label, onChange }) {
  const {
    attributes: sortableAttributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md px-1 py-1 text-xs transition-colors ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-md text-base-content/50 hover:bg-base-300 hover:text-base-content cursor-grab active:cursor-grabbing"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="Reorder attribute"
        {...sortableAttributes}
        {...listeners}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
          aria-hidden="true"
        >
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </button>
      <Input
        size="xs"
        className="min-w-0"
        value={label}
        placeholder="Attribute"
        onChange={(event) => onChange(event.target.value)}
      />
    </li>
  )
}
