import type { Note } from "../../../shared/types.js";
import { NewNoteInput } from "./NewNoteInput.js";
import { NoteList } from "./NoteList.js";

interface SidebarProps {
  notes: Note[];
  selectedNote: Note | null;
  newNoteTitle: string | null;
  setNewNoteTitle: React.Dispatch<React.SetStateAction<string | null>>;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onContextMenu: (e: React.MouseEvent, note: Note) => void;
  onChangeWorkspace: () => void;
}

export function Sidebar({
  notes,
  selectedNote,
  newNoteTitle,
  setNewNoteTitle,
  onSelectNote,
  onCreateNote,
  onContextMenu,
  onChangeWorkspace,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <strong>Notes</strong>
      </div>
      {newNoteTitle !== null && (
        <NewNoteInput
          value={newNoteTitle}
          onChange={setNewNoteTitle}
          onCreate={onCreateNote}
          onCancel={() => setNewNoteTitle(null)}
        />
      )}
      <NoteList
        notes={notes}
        selectedNote={selectedNote}
        onSelectNote={onSelectNote}
        onContextMenu={onContextMenu}
      />
      <button onClick={onChangeWorkspace} className="change-folder">
        Change Folder
      </button>
    </div>
  );
}
