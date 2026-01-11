export interface Note {
  path: string;
  title: string;
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

export interface Config {
  notes_dir: string;
  default_view_mode: ViewMode;
  shortcuts: KeyboardShortcuts;
  rightPanelSections: RightPanelSection[]; // Sections to show, in order
  rightPanelOpen: boolean; // Whether right panel is open on startup
  collapsedSections: RightPanelSection[]; // Which sections are collapsed
  dailyNote: DailyNoteConfig; // Daily note settings
  theme: ThemeConfig; // Theme settings
}

// App state (not user-configurable, stored separately)
export interface AppState {
  recentNotes: string[]; // Array of note titles, most recent first
  lastOpenedNote: string | null; // Path of the last opened note
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
  create: (title: string) => Promise<Note>;
  delete: (path: string) => Promise<void>;
  rename: (path: string, newTitle: string) => Promise<Note>;
  getBacklinks: (title: string) => Promise<Note[]>;
  search: (query: string) => Promise<SearchResult[]>;
  openDaily: () => Promise<Note>;
  getNotesWithTag: (tag: string) => Promise<Note[]>;
}

export interface FileChangeEvent {
  path: string;
  title: string;
}

export interface WatcherApi {
  onFileAdded: (callback: (event: FileChangeEvent) => void) => () => void;
  onFileChanged: (callback: (event: FileChangeEvent) => void) => () => void;
  onFileDeleted: (callback: (event: FileChangeEvent) => void) => () => void;
}

// Chess engine analysis types
export interface EngineAnalysis {
  score: number;        // Centipawns (50 = +0.5 pawns)
  mate: number | null;  // Mate in N moves (null if not mate)
  bestMove: string;     // UCI format (e.g., "e2e4")
  pv: string[];         // Principal variation
  depth: number;        // Search depth reached
}

export interface ChessApi {
  analyze: (fen: string, depth?: number) => Promise<EngineAnalysis>;
  stopAnalysis: () => Promise<void>;
}

export interface Api {
  workspace: WorkspaceApi;
  notes: NotesApi;
  config: ConfigApi;
  state: StateApi;
  watcher: WatcherApi;
  theme: ThemeApi;
  chess: ChessApi;
}

declare global {
  interface Window {
    api: Api;
  }
}
