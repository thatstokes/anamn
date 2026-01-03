import { ipcMain } from "electron";
import fs from "fs/promises";
import path from "path";
import { getWorkspacePath } from "./workspace.js";
import { markFileWritten } from "./watcher.js";
import { getUniqueLinks } from "../../shared/links.js";
import type { Note, SearchResult } from "../../shared/types.js";

export function registerNotesHandlers() {
  ipcMain.handle("notes:list", async (): Promise<Note[]> => {
    const workspace = getWorkspacePath();
    if (!workspace) return [];

    const entries = await fs.readdir(workspace, { withFileTypes: true });
    const notes: Note[] = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        notes.push({
          path: path.join(workspace, entry.name),
          title: entry.name.replace(/\.md$/, ""),
        });
      }
    }

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

  ipcMain.handle("notes:create", async (_, title: string): Promise<Note> => {
    const workspace = getWorkspacePath();
    if (!workspace) throw new Error("No workspace selected");

    const filename = `${title}.md`;
    const notePath = path.join(workspace, filename);

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

    return { path: notePath, title };
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
      const newPath = path.join(workspace, `${newTitle}.md`);

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

      // Update all notes that link to the old title
      const entries = await fs.readdir(workspace, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          const filePath = path.join(workspace, entry.name);
          const content = await fs.readFile(filePath, "utf-8");

          // Replace [[oldTitle]] with [[newTitle]]
          const oldLink = `[[${oldTitle}]]`;
          const newLink = `[[${newTitle}]]`;
          if (content.includes(oldLink)) {
            const updatedContent = content.split(oldLink).join(newLink);
            const tempPath = `${filePath}.${Date.now()}.tmp`;
            await fs.writeFile(tempPath, updatedContent, "utf-8");
            await fs.rename(tempPath, filePath);
            markFileWritten(filePath);
          }
        }
      }

      return { path: newPath, title: newTitle };
    }
  );

  ipcMain.handle(
    "notes:getBacklinks",
    async (_, targetTitle: string): Promise<Note[]> => {
      const workspace = getWorkspacePath();
      if (!workspace) return [];

      const entries = await fs.readdir(workspace, { withFileTypes: true });
      const backlinks: Note[] = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          const notePath = path.join(workspace, entry.name);
          const title = entry.name.replace(/\.md$/, "");

          // Skip the target note itself
          if (title === targetTitle) continue;

          const content = await fs.readFile(notePath, "utf-8");
          const links = getUniqueLinks(content);

          if (links.includes(targetTitle)) {
            backlinks.push({ path: notePath, title });
          }
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
      const entries = await fs.readdir(workspace, { withFileTypes: true });
      const results: SearchResult[] = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          const notePath = path.join(workspace, entry.name);
          const title = entry.name.replace(/\.md$/, "");
          const content = await fs.readFile(notePath, "utf-8");

          const titleMatch = title.toLowerCase().includes(searchTerm);
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
              note: { path: notePath, title },
              matchType: titleMatch ? "title" : "content",
            };
            if (snippet) {
              result.snippet = snippet;
            }
            results.push(result);
          }
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
}
