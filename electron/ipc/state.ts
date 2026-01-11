import { ipcMain } from "electron";
import { loadState, saveState, type AppState } from "../state.js";

let cachedState: AppState | null = null;

export async function initState(): Promise<AppState> {
  cachedState = await loadState();
  return cachedState;
}

export function registerStateHandlers() {
  ipcMain.handle("state:get", async (): Promise<AppState> => {
    if (!cachedState) {
      cachedState = await loadState();
    }
    return cachedState;
  });

  ipcMain.handle(
    "state:set",
    async (_, updates: Partial<AppState>): Promise<AppState> => {
      if (!cachedState) {
        cachedState = await loadState();
      }
      cachedState = { ...cachedState, ...updates };
      await saveState(cachedState);
      return cachedState;
    }
  );
}
