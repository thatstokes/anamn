import { useEffect, useRef } from "react";
import type { KeyboardShortcuts, ViewMode, Note } from "../../../shared/types.js";

interface Selection {
  type: "char" | "line";
  anchor: number;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcuts | null;
  selectedNote: Note | null;
  content: string;
  viewMode: ViewMode;
  searchQuery: string;
  newNoteTitle: string | null;
  showCommandPalette: boolean;
  showRightPanel: boolean;
  showFindBar: boolean;
  linkAutocompleteShow: boolean;
  findMatches: number[];
  selection: Selection | null;

  // Setters
  setContent: React.Dispatch<React.SetStateAction<string>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setNewNoteTitle: React.Dispatch<React.SetStateAction<string | null>>;
  setShowCommandPalette: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRightPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFindBar: React.Dispatch<React.SetStateAction<boolean>>;
  setLinkAutocomplete: React.Dispatch<React.SetStateAction<{ show: boolean; query: string; startPos: number; selectedIndex: number }>>;
  setCurrentMatchIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelection: React.Dispatch<React.SetStateAction<Selection | null>>;
  setCommandQuery: React.Dispatch<React.SetStateAction<string>>;

  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  renderedViewRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  newNoteInputRef: React.RefObject<HTMLInputElement | null>;
  commandInputRef: React.RefObject<HTMLInputElement | null>;
  findInputRef: React.RefObject<HTMLInputElement | null>;

  // Callbacks
  saveNote: () => Promise<void>;
  closeFindBar: () => void;
  onOpenDaily: () => void;
}

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const needsCtrl = parts.includes("ctrl") || parts.includes("meta") || parts.includes("cmd");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");

  const ctrlMatch = needsCtrl === (e.ctrlKey || e.metaKey);
  const shiftMatch = needsShift === e.shiftKey;
  const altMatch = needsAlt === e.altKey;
  const keyMatch = e.key.toLowerCase() === key || e.code.toLowerCase() === `key${key}`;

  return ctrlMatch && shiftMatch && altMatch && keyMatch;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const {
    shortcuts,
    selectedNote,
    content,
    viewMode,
    searchQuery,
    newNoteTitle,
    showCommandPalette,
    showRightPanel,
    showFindBar,
    linkAutocompleteShow,
    findMatches,
    selection,
    setContent,
    setViewMode,
    setSearchQuery,
    setNewNoteTitle,
    setShowCommandPalette,
    setShowRightPanel,
    setShowFindBar,
    setLinkAutocomplete,
    setCurrentMatchIndex,
    setSelection,
    setCommandQuery,
    textareaRef,
    renderedViewRef,
    searchInputRef,
    newNoteInputRef,
    commandInputRef,
    findInputRef,
    saveNote,
    closeFindBar,
    onOpenDaily,
  } = options;

  const pendingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Escape key - close panels/modes
      if (matchesShortcut(e, shortcuts.closePanel)) {
        e.preventDefault();
        if (showCommandPalette) {
          setShowCommandPalette(false);
          setCommandQuery("");
        } else if (showFindBar) {
          closeFindBar();
        } else if (linkAutocompleteShow) {
          setLinkAutocomplete({ show: false, query: "", startPos: 0, selectedIndex: 0 });
        } else if (viewMode === "edit" && selectedNote) {
          setViewMode("rendered");
        } else if (searchQuery) {
          setSearchQuery("");
        } else if (newNoteTitle !== null) {
          setNewNoteTitle(null);
        } else if (showRightPanel) {
          setShowRightPanel(false);
        }
        return;
      }

      // Command palette (works even in input)
      if (matchesShortcut(e, shortcuts.commandPalette)) {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
        setCommandQuery("");
        setTimeout(() => commandInputRef.current?.focus(), 0);
        return;
      }

      // Right panel toggle (works even in input)
      if (matchesShortcut(e, shortcuts.rightPanel)) {
        e.preventDefault();
        setShowRightPanel((v) => !v);
        return;
      }

      // Daily note (works even in input)
      if (matchesShortcut(e, shortcuts.dailyNote)) {
        e.preventDefault();
        onOpenDaily();
        return;
      }

      // Ctrl+F to find in note
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && selectedNote) {
        e.preventDefault();
        setShowFindBar(true);
        setTimeout(() => findInputRef.current?.focus(), 0);
        return;
      }

      // Selection keybindings (checked before skipping input shortcuts)
      if (selectedNote && viewMode === "edit" && selection) {
        const textarea = textareaRef.current;
        if (textarea) {
          const getLineStart = (pos: number) => {
            const lastNewline = content.lastIndexOf("\n", pos - 1);
            return lastNewline === -1 ? 0 : lastNewline + 1;
          };
          const getLineEnd = (pos: number) => {
            const nextNewline = content.indexOf("\n", pos);
            return nextNewline === -1 ? content.length : nextNewline + 1;
          };

          // "h" - move selection left
          if (e.key === "h" && selection.type === "char") {
            e.preventDefault();
            const head = textarea.selectionStart === selection.anchor
              ? textarea.selectionEnd
              : textarea.selectionStart;
            const newHead = Math.max(0, head - 1);
            const start = Math.min(selection.anchor, newHead);
            const end = Math.max(selection.anchor, newHead);
            textarea.setSelectionRange(start, Math.max(end, start + 1));
            return;
          }

          // "l" - move selection right
          if (e.key === "l" && selection.type === "char") {
            e.preventDefault();
            const head = textarea.selectionEnd === selection.anchor
              ? textarea.selectionStart
              : textarea.selectionEnd;
            const newHead = Math.min(content.length, head + 1);
            const start = Math.min(selection.anchor, newHead);
            const end = Math.max(selection.anchor, newHead);
            textarea.setSelectionRange(start, end);
            return;
          }

          // "j" - move selection down
          if (e.key === "j") {
            e.preventDefault();
            if (selection.type === "line") {
              const currentEnd = textarea.selectionEnd;
              const newEnd = getLineEnd(currentEnd);
              textarea.setSelectionRange(textarea.selectionStart, newEnd);
            } else {
              const head = textarea.selectionStart === selection.anchor
                ? textarea.selectionEnd
                : textarea.selectionStart;
              const lineStart = getLineStart(head);
              const col = head - lineStart;
              const nextLineStart = getLineEnd(head);
              if (nextLineStart < content.length) {
                const nextLineEnd = getLineEnd(nextLineStart);
                const newHead = Math.min(nextLineStart + col, nextLineEnd - 1);
                const start = Math.min(selection.anchor, newHead);
                const end = Math.max(selection.anchor, newHead);
                textarea.setSelectionRange(start, end);
              }
            }
            return;
          }

          // "k" - move selection up
          if (e.key === "k") {
            e.preventDefault();
            if (selection.type === "line") {
              const currentStart = textarea.selectionStart;
              if (currentStart > 0) {
                const prevLineStart = getLineStart(currentStart - 1);
                textarea.setSelectionRange(prevLineStart, textarea.selectionEnd);
              }
            } else {
              const head = textarea.selectionStart === selection.anchor
                ? textarea.selectionEnd
                : textarea.selectionStart;
              const lineStart = getLineStart(head);
              if (lineStart > 0) {
                const col = head - lineStart;
                const prevLineStart = getLineStart(lineStart - 1);
                const prevLineEnd = lineStart - 1;
                const newHead = Math.min(prevLineStart + col, prevLineEnd);
                const start = Math.min(selection.anchor, newHead);
                const end = Math.max(selection.anchor, newHead);
                textarea.setSelectionRange(start, end);
              }
            }
            return;
          }

          // "y" - yank (copy) selection
          if (e.key === "y") {
            e.preventDefault();
            const selected = content.slice(textarea.selectionStart, textarea.selectionEnd);
            navigator.clipboard.writeText(selected);
            setSelection(null);
            setViewMode("rendered");
            return;
          }

          // "d" - delete selection
          if (e.key === "d") {
            e.preventDefault();
            const before = content.slice(0, textarea.selectionStart);
            const after = content.slice(textarea.selectionEnd);
            setContent(before + after);
            setSelection(null);
            setViewMode("rendered");
            return;
          }

          // "Escape" - cancel selection
          if (e.key === "Escape") {
            e.preventDefault();
            setSelection(null);
            setViewMode("rendered");
            return;
          }
        }
      }

      // Skip other shortcuts when in input
      if (isInput) return;

      // New note
      if (matchesShortcut(e, shortcuts.newNote)) {
        e.preventDefault();
        setNewNoteTitle("");
        setTimeout(() => newNoteInputRef.current?.focus(), 0);
        return;
      }

      // Search
      if (matchesShortcut(e, shortcuts.search)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Toggle view
      if (matchesShortcut(e, shortcuts.toggleView) && selectedNote) {
        e.preventDefault();
        setViewMode((v) => (v === "edit" ? "rendered" : "edit"));
        return;
      }

      // Save
      if (matchesShortcut(e, shortcuts.save) && selectedNote) {
        e.preventDefault();
        saveNote();
        return;
      }

      // Vim-like keybindings (only in view mode with a selected note)
      if (selectedNote && viewMode === "rendered") {
        const renderedView = renderedViewRef.current;

        // Handle multi-key sequences (like "gg")
        if (pendingKeyRef.current === "g" && e.key === "g") {
          e.preventDefault();
          pendingKeyRef.current = null;
          if (renderedView) renderedView.scrollTop = 0;
          return;
        }

        if (pendingKeyRef.current && e.key !== "g") {
          pendingKeyRef.current = null;
        }

        // "i" - enter insert mode
        if (e.key === "i") {
          e.preventDefault();
          setViewMode("edit");
          setTimeout(() => textareaRef.current?.focus(), 0);
          return;
        }

        // "a" - append
        if (e.key === "a") {
          e.preventDefault();
          setViewMode("edit");
          setTimeout(() => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(content.length, content.length);
            }
          }, 0);
          return;
        }

        // "A" - append at end
        if (e.key === "A") {
          e.preventDefault();
          setViewMode("edit");
          setTimeout(() => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(content.length, content.length);
            }
          }, 0);
          return;
        }

        // "o" - open line below
        if (e.key === "o") {
          e.preventDefault();
          const newContent = content + "\n";
          setContent(newContent);
          setViewMode("edit");
          setTimeout(() => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(newContent.length, newContent.length);
            }
          }, 0);
          return;
        }

        // "O" - open line above
        if (e.key === "O") {
          e.preventDefault();
          const newContent = "\n" + content;
          setContent(newContent);
          setViewMode("edit");
          setTimeout(() => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(0, 0);
            }
          }, 0);
          return;
        }

        // "j" - scroll down
        if (e.key === "j") {
          e.preventDefault();
          renderedView?.scrollBy({ top: 40 });
          return;
        }

        // "k" - scroll up
        if (e.key === "k") {
          e.preventDefault();
          renderedView?.scrollBy({ top: -40 });
          return;
        }

        // "g" - start of gg sequence
        if (e.key === "g") {
          e.preventDefault();
          pendingKeyRef.current = "g";
          setTimeout(() => { pendingKeyRef.current = null; }, 1000);
          return;
        }

        // "G" - go to bottom
        if (e.key === "G") {
          e.preventDefault();
          if (renderedView) renderedView.scrollTop = renderedView.scrollHeight;
          return;
        }

        // Ctrl+d - half page down
        if (e.key === "d" && e.ctrlKey) {
          e.preventDefault();
          if (renderedView) renderedView.scrollBy({ top: renderedView.clientHeight / 2 });
          return;
        }

        // Ctrl+u - half page up
        if (e.key === "u" && e.ctrlKey) {
          e.preventDefault();
          if (renderedView) renderedView.scrollBy({ top: -renderedView.clientHeight / 2 });
          return;
        }

        // "/" - open search
        if (e.key === "/") {
          e.preventDefault();
          setShowFindBar(true);
          setTimeout(() => findInputRef.current?.focus(), 0);
          return;
        }

        // "n" - next search result
        if (e.key === "n" && findMatches.length > 0) {
          e.preventDefault();
          setCurrentMatchIndex((prev) => (prev + 1) % findMatches.length);
          return;
        }

        // "N" - previous search result
        if (e.key === "N" && findMatches.length > 0) {
          e.preventDefault();
          setCurrentMatchIndex((prev) => (prev - 1 + findMatches.length) % findMatches.length);
          return;
        }

        // ":" - open command palette
        if (e.key === ":") {
          e.preventDefault();
          setShowCommandPalette(true);
          setCommandQuery("");
          setTimeout(() => commandInputRef.current?.focus(), 0);
          return;
        }

        // "v" - start character-wise selection
        if (e.key === "v") {
          e.preventDefault();
          setViewMode("edit");
          setTimeout(() => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.focus();
              const pos = textarea.selectionStart;
              setSelection({ type: "char", anchor: pos });
              textarea.setSelectionRange(pos, pos + 1);
            }
          }, 0);
          return;
        }

        // "V" - start line-wise selection
        if (e.key === "V") {
          e.preventDefault();
          setViewMode("edit");
          setTimeout(() => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.focus();
              const lineEnd = content.indexOf("\n");
              const end = lineEnd === -1 ? content.length : lineEnd + 1;
              setSelection({ type: "line", anchor: 0 });
              textarea.setSelectionRange(0, end);
            }
          }, 0);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    shortcuts,
    searchQuery,
    newNoteTitle,
    selectedNote,
    saveNote,
    showCommandPalette,
    showRightPanel,
    showFindBar,
    viewMode,
    linkAutocompleteShow,
    content,
    findMatches,
    selection,
    setContent,
    setViewMode,
    setSearchQuery,
    setNewNoteTitle,
    setShowCommandPalette,
    setShowRightPanel,
    setShowFindBar,
    setLinkAutocomplete,
    setCurrentMatchIndex,
    setSelection,
    setCommandQuery,
    textareaRef,
    renderedViewRef,
    searchInputRef,
    newNoteInputRef,
    commandInputRef,
    findInputRef,
    closeFindBar,
    onOpenDaily,
  ]);
}
