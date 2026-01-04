import type { Note, ViewMode } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";

interface EditorHeaderProps {
  selectedNote: Note;
  isRenaming: boolean;
  renameTitle: string;
  setRenameTitle: (title: string) => void;
  onStartRename: () => void;
  onRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
}

export function EditorHeader({
  selectedNote,
  isRenaming,
  renameTitle,
  setRenameTitle,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
  viewMode,
  setViewMode,
}: EditorHeaderProps) {
  return (
    <div style={styles.editorHeader}>
      {isRenaming ? (
        <input
          type="text"
          value={renameTitle}
          onChange={(e) => setRenameTitle(e.target.value)}
          onBlur={onRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRename();
            if (e.key === "Escape") onCancelRename();
          }}
          autoFocus
          style={styles.renameTitleInput}
        />
      ) : (
        <span
          onClick={onStartRename}
          style={styles.editableTitle}
          title="Click to rename"
        >
          {selectedNote.title}
        </span>
      )}
      <div style={styles.editorActions}>
        <button
          onClick={onDelete}
          style={styles.deleteButton}
          title="Delete note"
        >
          🗑
        </button>
        <div style={styles.viewModeToggle}>
          <button
            onClick={() => setViewMode("edit")}
            style={{
              ...styles.viewModeButton,
              background: viewMode === "edit" ? "#444" : "#333",
            }}
          >
            Edit
          </button>
          <button
            onClick={() => setViewMode("rendered")}
            style={{
              ...styles.viewModeButton,
              background: viewMode === "rendered" ? "#444" : "#333",
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
