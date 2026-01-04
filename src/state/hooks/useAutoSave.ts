import { useEffect, useRef, useCallback } from "react";
import type { Note } from "../../../shared/types.js";

interface UseAutoSaveOptions {
  note: Note | null;
  content: string;
  debounceMs?: number;
}

interface UseAutoSaveResult {
  saveNote: () => Promise<void>;
  lastSavedContentRef: React.MutableRefObject<string>;
}

export function useAutoSave({
  note,
  content,
  debounceMs = 500,
}: UseAutoSaveOptions): UseAutoSaveResult {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");

  // Keep refs in sync for use in callbacks
  const contentRef = useRef(content);
  const noteRef = useRef(note);
  contentRef.current = content;
  noteRef.current = note;

  const saveNote = useCallback(async () => {
    const currentNote = noteRef.current;
    const currentContent = contentRef.current;
    if (currentNote && currentContent !== lastSavedContentRef.current) {
      await window.api.notes.write(currentNote.path, currentContent);
      lastSavedContentRef.current = currentContent;
    }
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (note && content !== lastSavedContentRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveNote();
      }, debounceMs);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, note, saveNote, debounceMs]);

  return { saveNote, lastSavedContentRef };
}
