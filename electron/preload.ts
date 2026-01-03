import { contextBridge, ipcRenderer } from "electron";
import type { Api } from "../shared/types.js";

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
  },
  config: {
    get: () => ipcRenderer.invoke("config:get"),
    set: (updates) => ipcRenderer.invoke("config:set", updates),
  },
};

contextBridge.exposeInMainWorld("api", api);
