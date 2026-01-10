import { ClassesPanel } from '../panels/index.js'

export default function InfoPanel({
  width,
  onResizeStart,
  activeItem,
  nodes,
  onAddClass,
  onRenameClass,
  onReorderClasses,
  onReorderAttributes,
  onUpdateAttribute,
  onAddAttribute,
  onUpdateClassColor,
}) {
  return (
    <aside
      className="relative min-w-[350px] overflow-auto border-r border-base-content/10 bg-base-100"
      style={{ width }}
    >
      <div className="flex h-full flex-col gap-4 p-6">
        {activeItem === 'tables' ? (
          <ClassesPanel
            nodes={nodes}
            onAddClass={onAddClass}
            onRenameClass={onRenameClass}
            onReorderClasses={onReorderClasses}
            onReorderAttributes={onReorderAttributes}
            onUpdateAttribute={onUpdateAttribute}
            onAddAttribute={onAddAttribute}
            onUpdateClassColor={onUpdateClassColor}
          />
        ) : (
          <p className="text-sm opacity-70">
            Select Classes to browse classes in this model.
          </p>
        )}
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
