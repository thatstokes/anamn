import type { Note } from "../../../shared/types.js";
import { NewNoteInput } from "./NewNoteInput.js";
import { FileTree } from "./FileTree.js";

interface SidebarProps {
  notes: Note[];
  selectedNote: Note | null;
  newNoteTitle: string | null;
  setNewNoteTitle: React.Dispatch<React.SetStateAction<string | null>>;
  expandedFolders: Set<string>;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onToggleFolder: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, note: Note) => void;
  onChangeWorkspace: () => void;
  onImportChess?: (url: string) => Promise<void>;
  isImporting?: boolean;
  width?: number;
}

export function Sidebar({
  notes,
  selectedNote,
  newNoteTitle,
  setNewNoteTitle,
  expandedFolders,
  onSelectNote,
  onCreateNote,
  onToggleFolder,
  onContextMenu,
  onChangeWorkspace,
  onImportChess,
  isImporting,
  width,
}: SidebarProps) {
  return (
    <div className="sidebar" style={width ? { width } : undefined}>
      <div className="sidebar-header">
        <strong>Notes</strong>
      </div>
      {newNoteTitle !== null && (
        <NewNoteInput
          value={newNoteTitle}
          onChange={setNewNoteTitle}
          onCreate={onCreateNote}
          onCancel={() => setNewNoteTitle(null)}
          onImportChess={onImportChess}
          isImporting={isImporting}
        />
      )}
      <FileTree
        notes={notes}
        selectedNote={selectedNote}
        expandedFolders={expandedFolders}
        onSelectNote={onSelectNote}
        onToggleFolder={onToggleFolder}
        onContextMenu={onContextMenu}
      />
      <button onClick={onChangeWorkspace} className="change-folder">
        Change Folder
      </button>
    </div>
  );
}
