import { useEffect } from "react";
import type { Note } from "../../../shared/types.js";

interface UseFileWatcherOptions {
  selectedNoteRef: React.RefObject<Note | null>;
  contentRef: React.RefObject<string>;
  lastSavedContentRef: React.MutableRefObject<string>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setRecentNotes: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedNote: React.Dispatch<React.SetStateAction<Note | null>>;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  setBacklinks: React.Dispatch<React.SetStateAction<Note[]>>;
}

export function useFileWatcher({
  selectedNoteRef,
  contentRef,
  lastSavedContentRef,
  setNotes,
  setRecentNotes,
  setSelectedNote,
  setContent,
  setBacklinks,
}: UseFileWatcherOptions): void {
  useEffect(() => {
    // Handle new file added externally
    const unsubAdd = window.api.watcher.onFileAdded((event) => {
      setNotes((prev) => {
        if (prev.some((n) => n.path === event.path)) return prev;
        return [...prev, { path: event.path, title: event.title, folder: event.folder }].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      });
    });

    // Handle file changed externally
    const unsubChange = window.api.watcher.onFileChanged(async (event) => {
      const currentNote = selectedNoteRef.current;
      if (currentNote && currentNote.path === event.path) {
        const newContent = await window.api.notes.read(event.path);
        if (newContent !== contentRef.current) {
          setContent(newContent);
          lastSavedContentRef.current = newContent;
        }
      }
      if (currentNote) {
        const backlinks = await window.api.notes.getBacklinks(currentNote.title);
        setBacklinks(backlinks);
      }
    });

    // Handle file deleted externally
    const unsubDelete = window.api.watcher.onFileDeleted((event) => {
      setNotes((prev) => prev.filter((n) => n.path !== event.path));
      setRecentNotes((prev) => prev.filter((t) => t !== event.title));

      const currentNote = selectedNoteRef.current;
      if (currentNote && currentNote.path === event.path) {
        setSelectedNote(null);
        setContent("");
      }
    });

    return () => {
      unsubAdd();
      unsubChange();
      unsubDelete();
    };
  }, [
    selectedNoteRef,
    contentRef,
    lastSavedContentRef,
    setNotes,
    setRecentNotes,
    setSelectedNote,
    setContent,
    setBacklinks,
  ]);
}
