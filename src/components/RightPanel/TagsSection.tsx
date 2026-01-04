import type { Note } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";

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
    return <div style={styles.rightPanelEmpty}>Select a note to see tags</div>;
  }

  if (tags.length === 0) {
    return <div style={styles.rightPanelEmpty}>No tags</div>;
  }

  return (
    <div style={styles.tagsContainer}>
      {tags.map((tag) => (
        <span
          key={tag}
          onClick={() => onTagClick(tag)}
          style={styles.tagPill}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
