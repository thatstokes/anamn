import fs from "fs/promises";
import path from "path";
import os from "os";
import { app } from "electron";

export type ViewMode = "edit" | "rendered";

export interface KeyboardShortcuts {
  newNote: string;
  search: string;
  toggleView: string;
  save: string;
  closePanel: string;
  commandPalette: string;
  rightPanel: string;
}

export type RightPanelSection = "links" | "graph" | "recents";

export interface Config {
  notes_dir: string;
  default_view_mode: ViewMode;
  shortcuts: KeyboardShortcuts;
  recentNotes: string[]; // Array of note titles, most recent first
  rightPanelSections: RightPanelSection[]; // Sections to show, in order
  rightPanelOpen: boolean; // Whether right panel is open on startup
  collapsedSections: RightPanelSection[]; // Which sections are collapsed
  lastOpenedNote: string | null; // Path of the last opened note
}

const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  newNote: "Ctrl+N",
  search: "Ctrl+P",
  toggleView: "Ctrl+E",
  save: "Ctrl+S",
  closePanel: "Escape",
  commandPalette: "Ctrl+Shift+P",
  rightPanel: "Ctrl+G",
};

const DEFAULT_CONFIG: Config = {
  notes_dir: "",
  default_view_mode: "rendered",
  shortcuts: DEFAULT_SHORTCUTS,
  recentNotes: [],
  rightPanelSections: ["recents", "links", "graph"],
  rightPanelOpen: true,
  collapsedSections: [],
  lastOpenedNote: null,
};

const CONFIG_FILENAME = "anamn.config.json";

function getConfigPaths(): string[] {
  // 1. App root directory (for development / portable mode)
  const appRoot = app.isPackaged
    ? path.dirname(app.getPath("exe"))
    : process.cwd();

  // 2. User config directory (~/.config/anamn/)
  const userConfigDir = path.join(os.homedir(), ".config", "anamn");

  return [
    path.join(appRoot, CONFIG_FILENAME),
    path.join(userConfigDir, CONFIG_FILENAME),
  ];
}

export async function loadConfig(): Promise<Config> {
  const paths = getConfigPaths();

  // Start with defaults
  let config: Config = { ...DEFAULT_CONFIG };

  // Load project config first (as base), then user config (to override)
  // This way user config always takes priority
  for (const configPath of paths) {
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const parsed = JSON.parse(content) as Partial<Config>;
      // Deep merge each config layer
      config = {
        ...config,
        ...parsed,
        shortcuts: {
          ...config.shortcuts,
          ...(parsed.shortcuts ?? {}),
        },
        // Only override arrays if explicitly provided
        recentNotes: parsed.recentNotes ?? config.recentNotes,
        rightPanelSections: parsed.rightPanelSections ?? config.rightPanelSections,
        rightPanelOpen: parsed.rightPanelOpen ?? config.rightPanelOpen,
        collapsedSections: parsed.collapsedSections ?? config.collapsedSections,
        lastOpenedNote: parsed.lastOpenedNote ?? config.lastOpenedNote,
      };
    } catch {
      // File doesn't exist or invalid, continue to next
    }
  }

  return config;
}

export async function saveConfig(config: Config): Promise<void> {
  // Always save to user config directory (~/.config/anamn/)
  const userConfigDir = path.join(os.homedir(), ".config", "anamn");
  const userConfigPath = path.join(userConfigDir, CONFIG_FILENAME);

  await fs.mkdir(userConfigDir, { recursive: true });
  await fs.writeFile(userConfigPath, JSON.stringify(config, null, 2), "utf-8");
}
