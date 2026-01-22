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
    create: (title, folder) => import_electron.ipcRenderer.invoke("notes:create", title, folder),
    delete: (path) => import_electron.ipcRenderer.invoke("notes:delete", path),
    rename: (path, newTitle) => import_electron.ipcRenderer.invoke("notes:rename", path, newTitle),
    move: (path, targetFolder) => import_electron.ipcRenderer.invoke("notes:move", path, targetFolder),
    getBacklinks: (title) => import_electron.ipcRenderer.invoke("notes:getBacklinks", title),
    search: (query) => import_electron.ipcRenderer.invoke("notes:search", query),
    openDaily: () => import_electron.ipcRenderer.invoke("notes:openDaily"),
    getNotesWithTag: (tag) => import_electron.ipcRenderer.invoke("notes:getNotesWithTag", tag)
  },
  folders: {
    create: (name, parentFolder) => import_electron.ipcRenderer.invoke("folders:create", name, parentFolder)
  },
  config: {
    get: () => import_electron.ipcRenderer.invoke("config:get"),
    set: (updates) => import_electron.ipcRenderer.invoke("config:set", updates)
  },
  state: {
    get: () => import_electron.ipcRenderer.invoke("state:get"),
    set: (updates) => import_electron.ipcRenderer.invoke("state:set", updates)
  },
  theme: {
    loadCustomCss: (path) => import_electron.ipcRenderer.invoke("theme:loadCustomCss", path),
    selectCustomCss: () => import_electron.ipcRenderer.invoke("theme:selectCustomCss")
  },
  chess: {
    analyze: (fen, depth, multiPv) => import_electron.ipcRenderer.invoke("chess:analyze", fen, depth, multiPv),
    stopAnalysis: () => import_electron.ipcRenderer.invoke("chess:stopAnalysis")
  },
  chessImport: {
    fetchGame: (url) => import_electron.ipcRenderer.invoke("chessImport:fetchGame", url)
  },
  dev: {
    toggleDevTools: () => import_electron.ipcRenderer.invoke("dev:toggleDevTools")
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
