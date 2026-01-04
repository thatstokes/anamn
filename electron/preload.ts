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
    create: (title: string) => ipcRenderer.invoke("notes:create", title),
    delete: (path: string) => ipcRenderer.invoke("notes:delete", path),
    rename: (path: string, newTitle: string) =>
      ipcRenderer.invoke("notes:rename", path, newTitle),
    getBacklinks: (title: string) => ipcRenderer.invoke("notes:getBacklinks", title),
    search: (query: string) => ipcRenderer.invoke("notes:search", query),
    openDaily: () => ipcRenderer.invoke("notes:openDaily"),
    getNotesWithTag: (tag: string) => ipcRenderer.invoke("notes:getNotesWithTag", tag),
  },
  config: {
    get: () => ipcRenderer.invoke("config:get"),
    set: (updates) => ipcRenderer.invoke("config:set", updates),
  },
  theme: {
    loadCustomCss: (path: string) => ipcRenderer.invoke("theme:loadCustomCss", path),
    selectCustomCss: () => ipcRenderer.invoke("theme:selectCustomCss"),
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
