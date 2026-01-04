import type { Note } from "../../../shared/types.js";

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
    return <div className="right-panel-empty">Select a note to see links</div>;
  }

  if (outgoingLinks.length === 0 && backlinks.length === 0) {
    return <div className="right-panel-empty">No links</div>;
  }

  return (
    <>
      {outgoingLinks.length > 0 && (
        <>
          <div className="links-panel-header">Outbound ({outgoingLinks.length})</div>
          <ul className="links-list">
            {outgoingLinks.map((link) => {
              const exists = notes.some((n) => n.title === link);
              return (
                <li
                  key={link}
                  onClick={() => onLinkClick(link)}
                  className={`link-item ${exists ? "exists" : "missing"}`}
                >
                  {link}
                  {!exists && <span className="new-badge">new</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {backlinks.length > 0 && (
        <>
          <div className="links-panel-header">Inbound ({backlinks.length})</div>
          <ul className="links-list">
            {backlinks.map((note) => (
              <li
                key={note.path}
                onClick={() => onSelectNote(note)}
                className="link-item exists"
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
