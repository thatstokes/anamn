import type { Note } from "../../../shared/types.js";

interface TagsSectionProps {
  selectedNote: Note | null;
  tags: string[];
  onTagClick: (tag: string) => void;
}

export function TagsSection({
  selectedNote,
  tags,
  onTagClick,
}: TagsSectionProps) {
  if (!selectedNote) {
    return <div className="right-panel-empty">Select a note to see tags</div>;
  }

  if (tags.length === 0) {
    return <div className="right-panel-empty">No tags</div>;
  }

  return (
    <div className="tags-container">
      {tags.map((tag) => (
        <span
          key={tag}
          onClick={() => onTagClick(tag)}
          className="tag-pill"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
