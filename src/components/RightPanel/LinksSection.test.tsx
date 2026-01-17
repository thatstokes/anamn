import { render, screen, fireEvent } from "@testing-library/react";
import { LinksSection } from "./LinksSection.js";
import type { Note } from "../../../shared/types.js";

describe("LinksSection", () => {
  const mockNote: Note = { path: "/notes/test.md", title: "Test Note", folder: "" };
  const mockNotes: Note[] = [
    mockNote,
    { path: "/notes/other.md", title: "Other Note", folder: "" },
  ];

  const defaultProps = {
    selectedNote: mockNote,
    outgoingLinks: [],
    backlinks: [],
    notes: mockNotes,
    onLinkClick: vi.fn(),
    onSelectNote: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show empty message when no note is selected", () => {
    render(<LinksSection {...defaultProps} selectedNote={null} />);

    expect(screen.getByText("Select a note to see links")).toBeInTheDocument();
  });

  it("should show no links message when there are no links", () => {
    render(<LinksSection {...defaultProps} />);

    expect(screen.getByText("No links")).toBeInTheDocument();
  });

  it("should display outgoing links", () => {
    render(<LinksSection {...defaultProps} outgoingLinks={["Other Note", "New Link"]} />);

    expect(screen.getByText("Outbound (2)")).toBeInTheDocument();
    expect(screen.getByText("Other Note")).toBeInTheDocument();
    expect(screen.getByText("New Link")).toBeInTheDocument();
  });

  it("should show 'new' badge for non-existent links", () => {
    render(<LinksSection {...defaultProps} outgoingLinks={["Non Existent"]} />);

    expect(screen.getByText("new")).toBeInTheDocument();
  });

  it("should not show 'new' badge for existing links", () => {
    render(<LinksSection {...defaultProps} outgoingLinks={["Other Note"]} />);

    expect(screen.queryByText("new")).not.toBeInTheDocument();
  });

  it("should call onLinkClick when clicking an outgoing link", () => {
    render(<LinksSection {...defaultProps} outgoingLinks={["Other Note"]} />);

    fireEvent.click(screen.getByText("Other Note"));

    expect(defaultProps.onLinkClick).toHaveBeenCalledWith("Other Note");
  });

  it("should display backlinks", () => {
    const backlinks: Note[] = [
      { path: "/notes/back1.md", title: "Backlink 1", folder: "" },
      { path: "/notes/back2.md", title: "Backlink 2", folder: "" },
    ];
    render(<LinksSection {...defaultProps} backlinks={backlinks} />);

    expect(screen.getByText("Inbound (2)")).toBeInTheDocument();
    expect(screen.getByText("Backlink 1")).toBeInTheDocument();
    expect(screen.getByText("Backlink 2")).toBeInTheDocument();
  });

  it("should call onSelectNote when clicking a backlink", () => {
    const backlinks: Note[] = [{ path: "/notes/back.md", title: "Backlink", folder: "" }];
    render(<LinksSection {...defaultProps} backlinks={backlinks} />);

    fireEvent.click(screen.getByText("Backlink"));

    expect(defaultProps.onSelectNote).toHaveBeenCalledWith(backlinks[0]);
  });

  it("should display both outgoing links and backlinks when present", () => {
    const backlinks: Note[] = [{ path: "/notes/back.md", title: "Backlink", folder: "" }];
    render(<LinksSection {...defaultProps} outgoingLinks={["Other Note"]} backlinks={backlinks} />);

    expect(screen.getByText("Outbound (1)")).toBeInTheDocument();
    expect(screen.getByText("Inbound (1)")).toBeInTheDocument();
  });
});
