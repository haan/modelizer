import { useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
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
import { ATTRIBUTE_TYPE_PARAMS_DEFAULT } from '../../../attributes.js'

export default function ClassesPanelAttributesPanel({
  attributes,
  nodeId,
  onReorderAttributes,
  onUpdateAttribute,
  onDeleteAttribute,
  activeView,
  viewSpecificSettingsOnly,
  openAttributeId: controlledOpenAttributeId,
  onOpenAttributeIdChange,
}) {
  const attributeIds = attributes.map((attribute) => attribute.id)
  const [uncontrolledOpenAttributeId, setUncontrolledOpenAttributeId] =
    useState('')
  const openAttributeId =
    typeof controlledOpenAttributeId === 'string'
      ? controlledOpenAttributeId
      : uncontrolledOpenAttributeId
  const setOpenAttributeId =
    onOpenAttributeIdChange ?? setUncontrolledOpenAttributeId
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
        <Accordion.Root
          type="single"
          collapsible
          value={openAttributeId}
          onValueChange={setOpenAttributeId}
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
                isOpen={openAttributeId === attribute.id}
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
          </ul>
        </Accordion.Root>
      </SortableContext>
    </DndContext>
  )
}

