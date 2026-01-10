import { ipcMain } from "electron";
import { loadConfig, saveConfig, type Config } from "../config.js";

let cachedConfig: Config | null = null;

export async function initConfig(): Promise<Config> {
  cachedConfig = await loadConfig();
  return cachedConfig;
}

// Update the cached config (used by other modules when they save config directly)
export function updateConfigCache(updates: Partial<Config>): void {
  if (cachedConfig) {
    cachedConfig = { ...cachedConfig, ...updates };
  }
}

export function registerConfigHandlers() {
  ipcMain.handle("config:get", async (): Promise<Config> => {
    if (!cachedConfig) {
      cachedConfig = await loadConfig();
    }
    return cachedConfig;
  });

  ipcMain.handle(
    "config:set",
    async (_, updates: Partial<Config>): Promise<Config> => {
      if (!cachedConfig) {
        cachedConfig = await loadConfig();
      }
      cachedConfig = { ...cachedConfig, ...updates };
      await saveConfig(cachedConfig);
      return cachedConfig;
    }
  );
}
