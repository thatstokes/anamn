import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "./Sidebar.js";
import type { Note } from "../../../shared/types.js";

describe("Sidebar", () => {
  const mockNotes: Note[] = [
    { path: "/notes/note1.md", title: "Note 1" },
    { path: "/notes/note2.md", title: "Note 2" },
  ];

  const defaultProps = {
    notes: mockNotes,
    selectedNote: null,
    newNoteTitle: null,
    setNewNoteTitle: vi.fn(),
    onSelectNote: vi.fn(),
    onCreateNote: vi.fn(),
    onContextMenu: vi.fn(),
    onChangeWorkspace: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the sidebar header", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("should render the new note button", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("should call onCreateNote when clicking the new note button", () => {
    render(<Sidebar {...defaultProps} />);

    fireEvent.click(screen.getByText("+"));

    expect(defaultProps.onCreateNote).toHaveBeenCalled();
  });

  it("should render notes list", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("Note 1")).toBeInTheDocument();
    expect(screen.getByText("Note 2")).toBeInTheDocument();
  });

  it("should show new note input when newNoteTitle is not null", () => {
    render(<Sidebar {...defaultProps} newNoteTitle="" />);

    expect(screen.getByPlaceholderText("Note title...")).toBeInTheDocument();
  });

  it("should hide new note input when newNoteTitle is null", () => {
    render(<Sidebar {...defaultProps} newNoteTitle={null} />);

    expect(screen.queryByPlaceholderText("Note title...")).not.toBeInTheDocument();
  });

  it("should call setNewNoteTitle when typing in new note input", () => {
    render(<Sidebar {...defaultProps} newNoteTitle="" />);

    const input = screen.getByPlaceholderText("Note title...");
    fireEvent.change(input, { target: { value: "My Note" } });

    expect(defaultProps.setNewNoteTitle).toHaveBeenCalledWith("My Note");
  });

  it("should call setNewNoteTitle with null when pressing Escape in new note input", () => {
    render(<Sidebar {...defaultProps} newNoteTitle="" />);

    const input = screen.getByPlaceholderText("Note title...");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(defaultProps.setNewNoteTitle).toHaveBeenCalledWith(null);
  });

  it("should render the change folder button", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("Change Folder")).toBeInTheDocument();
  });

  it("should call onChangeWorkspace when clicking change folder button", () => {
    render(<Sidebar {...defaultProps} />);

    fireEvent.click(screen.getByText("Change Folder"));

    expect(defaultProps.onChangeWorkspace).toHaveBeenCalled();
  });
});
