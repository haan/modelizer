import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import ClassesPanelAttributesItem from './ClassesPanelAttributesItem.jsx'
import { ATTRIBUTE_TYPE_PARAMS_DEFAULT } from '../../attributes.js'

export default function ClassesPanelAttributesPanel({
  attributes,
  nodeId,
  onReorderAttributes,
  onUpdateAttribute,
  onAddAttribute,
  onDeleteAttribute,
  activeView,
  viewSpecificSettingsOnly,
}) {
  const attributeIds = attributes.map((attribute) => attribute.id)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = attributeIds.indexOf(active.id)
    const newIndex = attributeIds.indexOf(over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const nextAttributes = arrayMove(attributes, oldIndex, newIndex)
    onReorderAttributes?.(nodeId, nextAttributes)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={attributeIds}
        strategy={verticalListSortingStrategy}
      >
        <ul className="mt-2 flex flex-col gap-1">
          {attributes.map((attribute) => (
            <ClassesPanelAttributesItem
              key={attribute.id}
              id={attribute.id}
              name={attribute.name}
              logicalName={attribute.logicalName}
              type={attribute.type}
              typeParams={attribute.typeParams}
              defaultValue={attribute.defaultValue}
              nullable={attribute.nullable}
              unique={attribute.unique}
              autoIncrement={attribute.autoIncrement}
              visibility={attribute.visibility}
              activeView={activeView}
              viewSpecificSettingsOnly={viewSpecificSettingsOnly}
              onChangeName={(nextValue) =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  name: nextValue,
                })
              }
              onChangeLogicalName={(nextValue) =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  logicalName: nextValue,
                })
              }
              onChangeType={(nextValue) =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  type: nextValue,
                  typeParams: { ...ATTRIBUTE_TYPE_PARAMS_DEFAULT },
                  defaultValue: '',
                })
              }
              onChangeTypeParams={(nextValue) =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  typeParams: nextValue,
                })
              }
              onChangeDefaultValue={(nextValue) =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  defaultValue: nextValue,
                })
              }
              onToggleNullable={() =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  nullable: !attribute.nullable,
                })
              }
              onToggleUnique={() =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  unique: !attribute.unique,
                })
              }
              onToggleAutoIncrement={() =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  autoIncrement: !attribute.autoIncrement,
                })
              }
              onChangeVisibility={(nextVisibility) =>
                onUpdateAttribute?.(nodeId, attribute.id, {
                  visibility: nextVisibility,
                })
              }
              onDelete={() => onDeleteAttribute?.(nodeId, attribute.id)}
            />
          ))}
          <li>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-base-content/70 hover:bg-base-300 hover:text-base-content"
              onClick={() => onAddAttribute?.(nodeId)}
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
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add attribute
            </button>
          </li>
        </ul>
      </SortableContext>
    </DndContext>
  )
}
