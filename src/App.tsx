import { useState, useEffect, useMemo, useRef } from "react";
import type { Note, ChessGameData } from "../shared/types.js";
import { getUniqueLinks } from "../shared/links.js";
import { getUniqueTags } from "../shared/tags.js";

// Contexts
import { UIProvider, useUI } from "./state/contexts/UIContext.js";
import { NotesProvider, useNotes } from "./state/contexts/NotesContext.js";
import { EditorProvider, useEditor } from "./state/contexts/EditorContext.js";

// Hooks
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
import { SettingsModal } from "./components/Settings/SettingsModal.js";
import { VerticalNavBar } from "./components/VerticalNavBar.js";
import { GraphView } from "./components/RightPanel/GraphView.js";
import { ThemeProvider } from "./components/ThemeProvider.js";
import { Logo } from "./components/Logo.js";

export function App() {
  return (
    <ThemeProvider>
      <UIProvider>
        <NotesProvider>
          <EditorProvider>
            <AppContent />
          </EditorProvider>
        </NotesProvider>
      </UIProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  // Get UI state from context
  const {
    shortcuts,
    showRightPanel,
    setShowRightPanel,
    rightPanelSections,
    setRightPanelSections,
    collapsedSections,
    toggleSectionCollapse,
    showCommandPalette,
    setShowCommandPalette,
    commandQuery,
    setCommandQuery,
    showSettings,
    setShowSettings,
    reloadConfig,
    showGraphView,
    setShowGraphView,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    newNoteInputRef,
    commandInputRef,
    findInputRef,
  } = useUI();

  // Get notes state from context
  const {
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
  } = useNotes();

  // Get editor state from context
  const {
    content,
    setContent,
    viewMode,
    setViewMode,
    saveNote,
    lastSavedContentRef,
    selection,
    setSelection,
    textareaRef,
    renderedViewRef,
    contentRef,
  } = useEditor();

  // Workspace state
  const [workspace, setWorkspace] = useState<string | null>(null);

  // UI state (local)
  const [newNoteTitle, setNewNoteTitle] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [contextMenu, setContextMenu] = useState<{ note: Note; x: number; y: number } | null>(null);
  const [isImportingChess, setIsImportingChess] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Load from localStorage
    const stored = localStorage.getItem("anamn-expanded-folders");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Persist expanded folders
  useEffect(() => {
    localStorage.setItem("anamn-expanded-folders", JSON.stringify([...expandedFolders]));
  }, [expandedFolders]);

  // Panel widths (resizable)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem("anamn-sidebar-width");
    return stored ? parseInt(stored, 10) : 250;
  });
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const stored = localStorage.getItem("anamn-right-panel-width");
    return stored ? parseInt(stored, 10) : 300;
  });
  const [isResizing, setIsResizing] = useState<"sidebar" | "right-panel" | null>(null);

  // Persist panel widths
  useEffect(() => {
    localStorage.setItem("anamn-sidebar-width", String(sidebarWidth));
  }, [sidebarWidth]);
  useEffect(() => {
    localStorage.setItem("anamn-right-panel-width", String(rightPanelWidth));
  }, [rightPanelWidth]);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing === "sidebar") {
        // Sidebar resize: account for nav bar width (56px)
        const newWidth = Math.max(150, Math.min(500, e.clientX - 56));
        setSidebarWidth(newWidth);
      } else if (isResizing === "right-panel") {
        // Right panel resize: calculate from right edge
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

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

    window.api.state.get().then((state) => {
      if (state.lastOpenedNote) {
        const note = notes.find((n) => n.path === state.lastOpenedNote);
        if (note) {
          hasRestoredNote.current = true;
          handleSelectNote(note);
        }
      }
    });
  }, [notes]);

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
    setShowGraphView(false);
    const text = await window.api.notes.read(note.path);
    setContent(text);
    lastSavedContentRef.current = text;
    trackRecentNote(note.title);
    window.api.state.set({ lastOpenedNote: note.path });
    const inboundLinks = await window.api.notes.getBacklinks(note.title);
    setBacklinks(inboundLinks);
    // Scroll to top of the note
    setTimeout(() => {
      renderedViewRef.current?.scrollTo(0, 0);
      textareaRef.current?.scrollTo(0, 0);
    }, 0);
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
      // Create note in the same folder as the currently selected note
      const folder = selectedNote?.folder || "";
      const note = await window.api.notes.create(newNoteTitle.trim(), folder);
      setNotes((prev) => [...prev, note].sort((a, b) => a.title.localeCompare(b.title)));
      setSelectedNote(note);
      setContent("");
      setNewNoteTitle(null);
    } catch (err) {
      console.error("Failed to create note:", err);
      alert(err instanceof Error ? err.message : "Failed to create note");
    }
  };

  const handleImportChess = async (url: string) => {
    setIsImportingChess(true);
    try {
      // Fetch game data
      const gameData: ChessGameData = await window.api.chessImport.fetchGame(url);

      // Get config for title format and usernames
      const config = await window.api.config.get();
      const { lichessUsername, chessComUsername, gameNoteTitleFormat } = config.chessImport;

      // Determine if user is white or black based on configured username
      const username = gameData.source === "lichess" ? lichessUsername : chessComUsername;
      const isWhite = username?.toLowerCase() === gameData.white.username.toLowerCase();
      const isBlack = username?.toLowerCase() === gameData.black.username.toLowerCase();
      const isMe = isWhite || isBlack;

      // Build note title using format template
      let title = gameNoteTitleFormat
        .replace("{white}", gameData.white.username)
        .replace("{black}", gameData.black.username)
        .replace("{date}", gameData.date)
        .replace("{gameId}", gameData.gameId)
        .replace("{result}", gameData.result);

      if (isMe) {
        const me = isWhite ? gameData.white.username : gameData.black.username;
        const opponent = isWhite ? gameData.black.username : gameData.white.username;
        title = title.replace("{me}", me).replace("{opponent}", opponent);
      } else {
        // If not identified, use white vs black
        title = title.replace("{me}", gameData.white.username).replace("{opponent}", gameData.black.username);
      }

      // Build note content with PGN
      // If user played as black, add FlipBoard header to PGN
      let pgn = gameData.pgn;
      if (isBlack) {
        // Insert FlipBoard header after other headers
        const headerEndIdx = pgn.lastIndexOf(']');
        if (headerEndIdx !== -1) {
          pgn = pgn.slice(0, headerEndIdx + 1) + '\n[FlipBoard "true"]' + pgn.slice(headerEndIdx + 1);
        }
      }
      const noteContent = `\`\`\`pgn\n${pgn}\n\`\`\`\n`;

      // Create the note
      const note = await window.api.notes.create(title.trim());
      await window.api.notes.write(note.path, noteContent);

      setNotes((prev) => [...prev, note].sort((a, b) => a.title.localeCompare(b.title)));
      setSelectedNote(note);
      setContent(noteContent);
      lastSavedContentRef.current = noteContent;
      setNewNoteTitle(null);
      trackRecentNote(note.title);
    } catch (err) {
      console.error("Failed to import chess game:", err);
      alert(err instanceof Error ? err.message : "Failed to import chess game");
    } finally {
      setIsImportingChess(false);
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
        window.api.state.set({ recentNotes: updated });
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

  const handleOpenDaily = async () => {
    try {
      await saveNote();
      const note = await window.api.notes.openDaily();
      // Add to notes list if not already present
      setNotes((prev) => {
        if (prev.some((n) => n.path === note.path)) return prev;
        return [...prev, note].sort((a, b) => a.title.localeCompare(b.title));
      });
      await handleSelectNote(note);
    } catch (err) {
      console.error("Failed to open daily note:", err);
      alert(err instanceof Error ? err.message : "Failed to open daily note");
    }
  };

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
    onOpenDaily: handleOpenDaily,
  });

  // Command palette commands
  const commands = useMemo(() => {
    const cmds: { id: string; label: string; action: () => void }[] = [
      { id: "w", label: "w - Save", action: saveNote },
      { id: "q", label: "q - Close note", action: () => { setSelectedNote(null); setContent(""); } },
      { id: "wq", label: "wq - Save and close", action: async () => { await saveNote(); setSelectedNote(null); setContent(""); } },
      { id: "e", label: "e - Edit mode", action: () => { if (selectedNote) { setViewMode("edit"); setTimeout(() => textareaRef.current?.focus(), 0); } } },
      { id: "new-note", label: "new - New Note", action: () => { setNewNoteTitle(""); setTimeout(() => newNoteInputRef.current?.focus(), 0); } },
      { id: "daily", label: "daily - Open Daily Note", action: handleOpenDaily },
      { id: "search", label: "find - Search Notes", action: () => searchInputRef.current?.focus() },
      { id: "toggle-right-panel", label: `panel - ${showRightPanel ? "Hide" : "Show"} Right Panel`, action: () => setShowRightPanel((v) => !v) },
      { id: "change-folder", label: "cd - Change Workspace Folder", action: handleSelectWorkspace },
      { id: "settings", label: "settings - Open Settings", action: () => setShowSettings(true) },
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
  const noteTags = useMemo(() => getUniqueTags(content), [content]);

  const handleTagClick = (tag: string) => {
    setSearchQuery(`#${tag}`);
    searchInputRef.current?.focus();
  };

  // Welcome screen
  if (!workspace) {
    return (
      <div className="welcome">
        <Logo height={48} />
        <p>Select a folder to store your notes</p>
        <button onClick={handleSelectWorkspace}>Select Folder</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <TopHeader
        selectedNote={selectedNote}
        onSelectNote={handleSelectNote}
      />
      <div className="main-content">
        <VerticalNavBar
          onNewNote={() => {
            setNewNoteTitle("");
            setTimeout(() => newNoteInputRef.current?.focus(), 0);
          }}
          onOpenDaily={handleOpenDaily}
          onToggleGraph={() => setShowGraphView(!showGraphView)}
          onOpenSettings={() => setShowSettings(true)}
          showGraphView={showGraphView}
        />
        <Sidebar
          notes={notes}
          selectedNote={selectedNote}
          newNoteTitle={newNoteTitle}
          setNewNoteTitle={setNewNoteTitle}
          expandedFolders={expandedFolders}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onToggleFolder={handleToggleFolder}
          onContextMenu={handleContextMenu}
          onChangeWorkspace={handleSelectWorkspace}
          onImportChess={handleImportChess}
          isImporting={isImportingChess}
          width={sidebarWidth}
        />
        <div
          className="resize-handle resize-handle-sidebar"
          onMouseDown={() => setIsResizing("sidebar")}
        />
        {showGraphView ? (
          <div className="full-graph-container">
            <GraphView
              notes={notes}
              selectedNote={selectedNote}
              onSelectNote={handleSelectNote}
            />
          </div>
        ) : (
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
          onTagClick={handleTagClick}
        />
        )}
        {showRightPanel && (
          <>
            <div
              className="resize-handle resize-handle-right-panel"
              onMouseDown={() => setIsResizing("right-panel")}
            />
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
              tags={noteTags}
              onSelectNote={handleSelectNote}
              onLinkClick={handleLinkClick}
              onTagClick={handleTagClick}
              width={rightPanelWidth}
            />
          </>
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
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSave={async (config) => {
            await window.api.config.set(config);
            await reloadConfig();
          }}
        />
      )}
    </div>
  );
}
