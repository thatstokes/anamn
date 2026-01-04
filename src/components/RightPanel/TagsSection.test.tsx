import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagsSection } from "./TagsSection.js";
import type { Note } from "../../../shared/types.js";

describe("TagsSection", () => {
  const mockNote: Note = {
    path: "/path/to/note.md",
    title: "Test Note",
  };

  it("shows empty message when no note is selected", () => {
    render(
      <TagsSection
        selectedNote={null}
        tags={["tag1", "tag2"]}
        onTagClick={vi.fn()}
      />
    );
    expect(screen.getByText("Select a note to see tags")).toBeInTheDocument();
  });

  it("shows empty message when there are no tags", () => {
    render(
      <TagsSection
        selectedNote={mockNote}
        tags={[]}
        onTagClick={vi.fn()}
      />
    );
    expect(screen.getByText("No tags")).toBeInTheDocument();
  });

  it("renders tags with # prefix", () => {
    render(
      <TagsSection
        selectedNote={mockNote}
        tags={["feature", "bug", "todo"]}
        onTagClick={vi.fn()}
      />
    );
    expect(screen.getByText("#feature")).toBeInTheDocument();
    expect(screen.getByText("#bug")).toBeInTheDocument();
    expect(screen.getByText("#todo")).toBeInTheDocument();
  });

  it("calls onTagClick when a tag is clicked", () => {
    const onTagClick = vi.fn();
    render(
      <TagsSection
        selectedNote={mockNote}
        tags={["clickable"]}
        onTagClick={onTagClick}
      />
    );

    fireEvent.click(screen.getByText("#clickable"));
    expect(onTagClick).toHaveBeenCalledWith("clickable");
  });

  it("renders multiple tags correctly", () => {
    const tags = ["alpha", "beta", "gamma", "delta"];
    render(
      <TagsSection
        selectedNote={mockNote}
        tags={tags}
        onTagClick={vi.fn()}
      />
    );

    tags.forEach((tag) => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument();
    });
  });
});
