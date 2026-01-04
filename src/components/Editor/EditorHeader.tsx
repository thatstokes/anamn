import type { Note, ViewMode } from "../../../shared/types.js";

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
    <div className="editor-header">
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
          className="rename-title-input"
        />
      ) : (
        <span
          onClick={onStartRename}
          className="editable-title"
          title="Click to rename"
        >
          {selectedNote.title}
        </span>
      )}
      <div className="editor-actions">
        <button
          onClick={onDelete}
          className="delete-button"
          title="Delete note"
        >
          🗑
        </button>
        <div className="view-mode-toggle">
          <button
            onClick={() => setViewMode("edit")}
            className={`view-mode-button ${viewMode === "edit" ? "active" : ""}`}
          >
            Edit
          </button>
          <button
            onClick={() => setViewMode("rendered")}
            className={`view-mode-button ${viewMode === "rendered" ? "active" : ""}`}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
