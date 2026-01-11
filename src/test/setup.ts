import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock the window.api object that Electron's preload script provides
const mockApi = {
  notes: {
    list: vi.fn().mockResolvedValue([]),
    read: vi.fn().mockResolvedValue(""),
    write: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue({ path: "/test/note.md", title: "note" }),
    delete: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue({ path: "/test/renamed.md", title: "renamed" }),
    search: vi.fn().mockResolvedValue([]),
    getBacklinks: vi.fn().mockResolvedValue([]),
  },
  workspace: {
    get: vi.fn().mockResolvedValue(null),
    select: vi.fn().mockResolvedValue(null),
  },
  config: {
    get: vi.fn().mockResolvedValue({
      default_view_mode: "rendered",
      shortcuts: {
        newNote: "Ctrl+N",
        search: "Ctrl+P",
        toggleView: "Ctrl+E",
        save: "Ctrl+S",
        closePanel: "Escape",
        commandPalette: "Ctrl+Shift+P",
        rightPanel: "Ctrl+G",
      },
      rightPanelSections: ["links", "graph"],
      rightPanelOpen: false,
      collapsedSections: [],
    }),
    set: vi.fn().mockResolvedValue(undefined),
  },
  state: {
    get: vi.fn().mockResolvedValue({
      recentNotes: [],
      lastOpenedNote: null,
    }),
    set: vi.fn().mockResolvedValue(undefined),
  },
  watcher: {
    onFileAdded: vi.fn().mockReturnValue(() => {}),
    onFileChanged: vi.fn().mockReturnValue(() => {}),
    onFileDeleted: vi.fn().mockReturnValue(() => {}),
  },
};

// Add the api property to the existing window object instead of replacing it
Object.defineProperty(window, "api", {
  value: mockApi,
  writable: true,
});

// Export for use in tests
export { mockApi };
