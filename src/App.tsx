import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Note, ViewMode, RightPanelSection } from "../shared/types.js";
import { getUniqueLinks } from "../shared/links.js";
import { styles } from "./styles/styles.js";

// Hooks
import { useAutoSave } from "./state/hooks/useAutoSave.js";
import { useDebouncedSearch } from "./state/hooks/useDebouncedSearch.js";
import { useFindInNote } from "./state/hooks/useFindInNote.js";
import { useLinkAutocomplete } from "./state/hooks/useLinkAutocomplete.js";
import { useFileWatcher } from "./state/hooks/useFileWatcher.js";
import { useKeyboardShortcuts } from "./state/hooks/useKeyboardShortcuts.js";

// Components
import { TopHeader } from "./components/TopHeader.js";
import { Sidebar } from "./components/Sidebar/Sidebar.js";
import { Editor } from "./components/Editor/Editor.js";
import { RightPanel } from "./components/RightPanel/RightPanel.js";
import { ContextMenu } from "./components/ContextMenu.js";
import { CommandPalette } from "./components/CommandPalette.js";

export function App() {
  // Workspace state
  const [workspace, setWorkspace] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [backlinks, setBacklinks] = useState<Note[]>([]);
  const [recentNotes, setRecentNotes] = useState<string[]>([]);

  // Editor state
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const [selection, setSelection] = useState<{ type: "char" | "line"; anchor: number } | null>(null);

  // UI state
  const [newNoteTitle, setNewNoteTitle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shortcuts, setShortcuts] = useState<import("../shared/types.js").KeyboardShortcuts | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [contextMenu, setContextMenu] = useState<{ note: Note; x: number; y: number } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelSections, setRightPanelSections] = useState<RightPanelSection[]>(["links", "graph"]);
  const [collapsedSections, setCollapsedSections] = useState<Set<RightPanelSection>>(new Set());

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newNoteInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderedViewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(content);
  const selectedNoteRef = useRef(selectedNote);
  contentRef.current = content;
  selectedNoteRef.current = selectedNote;

  // Auto-save hook
  const { saveNote, lastSavedContentRef } = useAutoSave({
    note: selectedNote,
    content,
  });

  // Debounced search hook
  const { results: searchResults, isSearching } = useDebouncedSearch({
    query: searchQuery,
  });

  // Find in note hook
  const {
    showFindBar,
    setShowFindBar,
    findQuery,
    setFindQuery,
    findMatches,
    currentMatchIndex,
    setCurrentMatchIndex,
    findNext,
    findPrevious,
    closeFindBar,
  } = useFindInNote({
    content,
    viewMode,
    textareaRef,
  });

  // Link autocomplete hook
  const {
    linkAutocomplete,
    setLinkAutocomplete,
    linkSuggestions,
    handleTextareaChange,
    handleTextareaKeyDown,
    insertLinkSuggestion,
  } = useLinkAutocomplete({
    notes,
    content,
    setContent,
    textareaRef,
  });

  // File watcher hook
  useFileWatcher({
    selectedNoteRef,
    contentRef,
    lastSavedContentRef,
    setNotes,
    setRecentNotes,
    setSelectedNote,
    setContent,
    setBacklinks,
  });

  // Keyboard shortcuts hook
  useKeyboardShortcuts({
    shortcuts,
    selectedNote,
    content,
    viewMode,
    searchQuery,
    newNoteTitle,
    showCommandPalette,
    showRightPanel,
    showFindBar,
    linkAutocompleteShow: linkAutocomplete.show,
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
  });

  // Load config on mount
  useEffect(() => {
    window.api.config.get().then((config) => {
      setViewMode(config.default_view_mode);
      setShortcuts(config.shortcuts);
      setRecentNotes(config.recentNotes);
      setRightPanelSections(config.rightPanelSections);
      setShowRightPanel(config.rightPanelOpen);
      setCollapsedSections(new Set(config.collapsedSections));
    });
  }, []);

  // Load workspace
  useEffect(() => {
    window.api.workspace.get().then(setWorkspace);
  }, []);

  // Load notes when workspace changes
  useEffect(() => {
    if (workspace) {
      window.api.notes.list().then(setNotes);
    }
  }, [workspace]);

  // Restore last opened note
  const hasRestoredNote = useRef(false);
  useEffect(() => {
    if (hasRestoredNote.current || notes.length === 0) return;

    window.api.config.get().then((config) => {
      if (config.lastOpenedNote) {
        const note = notes.find((n) => n.path === config.lastOpenedNote);
        if (note) {
          hasRestoredNote.current = true;
          handleSelectNote(note);
        }
      }
    });
  }, [notes]);

  // Track recent notes
  const trackRecentNote = useCallback((title: string) => {
    setRecentNotes((prev) => {
      const filtered = prev.filter((t) => t !== title);
      const updated = [title, ...filtered].slice(0, 10);
      window.api.config.set({ recentNotes: updated });
      return updated;
    });
  }, []);

  // Close context menu on click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // Handlers
  const handleSelectWorkspace = async () => {
    const path = await window.api.workspace.select();
    if (path) {
      setWorkspace(path);
      setSelectedNote(null);
      setContent("");
    }
  };

  const handleSelectNote = async (note: Note) => {
    await saveNote();
    setSelectedNote(note);
    setIsRenaming(false);
    setViewMode("rendered");
    const text = await window.api.notes.read(note.path);
    setContent(text);
    lastSavedContentRef.current = text;
    trackRecentNote(note.title);
    window.api.config.set({ lastOpenedNote: note.path });
    const inboundLinks = await window.api.notes.getBacklinks(note.title);
    setBacklinks(inboundLinks);
  };

  const handleCreateNote = async () => {
    if (newNoteTitle === null) {
      setNewNoteTitle("");
      return;
    }
    if (!newNoteTitle.trim()) {
      setNewNoteTitle(null);
      return;
    }
    try {
      const note = await window.api.notes.create(newNoteTitle.trim());
      setNotes((prev) => [...prev, note].sort((a, b) => a.title.localeCompare(b.title)));
      setSelectedNote(note);
      setContent("");
      setNewNoteTitle(null);
    } catch (err) {
      console.error("Failed to create note:", err);
      alert(err instanceof Error ? err.message : "Failed to create note");
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    if (!confirm(`Delete "${selectedNote.title}"? This cannot be undone.`)) return;

    try {
      await window.api.notes.delete(selectedNote.path);
      setNotes((prev) => prev.filter((n) => n.path !== selectedNote.path));
      setRecentNotes((prev) => prev.filter((t) => t !== selectedNote.title));
      setSelectedNote(null);
      setContent("");
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const handleStartRename = () => {
    if (!selectedNote) return;
    setRenameTitle(selectedNote.title);
    setIsRenaming(true);
  };

  const handleRename = async () => {
    if (!selectedNote || !renameTitle.trim()) {
      setIsRenaming(false);
      return;
    }

    const newTitle = renameTitle.trim();
    if (newTitle === selectedNote.title) {
      setIsRenaming(false);
      return;
    }

    try {
      const renamedNote = await window.api.notes.rename(selectedNote.path, newTitle);
      setNotes((prev) =>
        prev.map((n) => (n.path === selectedNote.path ? renamedNote : n))
          .sort((a, b) => a.title.localeCompare(b.title))
      );
      setRecentNotes((prev) => {
        const updated = prev.map((t) => (t === selectedNote.title ? newTitle : t));
        window.api.config.set({ recentNotes: updated });
        return updated;
      });
      setSelectedNote(renamedNote);
      setIsRenaming(false);
      const refreshedNotes = await window.api.notes.list();
      setNotes(refreshedNotes);
    } catch (err) {
      console.error("Failed to rename note:", err);
      alert(err instanceof Error ? err.message : "Failed to rename note");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    setContextMenu({ note, x: e.clientX, y: e.clientY });
  };

  const handleContextMenuRename = async () => {
    if (!contextMenu) return;
    await handleSelectNote(contextMenu.note);
    setContextMenu(null);
    setTimeout(() => {
      setRenameTitle(contextMenu.note.title);
      setIsRenaming(true);
    }, 0);
  };

  const handleContextMenuDelete = async () => {
    if (!contextMenu) return;
    const noteToDelete = contextMenu.note;
    setContextMenu(null);

    if (!confirm(`Delete "${noteToDelete.title}"? This cannot be undone.`)) return;

    try {
      await window.api.notes.delete(noteToDelete.path);
      setNotes((prev) => prev.filter((n) => n.path !== noteToDelete.path));
      setRecentNotes((prev) => prev.filter((t) => t !== noteToDelete.title));
      if (selectedNote?.path === noteToDelete.path) {
        setSelectedNote(null);
        setContent("");
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const handleLinkClick = async (linkTitle: string) => {
    await saveNote();
    const existingNote = notes.find((n) => n.title === linkTitle);
    if (existingNote) {
      await handleSelectNote(existingNote);
      return;
    }

    try {
      const note = await window.api.notes.create(linkTitle);
      setNotes((prev) => [...prev, note].sort((a, b) => a.title.localeCompare(b.title)));
      setSelectedNote(note);
      setContent("");
      lastSavedContentRef.current = "";
      const inboundLinks = await window.api.notes.getBacklinks(linkTitle);
      setBacklinks(inboundLinks);
    } catch (err) {
      console.error("Failed to create note:", err);
      alert(err instanceof Error ? err.message : "Failed to create note");
    }
  };

  const toggleSectionCollapse = useCallback((section: RightPanelSection) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      window.api.config.set({ collapsedSections: Array.from(next) });
      return next;
    });
  }, []);

  // Command palette commands
  const commands = useMemo(() => {
    const cmds: { id: string; label: string; action: () => void }[] = [
      { id: "w", label: "w - Save", action: saveNote },
      { id: "q", label: "q - Close note", action: () => { setSelectedNote(null); setContent(""); } },
      { id: "wq", label: "wq - Save and close", action: async () => { await saveNote(); setSelectedNote(null); setContent(""); } },
      { id: "e", label: "e - Edit mode", action: () => { if (selectedNote) { setViewMode("edit"); setTimeout(() => textareaRef.current?.focus(), 0); } } },
      { id: "new-note", label: "new - New Note", action: () => { setNewNoteTitle(""); setTimeout(() => newNoteInputRef.current?.focus(), 0); } },
      { id: "search", label: "find - Search Notes", action: () => searchInputRef.current?.focus() },
      { id: "toggle-right-panel", label: `panel - ${showRightPanel ? "Hide" : "Show"} Right Panel`, action: () => setShowRightPanel((v) => !v) },
      { id: "change-folder", label: "cd - Change Workspace Folder", action: handleSelectWorkspace },
    ];

    if (selectedNote) {
      cmds.push(
        { id: "toggle-view", label: `Switch to ${viewMode === "edit" ? "View" : "Edit"} Mode`, action: () => setViewMode((v) => (v === "edit" ? "rendered" : "edit")) },
        { id: "save", label: "Save Note", action: saveNote },
        { id: "rename", label: "Rename Note", action: handleStartRename },
        { id: "delete", label: "Delete Note", action: handleDeleteNote }
      );
    }

    return cmds;
  }, [selectedNote, viewMode, showRightPanel, saveNote]);

  const executeCommand = (cmd: { action: () => void }) => {
    setShowCommandPalette(false);
    setCommandQuery("");
    cmd.action();
  };

  const outgoingLinks = useMemo(() => getUniqueLinks(content), [content]);

  // Welcome screen
  if (!workspace) {
    return (
      <div style={styles.welcome}>
        <h1>Anamn</h1>
        <p>Select a folder to store your notes</p>
        <button onClick={handleSelectWorkspace}>Select Folder</button>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <TopHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        selectedNote={selectedNote}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        searchInputRef={searchInputRef}
        onSelectNote={handleSelectNote}
      />
      <div style={styles.mainContent}>
        <Sidebar
          notes={notes}
          selectedNote={selectedNote}
          newNoteTitle={newNoteTitle}
          setNewNoteTitle={setNewNoteTitle}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onContextMenu={handleContextMenu}
          onChangeWorkspace={handleSelectWorkspace}
        />
        <Editor
          selectedNote={selectedNote}
          content={content}
          viewMode={viewMode}
          setViewMode={setViewMode}
          notes={notes}
          isRenaming={isRenaming}
          renameTitle={renameTitle}
          setRenameTitle={setRenameTitle}
          onStartRename={handleStartRename}
          onRename={handleRename}
          onCancelRename={() => setIsRenaming(false)}
          onDelete={handleDeleteNote}
          showFindBar={showFindBar}
          findQuery={findQuery}
          setFindQuery={setFindQuery}
          findMatches={findMatches}
          currentMatchIndex={currentMatchIndex}
          findNext={findNext}
          findPrevious={findPrevious}
          closeFindBar={closeFindBar}
          textareaRef={textareaRef}
          renderedViewRef={renderedViewRef}
          linkAutocomplete={linkAutocomplete}
          linkSuggestions={linkSuggestions}
          onTextareaChange={handleTextareaChange}
          onTextareaKeyDown={handleTextareaKeyDown}
          onInsertLink={insertLinkSuggestion}
          onLinkClick={handleLinkClick}
        />
        {showRightPanel && (
          <RightPanel
            sections={rightPanelSections}
            setSections={setRightPanelSections}
            collapsedSections={collapsedSections}
            toggleSectionCollapse={toggleSectionCollapse}
            notes={notes}
            selectedNote={selectedNote}
            outgoingLinks={outgoingLinks}
            backlinks={backlinks}
            recentNotes={recentNotes}
            onSelectNote={handleSelectNote}
            onLinkClick={handleLinkClick}
          />
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          note={contextMenu.note}
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={handleContextMenuRename}
          onDelete={handleContextMenuDelete}
        />
      )}
      {showCommandPalette && (
        <CommandPalette
          commands={commands}
          query={commandQuery}
          setQuery={setCommandQuery}
          onClose={() => { setShowCommandPalette(false); setCommandQuery(""); }}
          onExecute={executeCommand}
        />
      )}
    </div>
  );
}
