import * as Tooltip from '@radix-ui/react-tooltip'
import * as Accordion from '@radix-ui/react-accordion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Input from '../../ui/Input.jsx'
import SelectField from '../../ui/Select.jsx'
import CheckboxInput from '../../ui/Checkbox.jsx'
import {
  ATTRIBUTE_TYPE_OPTIONS,
  ATTRIBUTE_TYPE_PARAMS_DEFAULT,
  ATTRIBUTE_TYPE_UNDEFINED,
  getTypeParamKind,
} from '../../../attributes.js'
import { normalizeVisibility } from '../../../model/viewUtils.js'
import {
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from '../../../model/constants.js'

export default function ClassesPanelAttributesItem({
  id,
  name,
  logicalName,
  type,
  typeParams,
  defaultValue,
  nullable,
  unique,
  autoIncrement,
  visibility,
  activeView,
  viewSpecificSettingsOnly,
  isOpen = false,
  onChangeName,
  onChangeLogicalName,
  onChangeType,
  onChangeTypeParams,
  onChangeDefaultValue,
  onToggleNullable,
  onToggleUnique,
  onToggleAutoIncrement,
  onChangeVisibility,
  onDelete,
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
  const isUnique = Boolean(unique)
  const isAutoIncrement = Boolean(autoIncrement)
  const typeValue = ATTRIBUTE_TYPE_OPTIONS.some(
    (option) => option.value === type,
  )
    ? type
    : ''
  const selectTypeValue = typeValue || ATTRIBUTE_TYPE_UNDEFINED
  const params = typeParams ?? ATTRIBUTE_TYPE_PARAMS_DEFAULT
  const typeParamKind = getTypeParamKind(
    selectTypeValue === ATTRIBUTE_TYPE_UNDEFINED ? '' : typeValue,
  )
  const visibilityState = normalizeVisibility(visibility)
  const isConceptualVisible = visibilityState.conceptual
  const isLogicalVisible = visibilityState.logical
  const hideAttributeDetails =
    viewSpecificSettingsOnly && activeView !== VIEW_PHYSICAL
  const hideLogicalName =
    viewSpecificSettingsOnly && activeView === VIEW_CONCEPTUAL

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-md border-b border-base-content/10 px-1 py-1 pb-2 text-xs transition-colors ${isDragging ? 'opacity-60' : ''
        }`}
    >
      <Accordion.Item value={id} className="group/attribute">
          <Accordion.Header asChild>
            <div className="flex items-center gap-1 rounded-md px-1 py-1 cursor-default">
              <Accordion.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content"
                  aria-label={isOpen ? 'Collapse attribute' : 'Expand attribute'}
                  aria-expanded={isOpen}
                  tabIndex={-1}
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 opacity-60 transition-transform group-data-[state=open]/attribute:rotate-90"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </Accordion.Trigger>
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-md text-base-content/50 hover:bg-base-300 hover:text-base-content cursor-grab active:cursor-grabbing"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label="Reorder attribute"
              {...sortableAttributes}
              {...listeners}
              tabIndex={-1}
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
              <div className="flex min-w-0 flex-1 items-center gap-1">
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
            </div>
          </Accordion.Header>
          <Accordion.Content className="pl-6 pt-2 text-xs">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              Visibility
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <label className="flex items-center gap-2">
                <CheckboxInput
                  checked={isConceptualVisible}
                  onCheckedChange={(value) =>
                    onChangeVisibility?.({ conceptual: Boolean(value) })
                  }
                />
                <span>Conceptual</span>
              </label>
              <label className="flex items-center gap-2">
                <CheckboxInput
                  checked={isLogicalVisible}
                  onCheckedChange={(value) =>
                    onChangeVisibility?.({
                      logical: Boolean(value),
                      physical: Boolean(value),
                    })
                  }
                />
                <span>Logical/Physical</span>
              </label>
            </div>
          </div>
          {!hideLogicalName ? (
            <div className="flex items-center justify-between gap-3 pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                Logical name
              </div>
              <div className="min-w-[140px] max-w-[220px] flex-1">
                <Input
                  size="xs"
                  value={logicalName ?? ''}
                  placeholder="Logical name"
                  onChange={(event) =>
                    onChangeLogicalName?.(event.target.value)
                  }
                />
              </div>
            </div>
          ) : null}
          {!hideAttributeDetails ? (
            <div className="flex items-center justify-between gap-3 pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                Constraints
              </div>
              <Tooltip.Provider delayDuration={100}>
                <div className="flex items-center gap-1">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      aria-pressed={isNullable}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold transition-colors hover:bg-base-300 ${isNullable ? 'text-accent' : 'text-base-content/60'
                        }`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleNullable?.()
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      N
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      align="center"
                      sideOffset={6}
                      className="rounded-md border border-base-content/20 bg-base-100 px-2 py-1 text-[10px] text-base-content shadow-lg"
                    >
                      {isNullable ? 'Null' : 'Not Null'}
                      <Tooltip.Arrow className="fill-base-100" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      aria-pressed={isUnique}
                      className={`inline-flex h-6 min-w-[24px] px-1 items-center justify-center rounded-md text-[10px] font-semibold transition-colors hover:bg-base-300 ${isUnique ? 'text-accent' : 'text-base-content/60'
                        }`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleUnique?.()
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                      aria-label="Unique"
                    >
                      UQ
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      align="center"
                      sideOffset={6}
                      className="rounded-md border border-base-content/20 bg-base-100 px-2 py-1 text-[10px] text-base-content shadow-lg"
                    >
                      {isUnique ? 'Unique' : 'Not Unique'}
                      <Tooltip.Arrow className="fill-base-100" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      aria-pressed={isAutoIncrement}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold transition-colors hover:bg-base-300 ${isAutoIncrement
                        ? 'text-accent'
                        : 'text-base-content/60'
                        }`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleAutoIncrement?.()
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                      aria-label="Auto increment"
                    >
                      AI
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      align="center"
                      sideOffset={6}
                      className="rounded-md border border-base-content/20 bg-base-100 px-2 py-1 text-[10px] text-base-content shadow-lg"
                    >
                      {isAutoIncrement ? 'Auto Increment' : 'Not Auto Increment'}
                      <Tooltip.Arrow className="fill-base-100" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
                </div>
              </Tooltip.Provider>
            </div>
          ) : null}
          {!hideAttributeDetails ? (
            <>
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
              {typeParamKind === 'length' ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Max Length
                  </div>
                  <div className="min-w-[140px] max-w-[220px] flex-1">
                    <Input
                      size="xs"
                      value={params.maxLength}
                      placeholder="Length"
                      onChange={(event) =>
                        onChangeTypeParams?.({ maxLength: event.target.value })
                      }
                    />
                  </div>
                </div>
              ) : null}
              {typeParamKind === 'precisionScale' ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Precision
                  </div>
                  <div className="flex min-w-[140px] max-w-[220px] flex-1 items-center gap-2">
                    <Input
                      size="xs"
                      value={params.precision}
                      placeholder="Precision"
                      onChange={(event) =>
                        onChangeTypeParams?.({ precision: event.target.value })
                      }
                    />
                    <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                      Scale
                    </div>
                    <Input
                      size="xs"
                      value={params.scale}
                      placeholder="Scale"
                      onChange={(event) =>
                        onChangeTypeParams?.({ scale: event.target.value })
                      }
                    />
                  </div>
                </div>
              ) : null}
              {typeParamKind === 'enum' ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Enumeration
                  </div>
                  <div className="min-w-[140px] max-w-[220px] flex-1">
                    <Input
                      size="xs"
                      value={params.enumValues}
                      placeholder="A, B, C"
                      onChange={(event) =>
                        onChangeTypeParams?.({ enumValues: event.target.value })
                      }
                    />
                  </div>
                </div>
              ) : null}
              {selectTypeValue !== ATTRIBUTE_TYPE_UNDEFINED ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Default value
                  </div>
                  <div className="min-w-[140px] max-w-[220px] flex-1">
                    <Input
                      size="xs"
                      value={defaultValue ?? ''}
                      placeholder="Default"
                      onChange={(event) =>
                        onChangeDefaultValue?.(event.target.value)
                      }
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="flex items-center justify-center pt-2">
            <button
              className="inline-flex h-7 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2 text-xs font-medium text-red-700 transition-colors hover:bg-base-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              type="button"
              onClick={onDelete}
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
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          </div>
          </Accordion.Content>
        </Accordion.Item>
    </li>
  )
}

