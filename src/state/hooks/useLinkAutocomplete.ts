import { useState, useMemo, useCallback } from "react";
import type { Note } from "../../../shared/types.js";

interface LinkAutocompleteState {
  show: boolean;
  query: string;
  startPos: number;
  selectedIndex: number;
}

interface UseLinkAutocompleteOptions {
  notes: Note[];
  content: string;
  setContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface UseLinkAutocompleteResult {
  linkAutocomplete: LinkAutocompleteState;
  setLinkAutocomplete: React.Dispatch<React.SetStateAction<LinkAutocompleteState>>;
  linkSuggestions: Note[];
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  insertLinkSuggestion: (noteTitle: string) => void;
}

const initialState: LinkAutocompleteState = {
  show: false,
  query: "",
  startPos: 0,
  selectedIndex: 0,
};

export function useLinkAutocomplete({
  notes,
  content,
  setContent,
  textareaRef,
}: UseLinkAutocompleteOptions): UseLinkAutocompleteResult {
  const [linkAutocomplete, setLinkAutocomplete] = useState<LinkAutocompleteState>(initialState);

  const linkSuggestions = useMemo(() => {
    if (!linkAutocomplete.show || !linkAutocomplete.query) {
      return notes.slice(0, 10);
    }
    const query = linkAutocomplete.query.toLowerCase();
    return notes
      .filter((note) => note.title.toLowerCase().includes(query))
      .slice(0, 10);
  }, [notes, linkAutocomplete.show, linkAutocomplete.query]);

  const insertLinkSuggestion = useCallback((noteTitle: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf("[[");

    if (lastDoubleBracket === -1) return;

    const before = content.slice(0, lastDoubleBracket);
    const after = content.slice(cursorPos);
    const newContent = `${before}[[${noteTitle}]]${after}`;

    setContent(newContent);
    setLinkAutocomplete(initialState);

    const newCursorPos = lastDoubleBracket + noteTitle.length + 4;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, setContent, textareaRef]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(value);

    const textBeforeCursor = value.slice(0, cursorPos);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf("[[");
    const lastClosingBracket = textBeforeCursor.lastIndexOf("]]");

    if (lastDoubleBracket !== -1 && lastDoubleBracket > lastClosingBracket) {
      const query = textBeforeCursor.slice(lastDoubleBracket + 2);
      if (!query.includes("\n")) {
        setLinkAutocomplete({
          show: true,
          query,
          startPos: lastDoubleBracket + 2,
          selectedIndex: 0,
        });
        return;
      }
    }

    if (linkAutocomplete.show) {
      setLinkAutocomplete(initialState);
    }
  }, [setContent, linkAutocomplete.show]);

  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!linkAutocomplete.show) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setLinkAutocomplete((prev) => ({
        ...prev,
        selectedIndex: Math.min(prev.selectedIndex + 1, linkSuggestions.length - 1),
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLinkAutocomplete((prev) => ({
        ...prev,
        selectedIndex: Math.max(prev.selectedIndex - 1, 0),
      }));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (linkSuggestions.length > 0) {
        e.preventDefault();
        const selected = linkSuggestions[linkAutocomplete.selectedIndex];
        if (selected) {
          insertLinkSuggestion(selected.title);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLinkAutocomplete(initialState);
    }
  }, [linkAutocomplete.show, linkAutocomplete.selectedIndex, linkSuggestions, insertLinkSuggestion]);

  return {
    linkAutocomplete,
    setLinkAutocomplete,
    linkSuggestions,
    handleTextareaChange,
    handleTextareaKeyDown,
    insertLinkSuggestion,
  };
}
