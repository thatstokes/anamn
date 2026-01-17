import { render, screen, fireEvent } from "@testing-library/react";
import { RecentNotesSection } from "./RecentNotesSection.js";
import type { Note } from "../../../shared/types.js";

describe("RecentNotesSection", () => {
  const mockNotes: Note[] = [
    { path: "/notes/note1.md", title: "Note 1", folder: "" },
    { path: "/notes/note2.md", title: "Note 2", folder: "" },
    { path: "/notes/note3.md", title: "Note 3", folder: "" },
  ];

  const defaultProps = {
    recentNotes: [],
    notes: mockNotes,
    selectedNote: null,
    onSelectNote: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show empty message when there are no recent notes", () => {
    render(<RecentNotesSection {...defaultProps} />);

    expect(screen.getByText("No recent notes")).toBeInTheDocument();
  });

  it("should display recent notes", () => {
    render(<RecentNotesSection {...defaultProps} recentNotes={["Note 1", "Note 2"]} />);

    expect(screen.getByText("Note 1")).toBeInTheDocument();
    expect(screen.getByText("Note 2")).toBeInTheDocument();
  });

  it("should not display recent notes that no longer exist", () => {
    render(<RecentNotesSection {...defaultProps} recentNotes={["Note 1", "Deleted Note"]} />);

    expect(screen.getByText("Note 1")).toBeInTheDocument();
    expect(screen.queryByText("Deleted Note")).not.toBeInTheDocument();
  });

  it("should call onSelectNote when clicking a recent note", () => {
    render(<RecentNotesSection {...defaultProps} recentNotes={["Note 1"]} />);

    fireEvent.click(screen.getByText("Note 1"));

    expect(defaultProps.onSelectNote).toHaveBeenCalledWith(mockNotes[0]);
  });

  it("should highlight the selected note", () => {
    render(
      <RecentNotesSection
        {...defaultProps}
        recentNotes={["Note 1", "Note 2"]}
        selectedNote={mockNotes[0]!}
      />
    );

    const note1 = screen.getByText("Note 1").closest("li");
    const note2 = screen.getByText("Note 2").closest("li");

    expect(note1).toHaveClass("selected");
    expect(note2).not.toHaveClass("selected");
  });
});
