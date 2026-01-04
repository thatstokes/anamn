import type { Note } from "../../shared/types.js";

interface ContextMenuProps {
  note: Note;
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
}

export function ContextMenu({
  x,
  y,
  onRename,
  onDelete,
}: ContextMenuProps) {
  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
    >
      <div className="context-menu-item" onClick={onRename}>
        Rename
      </div>
      <div className="context-menu-item" onClick={onDelete}>
        Delete
      </div>
    </div>
  );
}
