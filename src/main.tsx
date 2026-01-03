import { StrictMode, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import type { Note, ViewMode, SearchResult, KeyboardShortcuts, RightPanelSection } from "../shared/types.js";
import { getUniqueLinks } from "../shared/links.js";

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

function GraphView({
  notes,
  selectedNote,
  onSelectNote,
}: {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 300, height: 400 });
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);

  // Observe container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Build graph data from notes
  useEffect(() => {
    const buildGraph = async () => {
      const nodeMap = new Map<string, GraphNode>();
      const edgeList: GraphEdge[] = [];

      // Create nodes for all notes
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const radius = Math.min(size.width, size.height) / 3;

      notes.forEach((note, i) => {
        const angle = (2 * Math.PI * i) / notes.length;
        nodeMap.set(note.title, {
          id: note.title,
          title: note.title,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          vx: 0,
          vy: 0,
        });
      });

      // Read each note to find links
      for (const note of notes) {
        try {
          const content = await window.api.notes.read(note.path);
          const links = getUniqueLinks(content);
          for (const link of links) {
            if (nodeMap.has(link)) {
              edgeList.push({ source: note.title, target: link });
            }
          }
        } catch {
          // Skip if can't read
        }
      }

      const nodeList = Array.from(nodeMap.values());
      setNodes(nodeList);
      nodesRef.current = nodeList;
      setEdges(edgeList);
    };

    buildGraph();
  }, [notes, size]);

  // Simple force-directed layout simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      const currentNodes = nodesRef.current;
      const updatedNodes = currentNodes.map((node) => ({ ...node }));

      // Apply forces
      for (const node of updatedNodes) {
        if (node.id === draggedNode) continue;

        // Repulsion from other nodes
        for (const other of updatedNodes) {
          if (node.id === other.id) continue;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (dist * dist);
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        }

        // Attraction along edges
        for (const edge of edges) {
          let other: GraphNode | undefined;
          if (edge.source === node.id) {
            other = updatedNodes.find((n) => n.id === edge.target);
          } else if (edge.target === node.id) {
            other = updatedNodes.find((n) => n.id === edge.source);
          }
          if (other) {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            node.vx += dx * 0.01;
            node.vy += dy * 0.01;
          }
        }

        // Center gravity
        node.vx += (size.width / 2 - node.x) * 0.001;
        node.vy += (size.height / 2 - node.y) * 0.001;

        // Apply velocity with damping
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Bounds
        node.x = Math.max(30, Math.min(size.width - 30, node.x));
        node.y = Math.max(30, Math.min(size.height - 30, node.y));
      }

      nodesRef.current = updatedNodes;
      setNodes(updatedNodes);
      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [edges, draggedNode, size]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    for (const edge of edges) {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const isSelected = selectedNote?.title === node.id;
      const isHovered = hoveredNode === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered ? 10 : 8, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#6b9eff" : isHovered ? "#888" : "#555";
      ctx.fill();

      // Draw label
      ctx.fillStyle = "#e0e0e0";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.title, node.x, node.y + 22);
    }
  }, [nodes, edges, selectedNote, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNode) {
      nodesRef.current = nodesRef.current.map((node) =>
        node.id === draggedNode ? { ...node, x, y, vx: 0, vy: 0 } : node
      );
      setNodes(nodesRef.current);
      return;
    }

    // Check hover
    let found = false;
    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy < 100) {
        setHoveredNode(node.id);
        found = true;
        break;
      }
    }
    if (!found) setHoveredNode(null);
  };

  const handleMouseDown = () => {
    if (hoveredNode) {
      setDraggedNode(hoveredNode);
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleClick = () => {
    if (hoveredNode && !draggedNode) {
      const note = notes.find((n) => n.title === hoveredNode);
      if (note) onSelectNote(note);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, background: "#1a1a1a", overflow: "hidden" }}
    >
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={{ cursor: hoveredNode ? "pointer" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
}

function App() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState<string | null>(null);
  const [backlinks, setBacklinks] = useState<Note[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcuts | null>(null);
  const [recentNotes, setRecentNotes] = useState<string[]>([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    note: Note;
    x: number;
    y: number;
  } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelSections, setRightPanelSections] = useState<RightPanelSection[]>(["links", "graph"]);
  const [collapsedSections, setCollapsedSections] = useState<Set<RightPanelSection>>(new Set());
  const [draggedSection, setDraggedSection] = useState<RightPanelSection | null>(null);
  const [dragOverSection, setDragOverSection] = useState<RightPanelSection | null>(null);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findMatches, setFindMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [linkAutocomplete, setLinkAutocomplete] = useState<{
    show: boolean;
    query: string;
    startPos: number;
    selectedIndex: number;
  }>({ show: false, query: "", startPos: 0, selectedIndex: 0 });
  const [focusedNoteIndex, setFocusedNoteIndex] = useState<number>(-1);
  const [sidebarHasFocus, setSidebarHasFocus] = useState(false);
  // Selection state for text selection (v/V keys in view mode)
  const [selection, setSelection] = useState<{ type: "char" | "line"; anchor: number } | null>(null);

  // Refs for elements we need to focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newNoteInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteListRef = useRef<HTMLUListElement>(null);
  const renderedViewRef = useRef<HTMLDivElement>(null);
  const pendingKeyRef = useRef<string | null>(null); // For multi-key sequences like "gg"

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

  // Track if content has been modified since last save
  const contentRef = useRef(content);
  const selectedNoteRef = useRef(selectedNote);
  contentRef.current = content;
  selectedNoteRef.current = selectedNote;

  useEffect(() => {
    window.api.workspace.get().then(setWorkspace);
  }, []);

  useEffect(() => {
    if (workspace) {
      window.api.notes.list().then(setNotes);
    }
  }, [workspace]);

  // Listen for file system changes
  useEffect(() => {
    // Handle new file added externally
    const unsubAdd = window.api.watcher.onFileAdded((event) => {
      setNotes((prev) => {
        // Don't add if already exists
        if (prev.some((n) => n.path === event.path)) return prev;
        return [...prev, { path: event.path, title: event.title }].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      });
    });

    // Handle file changed externally
    const unsubChange = window.api.watcher.onFileChanged(async (event) => {
      // If this is the currently selected note, reload its content
      const currentNote = selectedNoteRef.current;
      if (currentNote && currentNote.path === event.path) {
        const newContent = await window.api.notes.read(event.path);
        // Only update if content actually changed (avoid cursor jump during our own saves)
        if (newContent !== contentRef.current) {
          setContent(newContent);
          lastSavedContentRef.current = newContent;
        }
      }
      // Also refresh backlinks in case links changed
      if (currentNote) {
        const backlinks = await window.api.notes.getBacklinks(currentNote.title);
        setBacklinks(backlinks);
      }
    });

    // Handle file deleted externally
    const unsubDelete = window.api.watcher.onFileDeleted((event) => {
      setNotes((prev) => prev.filter((n) => n.path !== event.path));
      setRecentNotes((prev) => prev.filter((t) => t !== event.title));

      // If this was the selected note, clear selection
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
  }, []);

  // Restore last opened note on startup
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

  // Auto-save with debounce
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");

  const saveNote = useCallback(async () => {
    const note = selectedNoteRef.current;
    const currentContent = contentRef.current;
    if (note && currentContent !== lastSavedContentRef.current) {
      await window.api.notes.write(note.path, currentContent);
      lastSavedContentRef.current = currentContent;
    }
  }, []);

  // Track recent notes (max 10)
  const trackRecentNote = useCallback(async (title: string) => {
    setRecentNotes((prev) => {
      const filtered = prev.filter((t) => t !== title);
      const updated = [title, ...filtered].slice(0, 10);
      // Persist to config
      window.api.config.set({ recentNotes: updated });
      return updated;
    });
  }, []);

  useEffect(() => {
    if (selectedNote && content !== lastSavedContentRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveNote();
      }, 500);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, selectedNote, saveNote]);

  // Debounced search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await window.api.notes.search(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Helper to match keyboard event against shortcut string like "Ctrl+N"
  const matchesShortcut = useCallback((e: KeyboardEvent, shortcut: string): boolean => {
    const parts = shortcut.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    const needsCtrl = parts.includes("ctrl") || parts.includes("meta") || parts.includes("cmd");
    const needsShift = parts.includes("shift");
    const needsAlt = parts.includes("alt");

    // Treat both ctrlKey and metaKey as "Ctrl" for cross-platform support
    const ctrlMatch = needsCtrl === (e.ctrlKey || e.metaKey);
    const shiftMatch = needsShift === e.shiftKey;
    const altMatch = needsAlt === e.altKey;
    const keyMatch = e.key.toLowerCase() === key || e.code.toLowerCase() === `key${key}`;

    return ctrlMatch && shiftMatch && altMatch && keyMatch;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!shortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except for Escape)
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (matchesShortcut(e, shortcuts.closePanel)) {
        e.preventDefault();
        if (showCommandPalette) {
          setShowCommandPalette(false);
          setCommandQuery("");
        } else if (showFindBar) {
          closeFindBar();
        } else if (linkAutocomplete.show) {
          setLinkAutocomplete({ show: false, query: "", startPos: 0, selectedIndex: 0 });
        } else if (viewMode === "edit" && selectedNote) {
          // Vim-like: Escape exits edit mode back to view mode
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

      // Command palette works even in input
      if (matchesShortcut(e, shortcuts.commandPalette)) {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
        setCommandQuery("");
        setTimeout(() => commandInputRef.current?.focus(), 0);
        return;
      }

      // Right panel toggle works even in input
      if (matchesShortcut(e, shortcuts.rightPanel)) {
        e.preventDefault();
        setShowRightPanel((v) => !v);
        return;
      }

      // Ctrl+F to find in note (works even in textarea)
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && selectedNote) {
        e.preventDefault();
        setShowFindBar(true);
        setTimeout(() => findInputRef.current?.focus(), 0);
        return;
      }

      // Selection keybindings (must be checked before skipping input shortcuts)
      if (selectedNote && viewMode === "edit" && selection) {
        const textarea = textareaRef.current;
        if (textarea) {
          // Helper to get line boundaries
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
              // Determine head position based on anchor
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
              // Determine head position based on anchor
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

      // Skip other shortcuts when in input (but selection handlers above take priority)
      if (isInput) return;

      if (matchesShortcut(e, shortcuts.newNote)) {
        e.preventDefault();
        setNewNoteTitle("");
        setTimeout(() => newNoteInputRef.current?.focus(), 0);
        return;
      }

      if (matchesShortcut(e, shortcuts.search)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (matchesShortcut(e, shortcuts.toggleView) && selectedNote) {
        e.preventDefault();
        setViewMode((v) => (v === "edit" ? "rendered" : "edit"));
        return;
      }

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
          // gg - go to top
          if (renderedView) renderedView.scrollTop = 0;
          return;
        }

        // Clear pending key after a short delay or if different key pressed
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

        // "a" - append (enter insert mode)
        if (e.key === "a") {
          e.preventDefault();
          setViewMode("edit");
          setTimeout(() => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.focus();
              // Put cursor at end
              textarea.setSelectionRange(content.length, content.length);
            }
          }, 0);
          return;
        }

        // "A" - append at end of document
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

        // "o" - open line below and enter insert mode
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

        // "O" - open line above and enter insert mode
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
          // Clear pending key after 1 second
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

        // ":" - open command palette (vim command mode)
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
              // Select the first line
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
  }, [shortcuts, searchQuery, newNoteTitle, selectedNote, matchesShortcut, saveNote, showCommandPalette, showRightPanel, showFindBar, viewMode, linkAutocomplete.show, content, findMatches, selection]);

  const handleSelectWorkspace = async () => {
    const path = await window.api.workspace.select();
    if (path) {
      setWorkspace(path);
      setSelectedNote(null);
      setContent("");
    }
  };

  const handleSelectNote = async (note: Note) => {
    // Save current note before switching
    await saveNote();

    setSelectedNote(note);
    setIsRenaming(false);
    setViewMode("rendered"); // Always open notes in view mode
    const text = await window.api.notes.read(note.path);
    setContent(text);
    lastSavedContentRef.current = text;

    // Track in recent notes
    trackRecentNote(note.title);

    // Save as last opened note
    window.api.config.set({ lastOpenedNote: note.path });

    // Fetch backlinks
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

      // Update notes list
      setNotes((prev) =>
        prev
          .map((n) => (n.path === selectedNote.path ? renamedNote : n))
          .sort((a, b) => a.title.localeCompare(b.title))
      );

      // Update recent notes
      setRecentNotes((prev) => {
        const updated = prev.map((t) => (t === selectedNote.title ? newTitle : t));
        window.api.config.set({ recentNotes: updated });
        return updated;
      });

      setSelectedNote(renamedNote);
      setIsRenaming(false);

      // Refresh notes list to get any updated content (links)
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
    // Small delay to ensure note is selected before starting rename
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

  // Close context menu when clicking elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // Find matches in content
  useEffect(() => {
    if (!findQuery.trim() || !content) {
      setFindMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const matches: number[] = [];
    const query = findQuery.toLowerCase();
    const text = content.toLowerCase();
    let index = 0;

    while ((index = text.indexOf(query, index)) !== -1) {
      matches.push(index);
      index += 1;
    }

    setFindMatches(matches);
    setCurrentMatchIndex(0);
  }, [findQuery, content]);

  // Highlight current match in textarea (only when navigating, not while typing)
  const lastMatchIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (findMatches.length === 0 || !textareaRef.current || viewMode !== "edit") return;

    const matchIndex = findMatches[currentMatchIndex];
    if (matchIndex === undefined) return;

    // Only scroll and focus when match index actually changed (user navigated)
    if (lastMatchIndexRef.current !== matchIndex) {
      lastMatchIndexRef.current = matchIndex;

      const textarea = textareaRef.current;
      // Scroll to match
      const lineHeight = 20;
      const linesAbove = content.slice(0, matchIndex).split("\n").length - 1;
      textarea.scrollTop = linesAbove * lineHeight - textarea.clientHeight / 2;
    }
  }, [findMatches, currentMatchIndex, findQuery, viewMode, content]);

  const findNext = () => {
    if (findMatches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev + 1) % findMatches.length;
      // Select match after state update
      setTimeout(() => {
        const matchIndex = findMatches[next];
        if (matchIndex !== undefined && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(matchIndex, matchIndex + findQuery.length);
        }
      }, 0);
      return next;
    });
  };

  const findPrevious = () => {
    if (findMatches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev - 1 + findMatches.length) % findMatches.length;
      // Select match after state update
      setTimeout(() => {
        const matchIndex = findMatches[next];
        if (matchIndex !== undefined && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(matchIndex, matchIndex + findQuery.length);
        }
      }, 0);
      return next;
    });
  };

  const closeFindBar = () => {
    setShowFindBar(false);
    setFindQuery("");
    setFindMatches([]);
    textareaRef.current?.focus();
  };

  // Link autocomplete suggestions
  const linkSuggestions = useMemo(() => {
    if (!linkAutocomplete.show || !linkAutocomplete.query) {
      return notes.slice(0, 10);
    }
    const query = linkAutocomplete.query.toLowerCase();
    return notes
      .filter((note) => note.title.toLowerCase().includes(query))
      .slice(0, 10);
  }, [notes, linkAutocomplete.show, linkAutocomplete.query]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(value);

    // Check for [[ pattern before cursor
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf("[[");
    const lastClosingBracket = textBeforeCursor.lastIndexOf("]]");

    if (lastDoubleBracket !== -1 && lastDoubleBracket > lastClosingBracket) {
      // We're inside a [[ ]] block
      const query = textBeforeCursor.slice(lastDoubleBracket + 2);
      // Don't show if query contains newline
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

    // Close autocomplete if we're not in a [[ block
    if (linkAutocomplete.show) {
      setLinkAutocomplete({ show: false, query: "", startPos: 0, selectedIndex: 0 });
    }
  };

  const insertLinkSuggestion = (noteTitle: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf("[[");

    if (lastDoubleBracket === -1) return;

    // Replace from [[ to cursor with [[noteTitle]]
    const before = content.slice(0, lastDoubleBracket);
    const after = content.slice(cursorPos);
    const newContent = `${before}[[${noteTitle}]]${after}`;

    setContent(newContent);
    setLinkAutocomplete({ show: false, query: "", startPos: 0, selectedIndex: 0 });

    // Set cursor position after the inserted link
    const newCursorPos = lastDoubleBracket + noteTitle.length + 4; // [[ + title + ]]
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      setLinkAutocomplete({ show: false, query: "", startPos: 0, selectedIndex: 0 });
    }
  };

  // Sidebar keyboard navigation
  const handleSidebarKeyDown = (e: React.KeyboardEvent) => {
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
        handleSelectNote(note);
      }
    } else if (e.key === "Escape") {
      setSidebarHasFocus(false);
      setFocusedNoteIndex(-1);
      noteListRef.current?.blur();
    }
  };

  const scrollNoteIntoView = (index: number) => {
    const noteList = noteListRef.current;
    if (!noteList) return;
    const noteElement = noteList.children[index] as HTMLElement | undefined;
    noteElement?.scrollIntoView({ block: "nearest" });
  };

  const handleSidebarFocus = () => {
    setSidebarHasFocus(true);
    if (focusedNoteIndex === -1 && notes.length > 0) {
      // If no note is focused, focus the selected note or the first one
      const selectedIndex = notes.findIndex((n) => n.path === selectedNote?.path);
      setFocusedNoteIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  const handleSidebarBlur = () => {
    setSidebarHasFocus(false);
  };

  // Command palette commands
  const commands = useMemo(() => {
    const cmds: { id: string; label: string; action: () => void }[] = [
      // Vim-style commands
      {
        id: "w",
        label: "w - Save",
        action: saveNote,
      },
      {
        id: "q",
        label: "q - Close note",
        action: () => {
          setSelectedNote(null);
          setContent("");
        },
      },
      {
        id: "wq",
        label: "wq - Save and close",
        action: async () => {
          await saveNote();
          setSelectedNote(null);
          setContent("");
        },
      },
      {
        id: "e",
        label: "e - Edit mode",
        action: () => {
          if (selectedNote) {
            setViewMode("edit");
            setTimeout(() => textareaRef.current?.focus(), 0);
          }
        },
      },
      // Regular commands
      {
        id: "new-note",
        label: "new - New Note",
        action: () => {
          setNewNoteTitle("");
          setTimeout(() => newNoteInputRef.current?.focus(), 0);
        },
      },
      {
        id: "search",
        label: "find - Search Notes",
        action: () => searchInputRef.current?.focus(),
      },
      {
        id: "toggle-right-panel",
        label: `panel - ${showRightPanel ? "Hide" : "Show"} Right Panel`,
        action: () => setShowRightPanel((v) => !v),
      },
      {
        id: "change-folder",
        label: "cd - Change Workspace Folder",
        action: handleSelectWorkspace,
      },
    ];

    if (selectedNote) {
      cmds.push(
        {
          id: "toggle-view",
          label: `Switch to ${viewMode === "edit" ? "View" : "Edit"} Mode`,
          action: () => setViewMode((v) => (v === "edit" ? "rendered" : "edit")),
        },
        {
          id: "save",
          label: "Save Note",
          action: saveNote,
        },
        {
          id: "rename",
          label: "Rename Note",
          action: handleStartRename,
        },
        {
          id: "delete",
          label: "Delete Note",
          action: handleDeleteNote,
        }
      );
    }

    return cmds;
  }, [selectedNote, viewMode, showRightPanel, saveNote]);

  const filteredCommands = useMemo(() => {
    if (!commandQuery.trim()) return commands;
    const query = commandQuery.toLowerCase();
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(query));
  }, [commands, commandQuery]);

  const executeCommand = (cmd: { action: () => void }) => {
    setShowCommandPalette(false);
    setCommandQuery("");
    cmd.action();
  };

  const outgoingLinks = useMemo(() => getUniqueLinks(content), [content]);

  const toggleSectionCollapse = (section: RightPanelSection) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      // Persist to config
      window.api.config.set({ collapsedSections: Array.from(next) });
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, section: RightPanelSection) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", section);
    setDraggedSection(section);
  };

  const handleDragOver = (e: React.DragEvent, section: RightPanelSection) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedSection && draggedSection !== section) {
      setDragOverSection(section);
    }
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = (e: React.DragEvent, targetSection: RightPanelSection) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedSection || draggedSection === targetSection) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    setRightPanelSections((prev) => {
      const newSections = [...prev];
      const draggedIndex = newSections.indexOf(draggedSection);
      const targetIndex = newSections.indexOf(targetSection);

      // Remove dragged item and insert at target position
      newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, draggedSection);

      // Persist to config
      window.api.config.set({ rightPanelSections: newSections });
      return newSections;
    });

    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  // Process wiki links in rendered markdown to make them clickable
  const processWikiLinks = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      const parts: React.ReactNode[] = [];
      const regex = /\[\[([^\]]+)\]\]/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(children)) !== null) {
        if (match.index > lastIndex) {
          parts.push(children.slice(lastIndex, match.index));
        }
        const linkTitle = match[1];
        const exists = notes.some((n) => n.title === linkTitle);
        parts.push(
          <span
            key={match.index}
            onClick={() => handleLinkClick(linkTitle ?? "")}
            style={{
              ...styles.wikiLink,
              color: exists ? "#6b9eff" : "#888",
            }}
          >
            {linkTitle}
          </span>
        );
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < children.length) {
        parts.push(children.slice(lastIndex));
      }
      return parts.length > 0 ? parts : children;
    }
    if (Array.isArray(children)) {
      return children.map((child, i) => (
        <span key={i}>{processWikiLinks(child)}</span>
      ));
    }
    return children;
  };

  const handleLinkClick = async (linkTitle: string) => {
    // Save current note before navigating
    await saveNote();

    // Check if note exists
    const existingNote = notes.find((n) => n.title === linkTitle);
    if (existingNote) {
      await handleSelectNote(existingNote);
      return;
    }

    // Note doesn't exist - create it automatically
    try {
      const note = await window.api.notes.create(linkTitle);
      setNotes((prev) => [...prev, note].sort((a, b) => a.title.localeCompare(b.title)));
      setSelectedNote(note);
      setContent("");
      lastSavedContentRef.current = "";
      // New note will have backlinks from the note we came from
      const inboundLinks = await window.api.notes.getBacklinks(linkTitle);
      setBacklinks(inboundLinks);
    } catch (err) {
      console.error("Failed to create note:", err);
      alert(err instanceof Error ? err.message : "Failed to create note");
    }
  };

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
      <div style={styles.topHeader}>
        <div style={styles.topHeaderTitle}>Anamn</div>
        <div style={styles.topHeaderSearch}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes... (Ctrl+P)"
            style={styles.topHeaderSearchInput}
          />
          {searchQuery && (
            <>
              <button
                onClick={() => setSearchQuery("")}
                style={styles.clearSearch}
              >
                ×
              </button>
              <div style={styles.searchDropdown}>
                {isSearching ? (
                  <div style={styles.searchDropdownItem}>Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div style={styles.searchDropdownItem}>No results found</div>
                ) : (
                  searchResults.map((result) => (
                    <div
                      key={result.note.path}
                      onClick={() => {
                        handleSelectNote(result.note);
                        setSearchQuery("");
                      }}
                      style={{
                        ...styles.searchDropdownItem,
                        background: selectedNote?.path === result.note.path ? "#3a3a3a" : "transparent",
                      }}
                    >
                      <div>{result.note.title}</div>
                      {result.snippet && (
                        <div style={styles.searchSnippet}>{result.snippet}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        <div style={styles.topHeaderActions}>
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            style={{
              ...styles.topHeaderButton,
              background: showRightPanel ? "#444" : "transparent",
            }}
            title="Toggle right panel (Ctrl+G)"
          >
            ☰ Panel
          </button>
        </div>
      </div>
      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <strong>Notes</strong>
            <button onClick={handleCreateNote} style={styles.newButton}>+</button>
          </div>
          {newNoteTitle !== null && (
            <div style={styles.newNoteInput}>
              <input
                ref={newNoteInputRef}
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNote();
                  if (e.key === "Escape") setNewNoteTitle(null);
                }}
                placeholder="Note title..."
                autoFocus
                style={styles.input}
              />
            </div>
          )}
          <ul
            ref={noteListRef}
            style={styles.noteList}
            tabIndex={0}
            onKeyDown={handleSidebarKeyDown}
            onFocus={handleSidebarFocus}
            onBlur={handleSidebarBlur}
          >
            {notes.map((note, index) => (
              <li
                key={note.path}
                onClick={() => handleSelectNote(note)}
                onContextMenu={(e) => handleContextMenu(e, note)}
                style={{
                  ...styles.noteItem,
                  background: selectedNote?.path === note.path ? "#3a3a3a" : "transparent",
                  outline: sidebarHasFocus && focusedNoteIndex === index ? "1px solid #6b9eff" : "none",
                  outlineOffset: "-1px",
                }}
              >
                {note.title}
              </li>
            ))}
          </ul>
          <button onClick={handleSelectWorkspace} style={styles.changeFolder}>
            Change Folder
          </button>
        </div>
      <div style={styles.editor}>
        {selectedNote ? (
          <>
            <div style={styles.editorHeader}>
              {isRenaming ? (
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                  autoFocus
                  style={styles.renameTitleInput}
                />
              ) : (
                <span
                  onClick={handleStartRename}
                  style={styles.editableTitle}
                  title="Click to rename"
                >
                  {selectedNote.title}
                </span>
              )}
              <div style={styles.editorActions}>
                <button
                  onClick={handleDeleteNote}
                  style={styles.deleteButton}
                  title="Delete note"
                >
                  🗑
                </button>
                <div style={styles.viewModeToggle}>
                  <button
                    onClick={() => setViewMode("edit")}
                    style={{
                      ...styles.viewModeButton,
                      background: viewMode === "edit" ? "#444" : "#333",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setViewMode("rendered")}
                    style={{
                      ...styles.viewModeButton,
                      background: viewMode === "rendered" ? "#444" : "#333",
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
            {showFindBar && (
              <div style={styles.findBar}>
                <input
                  ref={findInputRef}
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.shiftKey ? findPrevious() : findNext();
                    }
                    if (e.key === "Escape") {
                      closeFindBar();
                    }
                  }}
                  placeholder="Find in note..."
                  style={styles.findInput}
                  autoFocus
                />
                <span style={styles.findCount}>
                  {findMatches.length > 0
                    ? `${currentMatchIndex + 1} / ${findMatches.length}`
                    : findQuery
                    ? "No matches"
                    : ""}
                </span>
                <button onClick={findPrevious} style={styles.findButton} title="Previous (Shift+Enter)">
                  ↑
                </button>
                <button onClick={findNext} style={styles.findButton} title="Next (Enter)">
                  ↓
                </button>
                <button onClick={closeFindBar} style={styles.findButton} title="Close (Escape)">
                  ×
                </button>
              </div>
            )}
            {viewMode === "edit" ? (
              <div style={styles.textareaContainer}>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleTextareaKeyDown}
                  style={styles.textarea}
                />
                {linkAutocomplete.show && linkSuggestions.length > 0 && (
                  <div style={styles.autocompleteDropdown}>
                    {linkSuggestions.map((note, index) => (
                      <div
                        key={note.path}
                        onClick={() => insertLinkSuggestion(note.title)}
                        style={{
                          ...styles.autocompleteItem,
                          background: index === linkAutocomplete.selectedIndex ? "#3a3a3a" : "transparent",
                        }}
                      >
                        {note.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div ref={renderedViewRef} style={styles.renderedView}>
                <Markdown
                  components={{
                    p: ({ children }) => (
                      <p style={styles.renderedP}>{processWikiLinks(children)}</p>
                    ),
                    li: ({ children }) => (
                      <li>{processWikiLinks(children)}</li>
                    ),
                  }}
                >
                  {content}
                </Markdown>
              </div>
            )}
          </>
        ) : (
          <div style={styles.placeholder}>Select a note or create a new one</div>
        )}
      </div>
      {showRightPanel && (
        <div style={styles.rightPanel}>
          {rightPanelSections.map((section) => (
            <div
              key={section}
              style={{
                ...styles.rightPanelSection,
                flex: collapsedSections.has(section) ? "none" : 1,
              }}
              onDragOver={(e) => handleDragOver(e, section)}
              onDrop={(e) => handleDrop(e, section)}
            >
              {section === "recents" && (
                <>
                  <div
                    style={{
                      ...styles.rightPanelSectionHeader,
                      ...(dragOverSection === "recents" ? styles.dragOver : {}),
                      ...(draggedSection === "recents" ? styles.dragging : {}),
                    }}
                    onClick={() => toggleSectionCollapse("recents")}
                    draggable
                    onDragStart={(e) => handleDragStart(e, "recents")}
                    onDragOver={(e) => handleDragOver(e, "recents")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "recents")}
                    onDragEnd={handleDragEnd}
                  >
                    <span style={styles.dragHandle}>⋮⋮</span>
                    <span style={styles.collapseIcon}>
                      {collapsedSections.has("recents") ? "▶" : "▼"}
                    </span>
                    Recent Notes
                  </div>
                  {!collapsedSections.has("recents") && (
                    <div style={styles.rightPanelSectionContent}>
                      {recentNotes.length > 0 ? (
                        <ul style={styles.linksList}>
                          {recentNotes.map((title) => {
                            const note = notes.find((n) => n.title === title);
                            if (!note) return null;
                            return (
                              <li
                                key={title}
                                onClick={() => handleSelectNote(note)}
                                style={{
                                  ...styles.linkItem,
                                  color: selectedNote?.title === title ? "#6b9eff" : "#e0e0e0",
                                }}
                              >
                                {title}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div style={styles.rightPanelEmpty}>No recent notes</div>
                      )}
                    </div>
                  )}
                </>
              )}
              {section === "links" && (
                <>
                  <div
                    style={{
                      ...styles.rightPanelSectionHeader,
                      ...(dragOverSection === "links" ? styles.dragOver : {}),
                      ...(draggedSection === "links" ? styles.dragging : {}),
                    }}
                    onClick={() => toggleSectionCollapse("links")}
                    draggable
                    onDragStart={(e) => handleDragStart(e, "links")}
                    onDragOver={(e) => handleDragOver(e, "links")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "links")}
                    onDragEnd={handleDragEnd}
                  >
                    <span style={styles.dragHandle}>⋮⋮</span>
                    <span style={styles.collapseIcon}>
                      {collapsedSections.has("links") ? "▶" : "▼"}
                    </span>
                    Links
                  </div>
                  {!collapsedSections.has("links") && (
                    <div style={styles.rightPanelSectionContent}>
                      {selectedNote ? (
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
                                      onClick={() => handleLinkClick(link)}
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
                                    onClick={() => handleSelectNote(note)}
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
                          {outgoingLinks.length === 0 && backlinks.length === 0 && (
                            <div style={styles.rightPanelEmpty}>No links</div>
                          )}
                        </>
                      ) : (
                        <div style={styles.rightPanelEmpty}>Select a note to see links</div>
                      )}
                    </div>
                  )}
                </>
              )}
              {section === "graph" && (
                <>
                  <div
                    style={{
                      ...styles.rightPanelSectionHeader,
                      ...(dragOverSection === "graph" ? styles.dragOver : {}),
                      ...(draggedSection === "graph" ? styles.dragging : {}),
                    }}
                    onClick={() => toggleSectionCollapse("graph")}
                    draggable
                    onDragStart={(e) => handleDragStart(e, "graph")}
                    onDragOver={(e) => handleDragOver(e, "graph")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "graph")}
                    onDragEnd={handleDragEnd}
                  >
                    <span style={styles.dragHandle}>⋮⋮</span>
                    <span style={styles.collapseIcon}>
                      {collapsedSections.has("graph") ? "▶" : "▼"}
                    </span>
                    Graph
                  </div>
                  {!collapsedSections.has("graph") && (
                    <div style={styles.rightPanelGraphContainer}>
                      <GraphView
                        notes={notes}
                        selectedNote={selectedNote}
                        onSelectNote={handleSelectNote}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
      {contextMenu && (
        <div
          style={{
            ...styles.contextMenu,
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div style={styles.contextMenuItem} onClick={handleContextMenuRename}>
            Rename
          </div>
          <div style={styles.contextMenuItem} onClick={handleContextMenuDelete}>
            Delete
          </div>
        </div>
      )}
      {showCommandPalette && (
        <div style={styles.modalOverlay} onClick={() => setShowCommandPalette(false)}>
          <div style={styles.commandPalette} onClick={(e) => e.stopPropagation()}>
            <input
              ref={commandInputRef}
              type="text"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const firstCmd = filteredCommands[0];
                  if (firstCmd) executeCommand(firstCmd);
                }
                if (e.key === "Escape") {
                  setShowCommandPalette(false);
                  setCommandQuery("");
                }
              }}
              placeholder="Type a command..."
              style={styles.commandInput}
              autoFocus
            />
            <div style={styles.commandList}>
              {filteredCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  style={styles.commandItem}
                >
                  {cmd.label}
                </div>
              ))}
              {filteredCommands.length === 0 && (
                <div style={styles.commandEmpty}>No matching commands</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  welcome: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "1rem",
  },
  appContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #333",
    background: "#1a1a1a",
  },
  topHeaderTitle: {
    fontWeight: "bold",
    fontSize: "14px",
    color: "#888",
  },
  topHeaderSearch: {
    position: "relative",
    flex: 1,
    maxWidth: "400px",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  topHeaderSearchInput: {
    flex: 1,
    padding: "0.5rem 0.75rem",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
  },
  searchDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    maxHeight: "300px",
    overflow: "auto",
    zIndex: 100,
  },
  searchDropdownItem: {
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
    fontSize: "14px",
    color: "#e0e0e0",
  },
  topHeaderActions: {
    display: "flex",
    gap: "0.5rem",
  },
  topHeaderButton: {
    padding: "0.25rem 0.75rem",
    border: "1px solid #444",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    color: "#e0e0e0",
  },
  mainContent: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  sidebar: {
    width: "250px",
    borderRight: "1px solid #333",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: "1rem",
    borderBottom: "1px solid #333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newButton: {
    width: "24px",
    height: "24px",
    padding: 0,
    cursor: "pointer",
  },
  noteList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    flex: 1,
    overflow: "auto",
    outline: "none",
  },
  noteItem: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
  },
  searchContainer: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #333",
    display: "flex",
    gap: "0.5rem",
  },
  searchInput: {
    flex: 1,
    padding: "0.5rem",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "14px",
  },
  clearSearch: {
    background: "transparent",
    border: "none",
    color: "#888",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 0.25rem",
  },
  searchStatus: {
    padding: "0.5rem 1rem",
    color: "#666",
    fontStyle: "italic",
  },
  searchSnippet: {
    fontSize: "12px",
    color: "#888",
    marginTop: "0.25rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  changeFolder: {
    margin: "1rem",
  },
  newNoteInput: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #333",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "14px",
  },
  editor: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  editorHeader: {
    padding: "1rem",
    borderBottom: "1px solid #333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editorActions: {
    display: "flex",
    gap: "0.5rem",
  },
  toggleButton: {
    fontSize: "12px",
    padding: "0.25rem 0.5rem",
  },
  viewModeToggle: {
    display: "flex",
    border: "1px solid #444",
    borderRadius: "4px",
    overflow: "hidden",
  },
  viewModeButton: {
    fontSize: "12px",
    padding: "0.25rem 0.5rem",
    border: "none",
    borderRadius: 0,
  },
  renderedView: {
    flex: 1,
    padding: "1rem",
    overflow: "auto",
    background: "#1a1a1a",
    color: "#e0e0e0",
    lineHeight: 1.6,
  },
  renderedP: {
    margin: "0 0 1rem 0",
  },
  wikiLink: {
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationStyle: "dotted" as const,
  },
  textarea: {
    flex: 1,
    padding: "1rem",
    border: "none",
    resize: "none",
    fontFamily: "monospace",
    fontSize: "14px",
    background: "#1a1a1a",
    color: "#fff",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#666",
  },
  linksPanel: {
    width: "200px",
    borderLeft: "1px solid #333",
    display: "flex",
    flexDirection: "column",
  },
  linksPanelHeader: {
    padding: "1rem",
    borderBottom: "1px solid #333",
    fontWeight: "bold",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#888",
  },
  linksList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    overflow: "auto",
  },
  linkItem: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  newBadge: {
    fontSize: "10px",
    background: "#444",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#888",
  },
  noteListContainer: {
    flex: 1,
    overflow: "auto",
  },
  sectionHeader: {
    padding: "0.5rem 1rem",
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#666",
    borderBottom: "1px solid #333",
  },
  editableTitle: {
    cursor: "pointer",
  },
  renameTitleInput: {
    background: "#2a2a2a",
    border: "1px solid #6b9eff",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "16px",
    padding: "0.25rem 0.5rem",
    outline: "none",
  },
  deleteButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0.25rem 0.5rem",
    opacity: 0.6,
  },
  contextMenu: {
    position: "fixed",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    zIndex: 1000,
    minWidth: "120px",
  },
  contextMenuItem: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: "14px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "100px",
    zIndex: 1000,
  },
  commandPalette: {
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "8px",
    width: "500px",
    maxWidth: "90vw",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  commandInput: {
    width: "100%",
    padding: "1rem",
    background: "#2a2a2a",
    border: "none",
    borderBottom: "1px solid #444",
    color: "#e0e0e0",
    fontSize: "16px",
    outline: "none",
  },
  commandList: {
    maxHeight: "300px",
    overflow: "auto",
  },
  commandItem: {
    padding: "0.75rem 1rem",
    cursor: "pointer",
    fontSize: "14px",
    color: "#e0e0e0",
  },
  commandEmpty: {
    padding: "1rem",
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  graphContainer: {
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  graphHeader: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #444",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#e0e0e0",
    fontWeight: "bold",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#888",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0 0.5rem",
  },
  rightPanel: {
    width: "300px",
    borderLeft: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    background: "#1a1a1a",
    overflow: "hidden",
  },
  rightPanelSection: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    flex: 1,
  },
  rightPanelSectionHeader: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #333",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#888",
    background: "#222",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    userSelect: "none",
  },
  collapseIcon: {
    fontSize: "10px",
    width: "12px",
    color: "#666",
  },
  dragHandle: {
    cursor: "grab",
    color: "#555",
    fontSize: "10px",
    letterSpacing: "-2px",
    marginRight: "0.25rem",
  },
  dragOver: {
    background: "#333",
    borderTop: "2px solid #6b9eff",
  },
  dragging: {
    opacity: 0.5,
  },
  findBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "#252525",
    borderBottom: "1px solid #333",
  },
  findInput: {
    flex: 1,
    padding: "0.25rem 0.5rem",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
  },
  findCount: {
    fontSize: "12px",
    color: "#888",
    minWidth: "70px",
  },
  findButton: {
    background: "#333",
    border: "1px solid #444",
    borderRadius: "4px",
    color: "#e0e0e0",
    cursor: "pointer",
    padding: "0.25rem 0.5rem",
    fontSize: "14px",
  },
  textareaContainer: {
    flex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  autocompleteDropdown: {
    position: "absolute",
    top: "60px",
    left: "1rem",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    maxHeight: "200px",
    overflow: "auto",
    zIndex: 100,
    minWidth: "200px",
  },
  autocompleteItem: {
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
    fontSize: "14px",
    color: "#e0e0e0",
  },
  rightPanelSectionContent: {
    overflow: "auto",
    flex: 1,
  },
  rightPanelGraphContainer: {
    flex: 1,
    minHeight: "200px",
    display: "flex",
  },
  rightPanelEmpty: {
    padding: "1rem",
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
