import { useRef, useState, useCallback } from "react";
import type { Note } from "../../../shared/types.js";

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onContextMenu: (e: React.MouseEvent, note: Note) => void;
}

export function NoteList({
  notes,
  selectedNote,
  onSelectNote,
  onContextMenu,
}: NoteListProps) {
  const noteListRef = useRef<HTMLUListElement>(null);
  const [focusedNoteIndex, setFocusedNoteIndex] = useState<number>(-1);
  const [hasFocus, setHasFocus] = useState(false);

  const scrollNoteIntoView = useCallback((index: number) => {
    const noteList = noteListRef.current;
    if (!noteList) return;
    const noteElement = noteList.children[index] as HTMLElement | undefined;
    noteElement?.scrollIntoView({ block: "nearest" });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (notes.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedNoteIndex((prev) => {
        const next = prev < notes.length - 1 ? prev + 1 : 0;
        scrollNoteIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedNoteIndex((prev) => {
        const next = prev > 0 ? prev - 1 : notes.length - 1;
        scrollNoteIntoView(next);
        return next;
      });
    } else if (e.key === "Enter" && focusedNoteIndex >= 0) {
      e.preventDefault();
      const note = notes[focusedNoteIndex];
      if (note) {
        onSelectNote(note);
      }
    } else if (e.key === "Escape") {
      setHasFocus(false);
      setFocusedNoteIndex(-1);
      noteListRef.current?.blur();
    }
  }, [notes, focusedNoteIndex, onSelectNote, scrollNoteIntoView]);

  const handleFocus = useCallback(() => {
    setHasFocus(true);
    if (focusedNoteIndex === -1 && notes.length > 0) {
      const selectedIndex = notes.findIndex((n) => n.path === selectedNote?.path);
      setFocusedNoteIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [focusedNoteIndex, notes, selectedNote?.path]);

  const handleBlur = useCallback(() => {
    setHasFocus(false);
  }, []);

  return (
    <ul
      ref={noteListRef}
      className="note-list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {notes.map((note, index) => {
        const isSelected = selectedNote?.path === note.path;
        const isFocused = hasFocus && focusedNoteIndex === index;
        return (
          <li
            key={note.path}
            onClick={() => onSelectNote(note)}
            onContextMenu={(e) => onContextMenu(e, note)}
            className={`note-item ${isSelected ? "selected" : ""} ${isFocused ? "focused" : ""}`}
          >
            {note.title}
          </li>
        );
      })}
    </ul>
  );
}
