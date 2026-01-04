import type { Note } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";

interface RecentNotesSectionProps {
  recentNotes: string[];
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
}

export function RecentNotesSection({
  recentNotes,
  notes,
  selectedNote,
  onSelectNote,
}: RecentNotesSectionProps) {
  if (recentNotes.length === 0) {
    return <div style={styles.rightPanelEmpty}>No recent notes</div>;
  }

  return (
    <ul style={styles.linksList}>
      {recentNotes.map((title) => {
        const note = notes.find((n) => n.title === title);
        if (!note) return null;
        return (
          <li
            key={title}
            onClick={() => onSelectNote(note)}
            style={{
              ...styles.linkItem,
              color: selectedNote?.title === title ? "#6b9eff" : "#e0e0e0",
            }}
          >
            {title}
          </li>
        );
      })}
    </ul>
  );
}
