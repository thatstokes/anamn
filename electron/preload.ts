import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { Api, FileChangeEvent } from "../shared/types.js";

const api: Api = {
  workspace: {
    select: () => ipcRenderer.invoke("workspace:select"),
    get: () => ipcRenderer.invoke("workspace:get"),
  },
  notes: {
    list: () => ipcRenderer.invoke("notes:list"),
    read: (path: string) => ipcRenderer.invoke("notes:read", path),
    write: (path: string, content: string) =>
      ipcRenderer.invoke("notes:write", path, content),
    create: (title: string, folder?: string) => ipcRenderer.invoke("notes:create", title, folder),
    delete: (path: string) => ipcRenderer.invoke("notes:delete", path),
    rename: (path: string, newTitle: string) =>
      ipcRenderer.invoke("notes:rename", path, newTitle),
    move: (path: string, targetFolder: string) =>
      ipcRenderer.invoke("notes:move", path, targetFolder),
    getBacklinks: (title: string) => ipcRenderer.invoke("notes:getBacklinks", title),
    search: (query: string) => ipcRenderer.invoke("notes:search", query),
    openDaily: () => ipcRenderer.invoke("notes:openDaily"),
    getNotesWithTag: (tag: string) => ipcRenderer.invoke("notes:getNotesWithTag", tag),
  },
  folders: {
    create: (name: string, parentFolder?: string) =>
      ipcRenderer.invoke("folders:create", name, parentFolder),
  },
  config: {
    get: () => ipcRenderer.invoke("config:get"),
    set: (updates) => ipcRenderer.invoke("config:set", updates),
  },
  state: {
    get: () => ipcRenderer.invoke("state:get"),
    set: (updates) => ipcRenderer.invoke("state:set", updates),
  },
  theme: {
    loadCustomCss: (path: string) => ipcRenderer.invoke("theme:loadCustomCss", path),
    selectCustomCss: () => ipcRenderer.invoke("theme:selectCustomCss"),
  },
  chess: {
    analyze: (fen: string, depth?: number, multiPv?: number) =>
      ipcRenderer.invoke("chess:analyze", fen, depth, multiPv),
    stopAnalysis: () => ipcRenderer.invoke("chess:stopAnalysis"),
  },
  chessImport: {
    fetchGame: (url: string) => ipcRenderer.invoke("chessImport:fetchGame", url),
  },
  dev: {
    toggleDevTools: () => ipcRenderer.invoke("dev:toggleDevTools"),
  },
  watcher: {
    onFileAdded: (callback: (event: FileChangeEvent) => void) => {
      const handler = (_: IpcRendererEvent, event: FileChangeEvent) => callback(event);
      ipcRenderer.on("watcher:file-added", handler);
      return () => ipcRenderer.removeListener("watcher:file-added", handler);
    },
    onFileChanged: (callback: (event: FileChangeEvent) => void) => {
      const handler = (_: IpcRendererEvent, event: FileChangeEvent) => callback(event);
      ipcRenderer.on("watcher:file-changed", handler);
      return () => ipcRenderer.removeListener("watcher:file-changed", handler);
    },
    onFileDeleted: (callback: (event: FileChangeEvent) => void) => {
      const handler = (_: IpcRendererEvent, event: FileChangeEvent) => callback(event);
      ipcRenderer.on("watcher:file-deleted", handler);
      return () => ipcRenderer.removeListener("watcher:file-deleted", handler);
    },
  },
};

contextBridge.exposeInMainWorld("api", api);
