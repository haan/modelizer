import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Input from '../ui/Input.jsx'
import SelectField from '../ui/Select.jsx'
import {
  ATTRIBUTE_TYPE_OPTIONS,
  ATTRIBUTE_TYPE_UNDEFINED,
} from '../../attributes.js'

export default function ClassesPanelAttributesItem({
  id,
  name,
  type,
  nullable,
  primaryKey,
  onChangeName,
  onChangeType,
  onToggleNullable,
  onTogglePrimaryKey,
}) {
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
  const isNullable = Boolean(nullable)
  const isPrimaryKey = Boolean(primaryKey)
  const typeValue = ATTRIBUTE_TYPE_OPTIONS.some(
    (option) => option.value === type,
  )
    ? type
    : ''
  const selectTypeValue = typeValue || ATTRIBUTE_TYPE_UNDEFINED

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-md border-b border-base-content/10 px-1 py-1 pb-2 text-xs transition-colors last:border-b-0 ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <details className="group/attribute">
        <summary className="flex list-none items-center gap-2 rounded-md px-1 py-1 cursor-pointer [&::-webkit-details-marker]:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 opacity-60 transition-transform group-open/attribute:rotate-90"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
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
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              size="xs"
              className="min-w-0 flex-1"
              value={name ?? ''}
              placeholder="Attribute"
              onChange={(event) => onChangeName?.(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-pressed={isNullable}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold transition-colors hover:bg-base-300 ${
                isNullable ? 'text-accent' : 'text-base-content/60'
              }`}
              onClick={(event) => {
                event.stopPropagation()
                onToggleNullable?.()
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              N
            </button>
            <button
              type="button"
              aria-pressed={isPrimaryKey}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-base-300 ${
                isPrimaryKey ? 'text-accent' : 'text-base-content/60'
              }`}
              onClick={(event) => {
                event.stopPropagation()
                onTogglePrimaryKey?.()
              }}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label="Primary key"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
              </svg>
            </button>
          </div>
        </summary>
        <div className="pl-6 pt-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              Type
            </div>
            <div className="min-w-[140px] max-w-[220px] flex-1">
              <SelectField
                value={selectTypeValue}
                items={ATTRIBUTE_TYPE_OPTIONS}
                placeholder="Select type"
                onValueChange={(nextValue) =>
                  onChangeType?.(
                    nextValue === ATTRIBUTE_TYPE_UNDEFINED ? '' : nextValue,
                  )
                }
              />
            </div>
          </div>
        </div>
      </details>
    </li>
  )
}
