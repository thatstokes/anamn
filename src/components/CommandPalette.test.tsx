import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette.js";

describe("CommandPalette", () => {
  const mockCommands = [
    { id: "save", label: "Save Note", action: vi.fn() },
    { id: "new", label: "New Note", action: vi.fn() },
    { id: "delete", label: "Delete Note", action: vi.fn() },
  ];

  const defaultProps = {
    commands: mockCommands,
    query: "",
    setQuery: vi.fn(),
    onClose: vi.fn(),
    onExecute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render command input", () => {
    render(<CommandPalette {...defaultProps} />);

    expect(screen.getByPlaceholderText("Type a command...")).toBeInTheDocument();
  });

  it("should display all commands when query is empty", () => {
    render(<CommandPalette {...defaultProps} />);

    expect(screen.getByText("Save Note")).toBeInTheDocument();
    expect(screen.getByText("New Note")).toBeInTheDocument();
    expect(screen.getByText("Delete Note")).toBeInTheDocument();
  });

  it("should filter commands based on query", () => {
    render(<CommandPalette {...defaultProps} query="save" />);

    expect(screen.getByText("Save Note")).toBeInTheDocument();
    expect(screen.queryByText("New Note")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete Note")).not.toBeInTheDocument();
  });

  it("should show no matching commands message when no results", () => {
    render(<CommandPalette {...defaultProps} query="xyz" />);

    expect(screen.getByText("No matching commands")).toBeInTheDocument();
  });

  it("should call setQuery when typing", () => {
    render(<CommandPalette {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type a command...");
    fireEvent.change(input, { target: { value: "new" } });

    expect(defaultProps.setQuery).toHaveBeenCalledWith("new");
  });

  it("should execute first command on Enter", () => {
    render(<CommandPalette {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type a command...");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(defaultProps.onExecute).toHaveBeenCalledWith(mockCommands[0]);
  });

  it("should call onClose on Escape", () => {
    render(<CommandPalette {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type a command...");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should call onClose when clicking overlay", () => {
    render(<CommandPalette {...defaultProps} />);

    // The overlay is the first div with modalOverlay style
    const overlay = screen.getByPlaceholderText("Type a command...").closest("div")?.parentElement;
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should execute command when clicking on it", () => {
    render(<CommandPalette {...defaultProps} />);

    fireEvent.click(screen.getByText("New Note"));

    expect(defaultProps.onExecute).toHaveBeenCalledWith(mockCommands[1]);
  });

  it("should filter case-insensitively", () => {
    render(<CommandPalette {...defaultProps} query="SAVE" />);

    expect(screen.getByText("Save Note")).toBeInTheDocument();
  });
});
