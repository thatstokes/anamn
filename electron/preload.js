"use strict";

// electron/preload.ts
var import_electron = require("electron");
var api = {
  workspace: {
    select: () => import_electron.ipcRenderer.invoke("workspace:select"),
    get: () => import_electron.ipcRenderer.invoke("workspace:get")
  },
  notes: {
    list: () => import_electron.ipcRenderer.invoke("notes:list"),
    read: (path) => import_electron.ipcRenderer.invoke("notes:read", path),
    write: (path, content) => import_electron.ipcRenderer.invoke("notes:write", path, content),
    create: (title) => import_electron.ipcRenderer.invoke("notes:create", title),
    delete: (path) => import_electron.ipcRenderer.invoke("notes:delete", path),
    rename: (path, newTitle) => import_electron.ipcRenderer.invoke("notes:rename", path, newTitle),
    getBacklinks: (title) => import_electron.ipcRenderer.invoke("notes:getBacklinks", title),
    search: (query) => import_electron.ipcRenderer.invoke("notes:search", query)
  },
  config: {
    get: () => import_electron.ipcRenderer.invoke("config:get"),
    set: (updates) => import_electron.ipcRenderer.invoke("config:set", updates)
  },
  watcher: {
    onFileAdded: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("watcher:file-added", handler);
      return () => import_electron.ipcRenderer.removeListener("watcher:file-added", handler);
    },
    onFileChanged: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("watcher:file-changed", handler);
      return () => import_electron.ipcRenderer.removeListener("watcher:file-changed", handler);
    },
    onFileDeleted: (callback) => {
      const handler = (_, event) => callback(event);
      import_electron.ipcRenderer.on("watcher:file-deleted", handler);
      return () => import_electron.ipcRenderer.removeListener("watcher:file-deleted", handler);
    }
  }
};
import_electron.contextBridge.exposeInMainWorld("api", api);
