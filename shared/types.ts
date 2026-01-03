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

export interface ConfigApi {
  get: () => Promise<Config>;
  set: (updates: Partial<Config>) => Promise<Config>;
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
}

export interface Api {
  workspace: WorkspaceApi;
  notes: NotesApi;
  config: ConfigApi;
}

declare global {
  interface Window {
    api: Api;
  }
}
