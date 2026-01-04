import type { Note } from "../../../shared/types.js";

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
    return <div className="right-panel-empty">No recent notes</div>;
  }

  return (
    <ul className="links-list">
      {recentNotes.map((title) => {
        const note = notes.find((n) => n.title === title);
        if (!note) return null;
        const isSelected = selectedNote?.title === title;
        return (
          <li
            key={title}
            onClick={() => onSelectNote(note)}
            className={`link-item ${isSelected ? "selected" : ""}`}
          >
            {title}
          </li>
        );
      })}
    </ul>
  );
}
