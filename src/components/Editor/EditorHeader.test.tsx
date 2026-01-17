import { render, screen, fireEvent } from "@testing-library/react";
import { EditorHeader } from "./EditorHeader.js";
import type { Note } from "../../../shared/types.js";

describe("EditorHeader", () => {
  const mockNote: Note = { path: "/notes/test.md", title: "Test Note", folder: "" };

  const defaultProps = {
    selectedNote: mockNote,
    isRenaming: false,
    renameTitle: "",
    setRenameTitle: vi.fn(),
    onStartRename: vi.fn(),
    onRename: vi.fn(),
    onCancelRename: vi.fn(),
    onDelete: vi.fn(),
    viewMode: "rendered" as const,
    setViewMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display the note title when not renaming", () => {
    render(<EditorHeader {...defaultProps} />);

    expect(screen.getByText("Test Note")).toBeInTheDocument();
  });

  it("should call onStartRename when clicking the title", () => {
    render(<EditorHeader {...defaultProps} />);

    fireEvent.click(screen.getByText("Test Note"));

    expect(defaultProps.onStartRename).toHaveBeenCalled();
  });

  it("should show rename input when isRenaming is true", () => {
    render(<EditorHeader {...defaultProps} isRenaming={true} renameTitle="Test Note" />);

    expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument();
  });

  it("should call setRenameTitle when typing in rename input", () => {
    render(<EditorHeader {...defaultProps} isRenaming={true} renameTitle="Test" />);

    const input = screen.getByDisplayValue("Test");
    fireEvent.change(input, { target: { value: "New Title" } });

    expect(defaultProps.setRenameTitle).toHaveBeenCalledWith("New Title");
  });

  it("should call onRename when pressing Enter in rename input", () => {
    render(<EditorHeader {...defaultProps} isRenaming={true} renameTitle="Test" />);

    const input = screen.getByDisplayValue("Test");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(defaultProps.onRename).toHaveBeenCalled();
  });

  it("should call onCancelRename when pressing Escape in rename input", () => {
    render(<EditorHeader {...defaultProps} isRenaming={true} renameTitle="Test" />);

    const input = screen.getByDisplayValue("Test");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(defaultProps.onCancelRename).toHaveBeenCalled();
  });

  it("should call onRename when rename input loses focus", () => {
    render(<EditorHeader {...defaultProps} isRenaming={true} renameTitle="Test" />);

    const input = screen.getByDisplayValue("Test");
    fireEvent.blur(input);

    expect(defaultProps.onRename).toHaveBeenCalled();
  });

  it("should call onDelete when clicking delete button", () => {
    render(<EditorHeader {...defaultProps} />);

    const deleteButton = screen.getByTitle("Delete note");
    fireEvent.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it("should render Edit and View buttons", () => {
    render(<EditorHeader {...defaultProps} />);

    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("should call setViewMode with 'edit' when clicking Edit button", () => {
    render(<EditorHeader {...defaultProps} />);

    fireEvent.click(screen.getByText("Edit"));

    expect(defaultProps.setViewMode).toHaveBeenCalledWith("edit");
  });

  it("should call setViewMode with 'rendered' when clicking View button", () => {
    render(<EditorHeader {...defaultProps} viewMode="edit" />);

    fireEvent.click(screen.getByText("View"));

    expect(defaultProps.setViewMode).toHaveBeenCalledWith("rendered");
  });

  it("should highlight the active view mode button", () => {
    const { rerender } = render(<EditorHeader {...defaultProps} viewMode="edit" />);

    const editButton = screen.getByText("Edit");
    const viewButton = screen.getByText("View");

    expect(editButton).toHaveClass("active");
    expect(viewButton).not.toHaveClass("active");

    rerender(<EditorHeader {...defaultProps} viewMode="rendered" />);

    expect(editButton).not.toHaveClass("active");
    expect(viewButton).toHaveClass("active");
  });
});
