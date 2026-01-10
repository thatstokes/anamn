import { app, BrowserWindow } from "electron";
import path from "path";
import { registerWorkspaceHandlers, initWorkspace } from "./ipc/workspace.js";
import { registerNotesHandlers } from "./ipc/notes.js";
import { registerConfigHandlers } from "./ipc/config.js";
import { registerThemeHandlers } from "./ipc/theme.js";
import { registerChessHandlers } from "./ipc/chess.js";

const isDev = !app.isPackaged;

// Get the correct preload path
function getPreloadPath(): string {
  if (isDev) {
    return path.join(app.getAppPath(), "electron", "preload.js");
  } else {
    return path.join(app.getAppPath(), "electron", "preload.js");
  }
}

registerWorkspaceHandlers();
registerNotesHandlers();
registerConfigHandlers();
registerThemeHandlers();
registerChessHandlers();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }
}

app.whenReady().then(async () => {
  await initWorkspace();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
