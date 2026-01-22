import type { Note } from "../../../shared/types.js";
import { NewNoteInput } from "./NewNoteInput.js";
import { FileTree } from "./FileTree.js";

interface SidebarProps {
  notes: Note[];
  folders: string[];
  selectedNote: Note | null;
  newNoteTitle: string | null;
  setNewNoteTitle: React.Dispatch<React.SetStateAction<string | null>>;
  newFolderName: string | null;
  setNewFolderName: React.Dispatch<React.SetStateAction<string | null>>;
  newFolderParent: string;
  expandedFolders: Set<string>;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onToggleFolder: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, note: Note) => void;
  onFolderContextMenu: (e: React.MouseEvent, folderPath: string) => void;
  onChangeWorkspace: () => void;
  onMoveNote?: (note: Note, targetFolder: string) => void;
  onImportChess?: (url: string) => Promise<void>;
  isImporting?: boolean;
  width?: number;
}

export function Sidebar({
  notes,
  folders,
  selectedNote,
  newNoteTitle,
  setNewNoteTitle,
  newFolderName,
  setNewFolderName,
  newFolderParent,
  expandedFolders,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
  onToggleFolder,
  onContextMenu,
  onFolderContextMenu,
  onChangeWorkspace,
  onMoveNote,
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
      {newFolderName !== null && (
        <div className="new-note-input">
          <input
            type="text"
            className="new-note-input-field"
            placeholder={newFolderParent ? `New folder in ${newFolderParent}...` : "New folder..."}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onCreateFolder();
              } else if (e.key === "Escape") {
                setNewFolderName(null);
              }
            }}
            autoFocus
          />
        </div>
      )}
      <FileTree
        notes={notes}
        folders={folders}
        selectedNote={selectedNote}
        expandedFolders={expandedFolders}
        onSelectNote={onSelectNote}
        onToggleFolder={onToggleFolder}
        onContextMenu={onContextMenu}
        onFolderContextMenu={onFolderContextMenu}
        onMoveNote={onMoveNote}
      />
      <button onClick={onChangeWorkspace} className="change-folder">
        Change Folder
      </button>
    </div>
  );
}
