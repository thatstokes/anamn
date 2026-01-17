import { render, screen, fireEvent } from "@testing-library/react";
import { ContextMenu } from "./ContextMenu.js";
import type { Note } from "../../shared/types.js";

describe("ContextMenu", () => {
  const mockNote: Note = { path: "/notes/test.md", title: "Test Note", folder: "" };

  const defaultProps = {
    note: mockNote,
    x: 100,
    y: 200,
    onRename: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Rename option", () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByText("Rename")).toBeInTheDocument();
  });

  it("should render Delete option", () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should call onRename when clicking Rename", () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByText("Rename"));

    expect(defaultProps.onRename).toHaveBeenCalled();
  });

  it("should call onDelete when clicking Delete", () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByText("Delete"));

    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it("should position the menu at the specified coordinates", () => {
    render(<ContextMenu {...defaultProps} x={150} y={250} />);

    const menu = screen.getByText("Rename").parentElement;
    expect(menu).toHaveStyle({ left: "150px", top: "250px" });
  });
});
