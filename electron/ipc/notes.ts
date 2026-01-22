import { ipcMain } from "electron";
import fs from "fs/promises";
import path from "path";
import { DateTime } from "luxon";
import { getWorkspacePath } from "./workspace.js";
import { markFileWritten } from "./watcher.js";
import { getUniqueLinks } from "../../shared/links.js";
import { getUniqueTags } from "../../shared/tags.js";
import { loadConfig } from "../config.js";
import type { Note, SearchResult } from "../../shared/types.js";

// Recursively list all notes in a directory and its subdirectories
async function listNotesRecursive(dir: string, workspace: string): Promise<Note[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const notes: Note[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      // Recurse into subdirectories (skip hidden folders)
      notes.push(...await listNotesRecursive(fullPath, workspace));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const relativePath = path.relative(workspace, dir);
      notes.push({
        path: fullPath,
        title: entry.name.replace(/\.md$/, ""),
        folder: relativePath || "",
      });
    }
  }

  return notes;
}

export function registerNotesHandlers() {
  ipcMain.handle("notes:list", async (): Promise<Note[]> => {
    const workspace = getWorkspacePath();
    if (!workspace) return [];

    const notes = await listNotesRecursive(workspace, workspace);
    return notes.sort((a, b) => a.title.localeCompare(b.title));
  });

  ipcMain.handle("notes:read", async (_, notePath: string): Promise<string> => {
    const workspace = getWorkspacePath();
    if (!workspace) throw new Error("No workspace selected");

    // Security: ensure path is within workspace
    const resolved = path.resolve(notePath);
    if (!resolved.startsWith(workspace)) {
      throw new Error("Path outside workspace");
    }

    return fs.readFile(resolved, "utf-8");
  });

  ipcMain.handle(
    "notes:write",
    async (_, notePath: string, content: string): Promise<void> => {
      const workspace = getWorkspacePath();
      if (!workspace) throw new Error("No workspace selected");

      const resolved = path.resolve(notePath);
      if (!resolved.startsWith(workspace)) {
        throw new Error("Path outside workspace");
      }

      // Atomic write: write to temp in same directory, then rename
      const tempPath = `${resolved}.${Date.now()}.tmp`;
      await fs.writeFile(tempPath, content, "utf-8");
      await fs.rename(tempPath, resolved);
      markFileWritten(resolved);
    }
  );

  ipcMain.handle("notes:create", async (_, title: string, folder?: string): Promise<Note> => {
    const workspace = getWorkspacePath();
    if (!workspace) throw new Error("No workspace selected");

    // Determine target directory
    const targetDir = folder ? path.join(workspace, folder) : workspace;

    // Security: ensure path is within workspace
    const resolvedDir = path.resolve(targetDir);
    if (!resolvedDir.startsWith(workspace)) {
      throw new Error("Path outside workspace");
    }

    // Ensure directory exists
    await fs.mkdir(resolvedDir, { recursive: true });

    const filename = `${title}.md`;
    const notePath = path.join(resolvedDir, filename);

    // Check if file already exists
    try {
      await fs.access(notePath);
      throw new Error("Note already exists");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }

    // Create empty file with atomic write
    const tempPath = `${notePath}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, "", "utf-8");
    await fs.rename(tempPath, notePath);
    markFileWritten(notePath);

    return { path: notePath, title, folder: folder || "" };
  });

  ipcMain.handle("notes:delete", async (_, notePath: string): Promise<void> => {
    const workspace = getWorkspacePath();
    if (!workspace) throw new Error("No workspace selected");

    const resolved = path.resolve(notePath);
    if (!resolved.startsWith(workspace)) {
      throw new Error("Path outside workspace");
    }

    markFileWritten(resolved);
    await fs.unlink(resolved);
  });

  ipcMain.handle(
    "notes:rename",
    async (_, notePath: string, newTitle: string): Promise<Note> => {
      const workspace = getWorkspacePath();
      if (!workspace) throw new Error("No workspace selected");

      const resolved = path.resolve(notePath);
      if (!resolved.startsWith(workspace)) {
        throw new Error("Path outside workspace");
      }

      const oldTitle = path.basename(resolved, ".md");
      const noteDir = path.dirname(resolved);
      const newPath = path.join(noteDir, `${newTitle}.md`);
      const folder = path.relative(workspace, noteDir) || "";

      // Check if new name already exists
      try {
        await fs.access(newPath);
        throw new Error("A note with that name already exists");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }

      // Rename the file
      markFileWritten(resolved);
      markFileWritten(newPath);
      await fs.rename(resolved, newPath);

      // Update all notes that link to the old title (recursively scan all notes)
      const allNotes = await listNotesRecursive(workspace, workspace);
      for (const note of allNotes) {
        const content = await fs.readFile(note.path, "utf-8");

        // Replace [[oldTitle]] with [[newTitle]]
        const oldLink = `[[${oldTitle}]]`;
        const newLink = `[[${newTitle}]]`;
        if (content.includes(oldLink)) {
          const updatedContent = content.split(oldLink).join(newLink);
          const tempPath = `${note.path}.${Date.now()}.tmp`;
          await fs.writeFile(tempPath, updatedContent, "utf-8");
          await fs.rename(tempPath, note.path);
          markFileWritten(note.path);
        }
      }

      return { path: newPath, title: newTitle, folder };
    }
  );

  ipcMain.handle(
    "notes:move",
    async (_, notePath: string, targetFolder: string): Promise<Note> => {
      const workspace = getWorkspacePath();
      if (!workspace) throw new Error("No workspace selected");

      // Validate source path
      const resolvedSource = path.resolve(notePath);
      if (!resolvedSource.startsWith(workspace)) {
        throw new Error("Path outside workspace");
      }

      // Build target path
      const filename = path.basename(resolvedSource);
      const targetDir = targetFolder ? path.join(workspace, targetFolder) : workspace;
      const resolvedTargetDir = path.resolve(targetDir);

      if (!resolvedTargetDir.startsWith(workspace)) {
        throw new Error("Target path outside workspace");
      }

      const targetPath = path.join(resolvedTargetDir, filename);

      // Skip if already in target folder
      if (resolvedSource === targetPath) {
        const title = path.basename(resolvedSource, ".md");
        return { path: resolvedSource, title, folder: targetFolder };
      }

      // Check for duplicate at destination
      try {
        await fs.access(targetPath);
        throw new Error("A note with that name already exists in the target folder");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }

      // Create target directory if needed
      await fs.mkdir(resolvedTargetDir, { recursive: true });

      // Move the file
      markFileWritten(resolvedSource);
      markFileWritten(targetPath);
      await fs.rename(resolvedSource, targetPath);

      const title = path.basename(targetPath, ".md");
      return { path: targetPath, title, folder: targetFolder };
    }
  );

  ipcMain.handle(
    "notes:getBacklinks",
    async (_, targetTitle: string): Promise<Note[]> => {
      const workspace = getWorkspacePath();
      if (!workspace) return [];

      const allNotes = await listNotesRecursive(workspace, workspace);
      const backlinks: Note[] = [];

      for (const note of allNotes) {
        // Skip the target note itself
        if (note.title === targetTitle) continue;

        const content = await fs.readFile(note.path, "utf-8");
        const links = getUniqueLinks(content);

        if (links.includes(targetTitle)) {
          backlinks.push(note);
        }
      }

      return backlinks.sort((a, b) => a.title.localeCompare(b.title));
    }
  );

  ipcMain.handle(
    "notes:search",
    async (_, query: string): Promise<SearchResult[]> => {
      const workspace = getWorkspacePath();
      if (!workspace || !query.trim()) return [];

      const searchTerm = query.toLowerCase();
      const allNotes = await listNotesRecursive(workspace, workspace);
      const results: SearchResult[] = [];

      for (const note of allNotes) {
        const content = await fs.readFile(note.path, "utf-8");

        const titleMatch = note.title.toLowerCase().includes(searchTerm);
        const contentMatch = content.toLowerCase().includes(searchTerm);

        if (titleMatch || contentMatch) {
          let snippet: string | undefined;
          if (contentMatch && !titleMatch) {
            // Extract snippet around the match
            const lowerContent = content.toLowerCase();
            const matchIndex = lowerContent.indexOf(searchTerm);
            const start = Math.max(0, matchIndex - 40);
            const end = Math.min(content.length, matchIndex + searchTerm.length + 40);
            snippet = (start > 0 ? "..." : "") +
                      content.slice(start, end).replace(/\n/g, " ") +
                      (end < content.length ? "..." : "");
          }

          const result: SearchResult = {
            note,
            matchType: titleMatch ? "title" : "content",
          };
          if (snippet) {
            result.snippet = snippet;
          }
          results.push(result);
        }
      }

      // Sort: title matches first, then by title alphabetically
      return results.sort((a, b) => {
        if (a.matchType === "title" && b.matchType !== "title") return -1;
        if (a.matchType !== "title" && b.matchType === "title") return 1;
        return a.note.title.localeCompare(b.note.title);
      });
    }
  );

  ipcMain.handle("notes:openDaily", async (): Promise<Note> => {
    const workspace = getWorkspacePath();
    if (!workspace) throw new Error("No workspace selected");

    const config = await loadConfig();
    const { format, prefix, suffix } = config.dailyNote;

    // Format today's date using Luxon
    let dateStr: string;
    try {
      dateStr = DateTime.now().toFormat(format);
    } catch {
      // Fallback to default format if invalid
      dateStr = DateTime.now().toFormat("yyyy-MM-dd");
    }

    const title = `${prefix}${dateStr}${suffix}`;
    const filename = `${title}.md`;
    const notePath = path.join(workspace, filename);

    // Check if file already exists
    try {
      await fs.access(notePath);
      // File exists, return it
      return { path: notePath, title, folder: "" };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }

    // Create empty file with atomic write
    const tempPath = `${notePath}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, "", "utf-8");
    await fs.rename(tempPath, notePath);
    markFileWritten(notePath);

    return { path: notePath, title, folder: "" };
  });

  ipcMain.handle(
    "notes:getNotesWithTag",
    async (_, tag: string): Promise<Note[]> => {
      const workspace = getWorkspacePath();
      if (!workspace || !tag.trim()) return [];

      const allNotes = await listNotesRecursive(workspace, workspace);
      const matchingNotes: Note[] = [];

      for (const note of allNotes) {
        const content = await fs.readFile(note.path, "utf-8");

        const tags = getUniqueTags(content);
        if (tags.includes(tag)) {
          matchingNotes.push(note);
        }
      }

      return matchingNotes.sort((a, b) => a.title.localeCompare(b.title));
    }
  );
}

export function registerFoldersHandlers() {
  ipcMain.handle(
    "folders:create",
    async (_, name: string, parentFolder?: string): Promise<string> => {
      const workspace = getWorkspacePath();
      if (!workspace) throw new Error("No workspace selected");

      // Build the full path
      const relativePath = parentFolder ? path.join(parentFolder, name) : name;
      const fullPath = path.join(workspace, relativePath);

      // Security: ensure path is within workspace
      const resolved = path.resolve(fullPath);
      if (!resolved.startsWith(workspace)) {
        throw new Error("Path outside workspace");
      }

      // Check if folder already exists
      try {
        await fs.access(fullPath);
        throw new Error("Folder already exists");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }

      // Create the folder
      await fs.mkdir(fullPath, { recursive: true });

      return relativePath;
    }
  );
}
