import { render, screen, fireEvent } from "@testing-library/react";
import { NoteList } from "./NoteList.js";
import type { Note } from "../../../shared/types.js";

describe("NoteList", () => {
  const mockNotes: Note[] = [
    { path: "/notes/note1.md", title: "Note 1" },
    { path: "/notes/note2.md", title: "Note 2" },
    { path: "/notes/note3.md", title: "Note 3" },
  ];

  const defaultProps = {
    notes: mockNotes,
    selectedNote: null,
    onSelectNote: vi.fn(),
    onContextMenu: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all notes", () => {
    render(<NoteList {...defaultProps} />);

    expect(screen.getByText("Note 1")).toBeInTheDocument();
    expect(screen.getByText("Note 2")).toBeInTheDocument();
    expect(screen.getByText("Note 3")).toBeInTheDocument();
  });

  it("should call onSelectNote when clicking a note", () => {
    render(<NoteList {...defaultProps} />);

    fireEvent.click(screen.getByText("Note 2"));

    expect(defaultProps.onSelectNote).toHaveBeenCalledWith(mockNotes[1]);
  });

  it("should call onContextMenu on right click", () => {
    render(<NoteList {...defaultProps} />);

    fireEvent.contextMenu(screen.getByText("Note 1"));

    expect(defaultProps.onContextMenu).toHaveBeenCalled();
    expect(defaultProps.onContextMenu.mock.calls[0]?.[1]).toEqual(mockNotes[0]);
  });

  it("should highlight selected note", () => {
    render(<NoteList {...defaultProps} selectedNote={mockNotes[1]!} />);

    const selectedItem = screen.getByText("Note 2").closest("li");
    expect(selectedItem).toHaveStyle({ background: "#3a3a3a" });

    const unselectedItem = screen.getByText("Note 1").closest("li");
    expect(unselectedItem).toHaveStyle({ background: "transparent" });
  });

  it("should handle keyboard navigation with ArrowDown", () => {
    render(<NoteList {...defaultProps} />);

    const list = screen.getByRole("list");
    list.focus();

    // After focus, index is set to 0
    // First ArrowDown moves to 1, second to 2
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "Enter" });

    expect(defaultProps.onSelectNote).toHaveBeenCalledWith(mockNotes[2]);
  });

  it("should handle keyboard navigation with ArrowUp", () => {
    render(<NoteList {...defaultProps} />);

    const list = screen.getByRole("list");
    list.focus();

    // Start at index 0 after focus
    fireEvent.keyDown(list, { key: "ArrowUp" });
    fireEvent.keyDown(list, { key: "Enter" });

    // ArrowUp from 0 should wrap to last item (Note 3)
    expect(defaultProps.onSelectNote).toHaveBeenCalledWith(mockNotes[2]);
  });

  it("should handle empty notes list", () => {
    render(<NoteList {...defaultProps} notes={[]} />);

    const list = screen.getByRole("list");
    expect(list.children).toHaveLength(0);
  });
});
