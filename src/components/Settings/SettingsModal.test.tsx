import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SettingsModal } from "./SettingsModal.js";
import { ThemeProvider } from "../ThemeProvider.js";

// Mock the window.api
const mockConfig = {
  default_view_mode: "rendered" as const,
  shortcuts: {
    newNote: "Ctrl+N",
    search: "Ctrl+P",
    toggleView: "Ctrl+E",
    save: "Ctrl+S",
    closePanel: "Escape",
    commandPalette: "Ctrl+Shift+P",
    rightPanel: "Ctrl+G",
    dailyNote: "Ctrl+D",
  },
  dailyNote: {
    format: "yyyy-MM-dd",
    prefix: "",
    suffix: "",
  },
  rightPanelSections: ["recents", "links", "tags", "graph"] as const,
  notes_dir: "/notes",
  recentNotes: [],
  rightPanelOpen: true,
  collapsedSections: [],
  lastOpenedNote: null,
  theme: {
    mode: "dark" as const,
  },
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe("SettingsModal", () => {
  const defaultProps = {
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock API before each test
    Object.defineProperty(window, "api", {
      value: {
        config: {
          get: vi.fn().mockResolvedValue(mockConfig),
          set: vi.fn().mockResolvedValue(mockConfig),
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders settings modal with title", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  it("shows all navigation sections", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("General")).toBeInTheDocument();
    });

    expect(screen.getByText("Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Daily Notes")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("shows General section by default", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("General Settings")).toBeInTheDocument();
    });

    expect(screen.getByText("Default View Mode")).toBeInTheDocument();
  });

  it("switches to Shortcuts section when clicked", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Shortcuts")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Shortcuts"));

    await waitFor(() => {
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });
  });

  it("switches to Daily Notes section when clicked", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Daily Notes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Daily Notes"));

    await waitFor(() => {
      expect(screen.getByText("Daily Note Settings")).toBeInTheDocument();
    });
  });

  it("switches to Appearance section when clicked", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Appearance")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Appearance"));

    await waitFor(() => {
      expect(screen.getByText("Right Panel Sections")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("✕"));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onSave when Save button is clicked", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save"));

    expect(defaultProps.onSave).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("has Reset and Save buttons in footer", async () => {
    renderWithTheme(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});
