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
  dailyNote: string;
}

export type RightPanelSection = "links" | "graph" | "recents" | "tags";

export interface DailyNoteConfig {
  format: string;  // Luxon date format, default "yyyy-MM-dd"
  prefix: string;  // Text before date, default ""
  suffix: string;  // Text after date, default ""
}

export type ThemeMode = "dark" | "light" | "custom";

export interface ThemeConfig {
  mode: ThemeMode;
  customCssPath?: string;  // Path to user's custom CSS file
}

export interface ChessConfig {
  engineDepth: number;  // Stockfish search depth (10-30, default 20)
  multiPv: number;      // Number of lines to show (1-3, default 1)
}

export interface ChessImportConfig {
  lichessUsername?: string;       // User's Lichess username
  chessComUsername?: string;      // User's Chess.com username
  gameNoteTitleFormat: string;    // Template for note titles
}

export interface Config {
  notes_dir: string;
  default_view_mode: ViewMode;
  shortcuts: KeyboardShortcuts;
  rightPanelSections: RightPanelSection[]; // Sections to show, in order
  rightPanelOpen: boolean; // Whether right panel is open on startup
  collapsedSections: RightPanelSection[]; // Which sections are collapsed
  dailyNote: DailyNoteConfig; // Daily note settings
  theme: ThemeConfig; // Theme settings
  chess: ChessConfig; // Chess engine settings
  chessImport: ChessImportConfig; // Chess game import settings
}

const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  newNote: "Ctrl+N",
  search: "Ctrl+P",
  toggleView: "Ctrl+E",
  save: "Ctrl+S",
  closePanel: "Escape",
  commandPalette: "Ctrl+Shift+P",
  rightPanel: "Ctrl+G",
  dailyNote: "Ctrl+D",
};

const DEFAULT_DAILY_NOTE: DailyNoteConfig = {
  format: "yyyy-MM-dd",
  prefix: "",
  suffix: "",
};

const DEFAULT_THEME: ThemeConfig = {
  mode: "dark",
};

const DEFAULT_CHESS: ChessConfig = {
  engineDepth: 20,
  multiPv: 1,
};

const DEFAULT_CHESS_IMPORT: ChessImportConfig = {
  gameNoteTitleFormat: "{me} vs {opponent} {gameId}",
};

const DEFAULT_CONFIG: Config = {
  notes_dir: "",
  default_view_mode: "rendered",
  shortcuts: DEFAULT_SHORTCUTS,
  rightPanelSections: ["recents", "links", "tags", "graph"],
  rightPanelOpen: true,
  collapsedSections: [],
  dailyNote: DEFAULT_DAILY_NOTE,
  theme: DEFAULT_THEME,
  chess: DEFAULT_CHESS,
  chessImport: DEFAULT_CHESS_IMPORT,
};

const CONFIG_FILENAME = "anamn.config.json";

// User config directory: ~/.config/anamn/ (XDG standard, works on Mac and Linux)
function getUserConfigDir(): string {
  return path.join(os.homedir(), ".config", "anamn");
}

function getConfigPaths(): string[] {
  // 1. App root directory (for development / portable mode)
  const appRoot = app.isPackaged
    ? path.dirname(app.getPath("exe"))
    : process.cwd();

  // 2. User config directory: ~/.config/anamn/
  const userConfigDir = getUserConfigDir();

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
        dailyNote: {
          ...config.dailyNote,
          ...(parsed.dailyNote ?? {}),
        },
        theme: {
          ...config.theme,
          ...(parsed.theme ?? {}),
        },
        chess: {
          ...config.chess,
          ...(parsed.chess ?? {}),
        },
        chessImport: {
          ...config.chessImport,
          ...(parsed.chessImport ?? {}),
        },
        // Only override arrays if explicitly provided
        rightPanelSections: parsed.rightPanelSections ?? config.rightPanelSections,
        rightPanelOpen: parsed.rightPanelOpen ?? config.rightPanelOpen,
        collapsedSections: parsed.collapsedSections ?? config.collapsedSections,
      };
    } catch {
      // File doesn't exist or invalid, continue to next
    }
  }

  return config;
}

export async function saveConfig(config: Config): Promise<void> {
  // Always save to ~/.config/anamn/
  const userConfigDir = getUserConfigDir();
  const userConfigPath = path.join(userConfigDir, CONFIG_FILENAME);

  await fs.mkdir(userConfigDir, { recursive: true });
  await fs.writeFile(userConfigPath, JSON.stringify(config, null, 2), "utf-8");
}
