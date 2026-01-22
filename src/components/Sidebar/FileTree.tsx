import { useMemo, useCallback, useState } from "react";
import type { Note } from "../../../shared/types.js";
import { buildTree, type TreeNode } from "../../utils/fileTree.js";

interface FileTreeProps {
  notes: Note[];
  selectedNote: Note | null;
  expandedFolders: Set<string>;
  onSelectNote: (note: Note) => void;
  onToggleFolder: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, note: Note) => void;
  onFolderContextMenu: (e: React.MouseEvent, folderPath: string) => void;
  onMoveNote?: ((note: Note, targetFolder: string) => void) | undefined;
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  selectedNote: Note | null;
  expandedFolders: Set<string>;
  onSelectNote: (note: Note) => void;
  onToggleFolder: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, note: Note) => void;
  onFolderContextMenu: (e: React.MouseEvent, folderPath: string) => void;
  draggedNote: Note | null;
  dragOverFolder: string | null;
  onDragStart: (e: React.DragEvent, note: Note) => void;
  onDragOver: (e: React.DragEvent, folderPath: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetFolder: string) => void;
  onDragEnd: () => void;
}

function TreeNodeItem({
  node,
  depth,
  selectedNote,
  expandedFolders,
  onSelectNote,
  onToggleFolder,
  onContextMenu,
  onFolderContextMenu,
  draggedNote,
  dragOverFolder,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: TreeNodeItemProps) {
  const paddingLeft = depth * 12 + 8;

  if (node.type === "folder") {
    const isExpanded = expandedFolders.has(node.path);
    const isDragOver = dragOverFolder === node.path;

    return (
      <>
        <div
          className={`tree-folder ${isDragOver ? "drag-over" : ""}`}
          style={{ paddingLeft }}
          onClick={() => onToggleFolder(node.path)}
          onContextMenu={(e) => onFolderContextMenu(e, node.path)}
          onDragOver={(e) => onDragOver(e, node.path)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, node.path)}
        >
          <span className="folder-icon">{isExpanded ? "▼" : "▶"}</span>
          <span className="folder-name">{node.name}</span>
        </div>
        {isExpanded && node.children?.map((child) => (
          <TreeNodeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedNote={selectedNote}
            expandedFolders={expandedFolders}
            onSelectNote={onSelectNote}
            onToggleFolder={onToggleFolder}
            onContextMenu={onContextMenu}
            onFolderContextMenu={onFolderContextMenu}
            draggedNote={draggedNote}
            dragOverFolder={dragOverFolder}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        ))}
      </>
    );
  }

  const isSelected = selectedNote?.path === node.path;
  const isDragging = draggedNote?.path === node.path;

  return (
    <div
      className={`tree-note ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
      style={{ paddingLeft }}
      draggable
      onClick={() => node.note && onSelectNote(node.note)}
      onContextMenu={(e) => node.note && onContextMenu(e, node.note)}
      onDragStart={(e) => node.note && onDragStart(e, node.note)}
      onDragEnd={onDragEnd}
    >
      {node.name}
    </div>
  );
}

export function FileTree({
  notes,
  selectedNote,
  expandedFolders,
  onSelectNote,
  onToggleFolder,
  onContextMenu,
  onFolderContextMenu,
  onMoveNote,
}: FileTreeProps) {
  const tree = useMemo(() => buildTree(notes), [notes]);

  // Drag and drop state
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, note: Note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", note.path);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolder(folderPath);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverFolder(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    if (draggedNote && onMoveNote) {
      onMoveNote(draggedNote, targetFolder);
    }
    setDraggedNote(null);
  }, [draggedNote, onMoveNote]);

  const handleDragEnd = useCallback(() => {
    setDraggedNote(null);
    setDragOverFolder(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Basic keyboard support - can be enhanced later
    if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  }, []);

  // Handle root-level drop (move note to workspace root)
  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    // Only handle if not over a child element
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverFolder("");
    }
  }, []);

  const handleRootDrop = useCallback((e: React.DragEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      setDragOverFolder(null);
      if (draggedNote && onMoveNote) {
        onMoveNote(draggedNote, "");
      }
      setDraggedNote(null);
    }
  }, [draggedNote, onMoveNote]);

  return (
    <div
      className={`file-tree ${dragOverFolder === "" ? "drag-over-root" : ""}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => {
        // Right-click on empty space creates folder in root
        if (e.target === e.currentTarget) {
          onFolderContextMenu(e, "");
        }
      }}
      onDragOver={handleRootDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleRootDrop}
    >
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          selectedNote={selectedNote}
          expandedFolders={expandedFolders}
          onSelectNote={onSelectNote}
          onToggleFolder={onToggleFolder}
          onContextMenu={onContextMenu}
          onFolderContextMenu={onFolderContextMenu}
          draggedNote={draggedNote}
          dragOverFolder={dragOverFolder}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
