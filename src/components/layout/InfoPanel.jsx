import { memo, useMemo } from 'react'
import {
  ClassesPanel,
  AreasPanel,
  NotesPanel,
  RefsPanel,
} from '../panels/index.js'
import {
  AREA_NODE_TYPE,
  CLASS_NODE_TYPE,
  NOTE_NODE_TYPE,
} from '../../model/constants.js'

function InfoPanel({
  width,
  onResizeStart,
  activeItem,
  nodes,
  edges,
  activeView,
  viewSpecificSettingsOnly,
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
  showCompositionAggregation,
  onToggleAssociationComposition,
  onHighlightAssociation,
  onAddNote,
  onRenameNote,
  onUpdateNoteText,
  onUpdateNoteVisibility,
  onDeleteNote,
  onHighlightNote,
  onAddArea,
  onRenameArea,
  onUpdateAreaColor,
  onUpdateAreaVisibility,
  onDeleteArea,
  onHighlightArea,
  showNotes = true,
  showAreas = true,
}) {
  const classNodes = useMemo(
    () => nodes.filter((node) => node.type === CLASS_NODE_TYPE),
    [nodes],
  )
  const noteNodes = useMemo(
    () => nodes.filter((node) => node.type === NOTE_NODE_TYPE),
    [nodes],
  )
  const areaNodes = useMemo(
    () => nodes.filter((node) => node.type === AREA_NODE_TYPE),
    [nodes],
  )

  return (
    <aside
      className="relative flex min-w-[350px] flex-col border-r border-base-content/10 bg-base-100"
      style={{ width }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          {activeItem === 'tables' ? (
            <ClassesPanel
              nodes={classNodes}
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
              activeView={activeView}
              viewSpecificSettingsOnly={viewSpecificSettingsOnly}
            />
          ) : activeItem === 'notes' ? (
            showNotes ? (
              <NotesPanel
                nodes={noteNodes}
                onAddNote={onAddNote}
                onRenameNote={onRenameNote}
                onUpdateNoteText={onUpdateNoteText}
                onUpdateNoteVisibility={onUpdateNoteVisibility}
                onDeleteNote={onDeleteNote}
                onHighlightNote={onHighlightNote}
              />
            ) : (
              <p className="text-sm opacity-70">
                Notes are disabled in Settings.
              </p>
            )
          ) : activeItem === 'areas' ? (
            showAreas ? (
              <AreasPanel
                nodes={areaNodes}
                onAddArea={onAddArea}
                onRenameArea={onRenameArea}
                onUpdateAreaColor={onUpdateAreaColor}
                onUpdateAreaVisibility={onUpdateAreaVisibility}
                onDeleteArea={onDeleteArea}
                onHighlightArea={onHighlightArea}
              />
            ) : (
              <p className="text-sm opacity-70">
                Areas are disabled in Settings.
              </p>
            )
          ) : activeItem === 'refs' ? (
            <RefsPanel
              edges={edges}
              nodes={nodes}
              activeView={activeView}
              viewSpecificSettingsOnly={viewSpecificSettingsOnly}
              showCompositionAggregation={showCompositionAggregation}
              onRenameAssociation={onRenameAssociation}
              onDeleteAssociation={onDeleteAssociation}
              onUpdateAssociationMultiplicity={onUpdateAssociationMultiplicity}
              onUpdateAssociationRole={onUpdateAssociationRole}
              onToggleAssociationComposition={onToggleAssociationComposition}
              onHighlightAssociation={onHighlightAssociation}
            />
          ) : (
            <p className="text-sm opacity-70">
              Select a panel to browse this model.
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
