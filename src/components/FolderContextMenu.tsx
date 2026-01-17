interface FolderContextMenuProps {
  folderPath: string;
  x: number;
  y: number;
  onNewFolder: () => void;
  onNewNote: () => void;
}

export function FolderContextMenu({
  folderPath,
  x,
  y,
  onNewFolder,
  onNewNote,
}: FolderContextMenuProps) {
  const label = folderPath ? `in ${folderPath}` : "in root";

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
    >
      <div className="context-menu-item" onClick={onNewFolder}>
        New Folder {label}
      </div>
      <div className="context-menu-item" onClick={onNewNote}>
        New Note {label}
      </div>
    </div>
  );
}
