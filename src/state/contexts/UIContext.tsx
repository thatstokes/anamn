import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { KeyboardShortcuts, RightPanelSection } from "../../../shared/types.js";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch.js";

interface UIContextValue {
  // Shortcuts
  shortcuts: KeyboardShortcuts | null;
  // Right panel
  showRightPanel: boolean;
  setShowRightPanel: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelSections: RightPanelSection[];
  setRightPanelSections: React.Dispatch<React.SetStateAction<RightPanelSection[]>>;
  collapsedSections: Set<RightPanelSection>;
  toggleSectionCollapse: (section: RightPanelSection) => void;
  // Command palette
  showCommandPalette: boolean;
  setShowCommandPalette: React.Dispatch<React.SetStateAction<boolean>>;
  commandQuery: string;
  setCommandQuery: React.Dispatch<React.SetStateAction<string>>;
  // Search
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchResults: import("../../../shared/types.js").SearchResult[];
  isSearching: boolean;
  // Refs for focus management
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  newNoteInputRef: React.RefObject<HTMLInputElement | null>;
  commandInputRef: React.RefObject<HTMLInputElement | null>;
  findInputRef: React.RefObject<HTMLInputElement | null>;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcuts | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [rightPanelSections, setRightPanelSections] = useState<RightPanelSection[]>(["links", "graph"]);
  const [collapsedSections, setCollapsedSections] = useState<Set<RightPanelSection>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search
  const { results: searchResults, isSearching } = useDebouncedSearch({ query: searchQuery });

  // Refs for focus management
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newNoteInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Load config on mount
  useEffect(() => {
    window.api.config.get().then((config) => {
      setShortcuts(config.shortcuts);
      setRightPanelSections(config.rightPanelSections);
      setShowRightPanel(config.rightPanelOpen);
      setCollapsedSections(new Set(config.collapsedSections));
    });
  }, []);

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

  const value = useMemo<UIContextValue>(() => ({
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
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchInputRef,
    newNoteInputRef,
    commandInputRef,
    findInputRef,
  }), [
    shortcuts,
    showRightPanel,
    rightPanelSections,
    collapsedSections,
    toggleSectionCollapse,
    showCommandPalette,
    commandQuery,
    searchQuery,
    searchResults,
    isSearching,
  ]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
