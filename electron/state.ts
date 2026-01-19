import fs from "fs/promises";
import path from "path";
import os from "os";
import { app } from "electron";

/**
 * App state that shouldn't be in user config.
 * Platform-specific locations:
 * - Linux: ~/.local/state/anamn/ (XDG_STATE_HOME)
 * - macOS: ~/Library/Application Support/Anamn/
 */
export type RightPanelSection = "links" | "graph" | "recents" | "tags";

export interface AppState {
  recentNotes: string[]; // Array of note titles, most recent first
  lastOpenedNote: string | null; // Path of the last opened note
  expandedFolders: string[]; // Array of expanded folder paths
  sidebarWidth: number; // Width of sidebar in pixels
  rightPanelWidth: number; // Width of right panel in pixels
  rightPanelOpen: boolean; // Whether right panel is open
  collapsedSections: RightPanelSection[]; // Which right panel sections are collapsed
}

const DEFAULT_STATE: AppState = {
  recentNotes: [],
  lastOpenedNote: null,
  expandedFolders: [],
  sidebarWidth: 250,
  rightPanelWidth: 300,
  rightPanelOpen: true,
  collapsedSections: [],
};

const STATE_FILENAME = "state.json";

function getStatePath(): string {
  if (process.platform === "linux") {
    // XDG_STATE_HOME or fallback to ~/.local/state/
    const xdgStateHome = process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state");
    return path.join(xdgStateHome, "anamn", STATE_FILENAME);
  }
  // macOS: ~/Library/Application Support/Anamn/
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
