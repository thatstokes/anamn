import { ipcMain } from "electron";
import { loadConfig, saveConfig, type Config } from "../config.js";

let cachedConfig: Config | null = null;

export async function initConfig(): Promise<Config> {
  cachedConfig = await loadConfig();
  return cachedConfig;
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
