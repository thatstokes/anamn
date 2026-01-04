import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { Note } from "../../../shared/types.js";

interface NotesContextValue {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  selectedNote: Note | null;
  setSelectedNote: React.Dispatch<React.SetStateAction<Note | null>>;
  backlinks: Note[];
  setBacklinks: React.Dispatch<React.SetStateAction<Note[]>>;
  recentNotes: string[];
  setRecentNotes: React.Dispatch<React.SetStateAction<string[]>>;
  trackRecentNote: (title: string) => void;
  // Refs for use in callbacks/effects
  selectedNoteRef: React.RefObject<Note | null>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [backlinks, setBacklinks] = useState<Note[]>([]);
  const [recentNotes, setRecentNotes] = useState<string[]>([]);

  // Load recentNotes from config on mount
  useEffect(() => {
    window.api.config.get().then((config) => {
      setRecentNotes(config.recentNotes);
    });
  }, []);

  // Keep ref in sync
  const selectedNoteRef = useRef<Note | null>(selectedNote);
  selectedNoteRef.current = selectedNote;

  const trackRecentNote = useCallback((title: string) => {
    setRecentNotes((prev) => {
      const filtered = prev.filter((t) => t !== title);
      const updated = [title, ...filtered].slice(0, 10);
      window.api.config.set({ recentNotes: updated });
      return updated;
    });
  }, []);

  const value = useMemo<NotesContextValue>(() => ({
    notes,
    setNotes,
    selectedNote,
    setSelectedNote,
    backlinks,
    setBacklinks,
    recentNotes,
    setRecentNotes,
    trackRecentNote,
    selectedNoteRef,
  }), [
    notes,
    selectedNote,
    backlinks,
    recentNotes,
    trackRecentNote,
  ]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
