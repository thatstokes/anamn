import { ipcMain, dialog, BrowserWindow } from "electron";
import { loadConfig, saveConfig } from "../config.js";

let workspacePath: string | null = null;

export async function initWorkspace(): Promise<void> {
  const config = await loadConfig();
  if (config.notes_dir) {
    workspacePath = config.notes_dir;
  }
}

export function registerWorkspaceHandlers() {
  ipcMain.handle("workspace:select", async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const options: Electron.OpenDialogOptions = {
      properties: ["openDirectory"],
      title: "Select Notes Folder",
    };
    if (workspacePath) {
      options.defaultPath = workspacePath;
    }
    const result = await dialog.showOpenDialog(win, options);

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    workspacePath = result.filePaths[0] ?? null;

    // Save to config (merge with existing)
    if (workspacePath) {
      const currentConfig = await loadConfig();
      await saveConfig({ ...currentConfig, notes_dir: workspacePath });
    }

    return workspacePath;
  });

  ipcMain.handle("workspace:get", () => {
    return workspacePath;
  });
}

export function getWorkspacePath(): string | null {
  return workspacePath;
}
