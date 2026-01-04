import type { Note } from "../../shared/types.js";
import { styles } from "../styles/styles.js";

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
      style={{
        ...styles.contextMenu,
        left: x,
        top: y,
      }}
    >
      <div style={styles.contextMenuItem} onClick={onRename}>
        Rename
      </div>
      <div style={styles.contextMenuItem} onClick={onDelete}>
        Delete
      </div>
    </div>
  );
}
