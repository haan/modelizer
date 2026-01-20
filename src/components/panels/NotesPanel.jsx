import { useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import NotesPanelItem from './NotesPanelItem.jsx'

export default function NotesPanel({
  nodes,
  onAddNote,
  onRenameNote,
  onUpdateNoteText,
  onDeleteNote,
  onHighlightNote,
}) {
  const [openNoteId, setOpenNoteId] = useState('')

  if (!nodes.length) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
            Notes
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-base-content/70 hover:bg-base-300 hover:text-base-content"
            type="button"
            onClick={onAddNote}
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
            Add note
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-60 py-1">
          Notes
        </div>
        <button
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-base-content/70 hover:bg-base-300 hover:text-base-content"
          type="button"
          onClick={onAddNote}
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
          Add note
        </button>
      </div>
      <Accordion.Root
        type="single"
        collapsible
        value={openNoteId}
        onValueChange={setOpenNoteId}
        className="flex flex-col gap-1"
      >
        {nodes.map((note) => (
          <NotesPanelItem
            key={note.id}
            note={note}
            isOpen={openNoteId === note.id}
            onToggleOpen={(nextOpen) => setOpenNoteId(nextOpen)}
            onRename={onRenameNote}
            onUpdateText={onUpdateNoteText}
            onDelete={onDeleteNote}
            onHighlight={onHighlightNote}
          />
        ))}
      </Accordion.Root>
    </div>
  )
}
