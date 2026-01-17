import { useMemo, useCallback } from "react";
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
}: TreeNodeItemProps) {
  const paddingLeft = depth * 12 + 8;

  if (node.type === "folder") {
    const isExpanded = expandedFolders.has(node.path);

    return (
      <>
        <div
          className="tree-folder"
          style={{ paddingLeft }}
          onClick={() => onToggleFolder(node.path)}
          onContextMenu={(e) => onFolderContextMenu(e, node.path)}
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
          />
        ))}
      </>
    );
  }

  const isSelected = selectedNote?.path === node.path;

  return (
    <div
      className={`tree-note ${isSelected ? "selected" : ""}`}
      style={{ paddingLeft }}
      onClick={() => node.note && onSelectNote(node.note)}
      onContextMenu={(e) => node.note && onContextMenu(e, node.note)}
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
}: FileTreeProps) {
  const tree = useMemo(() => buildTree(notes), [notes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Basic keyboard support - can be enhanced later
    if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  }, []);

  return (
    <div
      className="file-tree"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => {
        // Right-click on empty space creates folder in root
        if (e.target === e.currentTarget) {
          onFolderContextMenu(e, "");
        }
      }}
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
        />
      ))}
    </div>
  );
}
