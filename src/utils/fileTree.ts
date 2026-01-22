import type { Note } from "../../shared/types.js";

export interface TreeNode {
  name: string;
  path: string;  // Full path for folders, note path for files
  type: "folder" | "note";
  children?: TreeNode[];
  note?: Note;  // Only for type: 'note'
}

/**
 * Build a hierarchical tree structure from a flat list of notes.
 * Notes are organized by their folder paths, with folders sorted first,
 * then alphabetically within each level.
 *
 * @param notes - List of notes to build the tree from
 * @param folders - Optional list of all folder paths (including empty ones)
 */
export function buildTree(notes: Note[], folders?: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();

  // Helper to ensure a folder path exists in the tree
  function ensureFolderExists(folderPath: string): void {
    const folderParts = folderPath.split("/");
    let currentPath = "";
    let parent: TreeNode[] = root;

    for (const part of folderParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let folder = folderMap.get(currentPath);
      if (!folder) {
        folder = {
          name: part,
          path: currentPath,
          type: "folder",
          children: [],
        };
        folderMap.set(currentPath, folder);
        parent.push(folder);
      }
      parent = folder.children!;
    }
  }

  // First, ensure all folders exist (including empty ones)
  if (folders) {
    for (const folderPath of folders) {
      if (folderPath) {
        ensureFolderExists(folderPath);
      }
    }
  }

  // Sort notes so folders are processed in order
  const sortedNotes = [...notes].sort((a, b) => {
    // Sort by folder first, then by title
    if (a.folder !== b.folder) {
      return a.folder.localeCompare(b.folder);
    }
    return a.title.localeCompare(b.title);
  });

  for (const note of sortedNotes) {
    if (!note.folder) {
      // Root level note
      root.push({
        name: note.title,
        path: note.path,
        type: "note",
        note,
      });
    } else {
      // Note in a folder - ensure folder exists and add note
      ensureFolderExists(note.folder);
      const folder = folderMap.get(note.folder);
      if (folder?.children) {
        folder.children.push({
          name: note.title,
          path: note.path,
          type: "note",
          note,
        });
      }
    }
  }

  // Sort each level: folders first, then alphabetically
  function sortChildren(nodes: TreeNode[]): void {
    nodes.sort((a, b) => {
      // Folders before notes
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      // Alphabetically within type
      return a.name.localeCompare(b.name);
    });

    // Recursively sort children
    for (const node of nodes) {
      if (node.children) {
        sortChildren(node.children);
      }
    }
  }

  sortChildren(root);
  return root;
}

/**
 * Get all folder paths from a tree (for expand/collapse state).
 */
export function getAllFolderPaths(tree: TreeNode[]): string[] {
  const paths: string[] = [];

  function traverse(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.type === "folder") {
        paths.push(node.path);
        if (node.children) {
          traverse(node.children);
        }
      }
    }
  }

  traverse(tree);
  return paths;
}
