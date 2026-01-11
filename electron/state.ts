import fs from "fs/promises";
import path from "path";
import { app } from "electron";

/**
 * App state that shouldn't be in user config.
 * Stored in Electron's userData directory (platform-specific app data location).
 */
export interface AppState {
  recentNotes: string[]; // Array of note titles, most recent first
  lastOpenedNote: string | null; // Path of the last opened note
}

const DEFAULT_STATE: AppState = {
  recentNotes: [],
  lastOpenedNote: null,
};

const STATE_FILENAME = "state.json";

function getStatePath(): string {
  // Use Electron's userData path for app state
  // macOS: ~/Library/Application Support/Anamn
  // Linux: ~/.config/Anamn (XDG_CONFIG_HOME)
  return path.join(app.getPath("userData"), STATE_FILENAME);
}

export async function loadState(): Promise<AppState> {
  const statePath = getStatePath();

  try {
    const content = await fs.readFile(statePath, "utf-8");
    const parsed = JSON.parse(content) as Partial<AppState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
    };
  } catch {
    // File doesn't exist or invalid, return defaults
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: AppState): Promise<void> {
  const statePath = getStatePath();
  const stateDir = path.dirname(statePath);

  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf-8");
}
