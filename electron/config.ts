import fs from "fs/promises";
import path from "path";
import os from "os";
import { app } from "electron";
import * as TOML from "smol-toml";

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
  dailyNote: DEFAULT_DAILY_NOTE,
  theme: DEFAULT_THEME,
  chess: DEFAULT_CHESS,
  chessImport: DEFAULT_CHESS_IMPORT,
};

const CONFIG_FILENAME = "config.toml";
const LEGACY_TOML_FILENAME = "anamn.config.toml"; // For migration
const LEGACY_JSON_FILENAME = "anamn.config.json"; // For migration

// User config directory: ~/.config/anamn/ (XDG standard, works on Mac and Linux)
function getUserConfigDir(): string {
  return path.join(os.homedir(), ".config", "anamn");
}

interface ConfigPath {
  path: string;
  format: "toml" | "json";
}

function getConfigPaths(): ConfigPath[] {
  // 1. App root directory (for development / portable mode)
  const appRoot = app.isPackaged
    ? path.dirname(app.getPath("exe"))
    : process.cwd();

  // 2. User config directory: ~/.config/anamn/
  const userConfigDir = getUserConfigDir();

  // Check current filename first, then legacy filenames for migration
  return [
    { path: path.join(appRoot, CONFIG_FILENAME), format: "toml" },
    { path: path.join(appRoot, LEGACY_TOML_FILENAME), format: "toml" },
    { path: path.join(appRoot, LEGACY_JSON_FILENAME), format: "json" },
    { path: path.join(userConfigDir, CONFIG_FILENAME), format: "toml" },
    { path: path.join(userConfigDir, LEGACY_TOML_FILENAME), format: "toml" },
    { path: path.join(userConfigDir, LEGACY_JSON_FILENAME), format: "json" },
  ];
}

export async function loadConfig(): Promise<Config> {
  const paths = getConfigPaths();

  // Start with defaults
  let config: Config = { ...DEFAULT_CONFIG };
  let needsMigration = false;

  // Load project config first (as base), then user config (to override)
  // This way user config always takes priority
  for (const { path: configPath, format } of paths) {
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const parsed = (format === "toml"
        ? TOML.parse(content)
        : JSON.parse(content)) as Partial<Config>;

      // Check if loaded from legacy filename (needs migration to new filename)
      const filename = path.basename(configPath);
      if (filename !== CONFIG_FILENAME) {
        needsMigration = true;
      }

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
      };
    } catch {
      // File doesn't exist or invalid, continue to next
    }
  }

  // Migrate: if we loaded from legacy filename, save to new filename
  if (needsMigration) {
    await saveConfig(config);
  }

  return config;
}

export async function saveConfig(config: Config): Promise<void> {
  // Always save to ~/.config/anamn/
  const userConfigDir = getUserConfigDir();
  const userConfigPath = path.join(userConfigDir, CONFIG_FILENAME);

  await fs.mkdir(userConfigDir, { recursive: true });

  // Generate TOML with a header comment
  const tomlContent = `# Anamn Configuration
# https://github.com/twirlyowl/anamn

${TOML.stringify(config)}`;

  await fs.writeFile(userConfigPath, tomlContent, "utf-8");
}
