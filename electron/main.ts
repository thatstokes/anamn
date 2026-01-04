import { app, BrowserWindow } from "electron";
import path from "path";
import { registerWorkspaceHandlers, initWorkspace } from "./ipc/workspace.js";
import { registerNotesHandlers } from "./ipc/notes.js";
import { registerConfigHandlers } from "./ipc/config.js";
import { registerThemeHandlers } from "./ipc/theme.js";

const isDev = !app.isPackaged;

registerWorkspaceHandlers();
registerNotesHandlers();
registerConfigHandlers();
registerThemeHandlers();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
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
