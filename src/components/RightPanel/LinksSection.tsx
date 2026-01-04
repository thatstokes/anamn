import type { Note } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";

interface LinksSectionProps {
  selectedNote: Note | null;
  outgoingLinks: string[];
  backlinks: Note[];
  notes: Note[];
  onLinkClick: (linkTitle: string) => void;
  onSelectNote: (note: Note) => void;
}

export function LinksSection({
  selectedNote,
  outgoingLinks,
  backlinks,
  notes,
  onLinkClick,
  onSelectNote,
}: LinksSectionProps) {
  if (!selectedNote) {
    return <div style={styles.rightPanelEmpty}>Select a note to see links</div>;
  }

  if (outgoingLinks.length === 0 && backlinks.length === 0) {
    return <div style={styles.rightPanelEmpty}>No links</div>;
  }

  return (
    <>
      {outgoingLinks.length > 0 && (
        <>
          <div style={styles.linksPanelHeader}>Outbound ({outgoingLinks.length})</div>
          <ul style={styles.linksList}>
            {outgoingLinks.map((link) => {
              const exists = notes.some((n) => n.title === link);
              return (
                <li
                  key={link}
                  onClick={() => onLinkClick(link)}
                  style={{
                    ...styles.linkItem,
                    color: exists ? "#6b9eff" : "#888",
                  }}
                >
                  {link}
                  {!exists && <span style={styles.newBadge}>new</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {backlinks.length > 0 && (
        <>
          <div style={styles.linksPanelHeader}>Inbound ({backlinks.length})</div>
          <ul style={styles.linksList}>
            {backlinks.map((note) => (
              <li
                key={note.path}
                onClick={() => onSelectNote(note)}
                style={{
                  ...styles.linkItem,
                  color: "#6b9eff",
                }}
              >
                {note.title}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
