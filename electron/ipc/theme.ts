import { ipcMain, dialog } from "electron";
import fs from "fs/promises";

export function registerThemeHandlers(): void {
  // Load custom CSS file from disk
  ipcMain.handle("theme:loadCustomCss", async (_event, cssPath: string): Promise<string> => {
    try {
      const content = await fs.readFile(cssPath, "utf-8");
      return content;
    } catch (error) {
      throw new Error(`Failed to load CSS file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  // Open file dialog to select a CSS file
  ipcMain.handle("theme:selectCustomCss", async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      title: "Select Custom CSS File",
      filters: [{ name: "CSS Files", extensions: ["css"] }],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0] ?? null;
  });
}
