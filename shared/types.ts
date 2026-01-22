export interface Note {
  path: string;
  title: string;
  folder: string;  // Relative folder path from workspace root, empty string for root
}

export interface SearchResult {
  note: Note;
  matchType: "title" | "content";
  snippet?: string;
}

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

export type RightPanelSection = "links" | "graph" | "tags";

export interface DailyNoteConfig {
  format: string;  // Luxon date format, default "yyyy-MM-dd"
  prefix: string;  // Text before date, default ""
  suffix: string;  // Text after date, default ""
}

export interface ChessConfig {
  engineDepth: number;  // Stockfish search depth (10-30, default 20)
  multiPv: number;      // Number of lines to show (1-3, default 1)
}

export interface ChessImportConfig {
  lichessUsername?: string;       // User's Lichess username
  chessComUsername?: string;      // User's Chess.com username
  gameNoteTitleFormat: string;    // Template for note titles, default "{me} vs {opponent} {gameId}"
}

export interface ChessPlayerInfo {
  username: string;
  rating?: number;
}

export interface ChessGameData {
  pgn: string;
  white: ChessPlayerInfo;
  black: ChessPlayerInfo;
  date: string;           // ISO date string (YYYY-MM-DD)
  result: string;         // "1-0", "0-1", "1/2-1/2", "*"
  gameId: string;
  source: "lichess" | "chesscom";
  url: string;
}

export type ThemeMode = "dark" | "light" | "custom";

export interface ThemeConfig {
  mode: ThemeMode;
  customCssPath?: string;  // Path to user's custom CSS file
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

// App state (not user-configurable, stored separately)
export interface AppState {
  recentNotes: string[]; // Array of note titles, most recent first
  lastOpenedNote: string | null; // Path of the last opened note
  expandedFolders: string[]; // Array of expanded folder paths
  sidebarWidth: number; // Width of sidebar in pixels
  rightPanelWidth: number; // Width of right panel in pixels
  rightPanelOpen: boolean; // Whether right panel is open
  collapsedSections: RightPanelSection[]; // Which sections are collapsed
}

export interface ConfigApi {
  get: () => Promise<Config>;
  set: (updates: Partial<Config>) => Promise<Config>;
}

export interface StateApi {
  get: () => Promise<AppState>;
  set: (updates: Partial<AppState>) => Promise<AppState>;
}

export interface ThemeApi {
  loadCustomCss: (path: string) => Promise<string>;
  selectCustomCss: () => Promise<string | null>;
}

export interface WorkspaceApi {
  select: () => Promise<string | null>;
  get: () => Promise<string | null>;
}

export interface NotesApi {
  list: () => Promise<Note[]>;
  read: (path: string) => Promise<string>;
  write: (path: string, content: string) => Promise<void>;
  create: (title: string, folder?: string) => Promise<Note>;
  delete: (path: string) => Promise<void>;
  rename: (path: string, newTitle: string) => Promise<Note>;
  getBacklinks: (title: string) => Promise<Note[]>;
  search: (query: string) => Promise<SearchResult[]>;
  openDaily: () => Promise<Note>;
  getNotesWithTag: (tag: string) => Promise<Note[]>;
}

export interface FoldersApi {
  create: (name: string, parentFolder?: string) => Promise<string>; // Returns the created folder path
}

export interface FileChangeEvent {
  path: string;
  title: string;
  folder: string;
}

export interface WatcherApi {
  onFileAdded: (callback: (event: FileChangeEvent) => void) => () => void;
  onFileChanged: (callback: (event: FileChangeEvent) => void) => () => void;
  onFileDeleted: (callback: (event: FileChangeEvent) => void) => () => void;
}

// Chess engine analysis types
export interface EngineLine {
  score: number;        // Centipawns (50 = +0.5 pawns)
  mate: number | null;  // Mate in N moves (null if not mate)
  pv: string[];         // Principal variation (UCI moves)
}

export interface EngineAnalysis {
  score: number;        // Centipawns (50 = +0.5 pawns) - best line
  mate: number | null;  // Mate in N moves (null if not mate) - best line
  bestMove: string;     // UCI format (e.g., "e2e4")
  pv: string[];         // Principal variation - best line
  depth: number;        // Search depth reached
  lines: EngineLine[];  // All lines (MultiPV)
}

export interface ChessApi {
  analyze: (fen: string, depth?: number, multiPv?: number) => Promise<EngineAnalysis>;
  stopAnalysis: () => Promise<void>;
}

export interface ChessImportApi {
  fetchGame: (url: string) => Promise<ChessGameData>;
}

export interface Api {
  workspace: WorkspaceApi;
  notes: NotesApi;
  folders: FoldersApi;
  config: ConfigApi;
  state: StateApi;
  watcher: WatcherApi;
  theme: ThemeApi;
  chess: ChessApi;
  chessImport: ChessImportApi;
}

declare global {
  interface Window {
    api: Api;
  }
}
