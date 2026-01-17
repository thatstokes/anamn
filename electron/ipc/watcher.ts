import { BrowserWindow } from "electron";
import chokidar, { FSWatcher } from "chokidar";
import path from "path";

let watcher: FSWatcher | null = null;
let currentWorkspace: string | null = null;

// Track recent writes to ignore our own changes
const recentWrites = new Map<string, number>();
const WRITE_IGNORE_MS = 1000; // Ignore changes within 1 second of our write

/**
 * Mark a file as recently written by us (to ignore the subsequent change event)
 */
export function markFileWritten(filePath: string): void {
  recentWrites.set(filePath, Date.now());
}

/**
 * Check if a file change should be ignored (because we wrote it recently)
 */
function shouldIgnoreChange(filePath: string): boolean {
  const writeTime = recentWrites.get(filePath);
  if (!writeTime) return false;

  const elapsed = Date.now() - writeTime;
  if (elapsed < WRITE_IGNORE_MS) {
    return true;
  }

  // Clean up old entry
  recentWrites.delete(filePath);
  return false;
}

/**
 * Send a file change event to all renderer windows
 */
function sendToRenderer(channel: string, data: unknown): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    win.webContents.send(channel, data);
  }
}

/**
 * Get folder path relative to workspace
 */
function getRelativeFolder(filePath: string): string {
  if (!currentWorkspace) return "";
  const dir = path.dirname(filePath);
  return path.relative(currentWorkspace, dir) || "";
}

/**
 * Start watching a workspace directory for .md file changes
 */
export function startWatcher(workspacePath: string): void {
  // Stop any existing watcher
  stopWatcher();

  currentWorkspace = workspacePath;

  watcher = chokidar.watch(workspacePath, {
    ignoreInitial: true, // Don't emit events for existing files
    // No depth limit - watch all subdirectories
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
    // Ignore temp files from atomic writes and hidden folders
    ignored: [/\.tmp$/, /(^|[\/\\])\../],
    // Use polling for better cross-platform compatibility
    usePolling: true,
    interval: 300,
  });

  watcher.on("add", (filePath) => {
    if (!filePath.endsWith(".md")) return;
    if (shouldIgnoreChange(filePath)) return;

    const title = path.basename(filePath, ".md");
    const folder = getRelativeFolder(filePath);
    sendToRenderer("watcher:file-added", { path: filePath, title, folder });
  });

  watcher.on("change", (filePath) => {
    if (!filePath.endsWith(".md")) return;
    if (shouldIgnoreChange(filePath)) return;

    const title = path.basename(filePath, ".md");
    const folder = getRelativeFolder(filePath);
    sendToRenderer("watcher:file-changed", { path: filePath, title, folder });
  });

  watcher.on("unlink", (filePath) => {
    if (!filePath.endsWith(".md")) return;
    if (shouldIgnoreChange(filePath)) return;

    const title = path.basename(filePath, ".md");
    const folder = getRelativeFolder(filePath);
    sendToRenderer("watcher:file-deleted", { path: filePath, title, folder });
  });

  watcher.on("error", (error) => {
    console.error("File watcher error:", error);
  });
}

/**
 * Stop watching the current workspace
 */
export function stopWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  currentWorkspace = null;
  recentWrites.clear();
}
