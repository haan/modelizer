import { memo } from 'react'
import { ClassesPanel, RefsPanel } from '../panels/index.js'

function InfoPanel({
  width,
  onResizeStart,
  activeItem,
  nodes,
  edges,
  onAddClass,
  onRenameClass,
  onReorderClasses,
  onReorderAttributes,
  onUpdateAttribute,
  onAddAttribute,
  onDeleteAttribute,
  onUpdateClassColor,
  onUpdateClassVisibility,
  onDeleteClass,
  onHighlightClass,
  showAccentColors,
  onRenameAssociation,
  onDeleteAssociation,
  onUpdateAssociationMultiplicity,
  onUpdateAssociationRole,
  onHighlightAssociation,
}) {
  return (
    <aside
      className="relative flex min-w-[350px] flex-col border-r border-base-content/10 bg-base-100"
      style={{ width }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          {activeItem === 'tables' ? (
            <ClassesPanel
              nodes={nodes}
              onAddClass={onAddClass}
              onRenameClass={onRenameClass}
              onReorderClasses={onReorderClasses}
              onReorderAttributes={onReorderAttributes}
              onUpdateAttribute={onUpdateAttribute}
              onAddAttribute={onAddAttribute}
              onDeleteAttribute={onDeleteAttribute}
              onUpdateClassColor={onUpdateClassColor}
              onUpdateClassVisibility={onUpdateClassVisibility}
              onDeleteClass={onDeleteClass}
              onHighlightClass={onHighlightClass}
              showAccentColors={showAccentColors}
            />
          ) : activeItem === 'refs' ? (
            <RefsPanel
              edges={edges}
              nodes={nodes}
              onRenameAssociation={onRenameAssociation}
              onDeleteAssociation={onDeleteAssociation}
              onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
              onUpdateAssociationRole={onUpdateAssociationRole}
              onHighlightAssociation={onHighlightAssociation}
            />
          ) : (
            <p className="text-sm opacity-70">
              Select Classes to browse classes in this model.
            </p>
          )}
        </div>
      </div>
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-base-300/60"
        onPointerDown={onResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize information panel"
      />
    </aside>
  )
}

export default memo(InfoPanel)
