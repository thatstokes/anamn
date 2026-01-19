import type { Note } from "../../shared/types.js";
import { useUI } from "../state/contexts/UIContext.js";
import { useTheme } from "./ThemeProvider.js";
import { Logo } from "./Logo.js";

interface TopHeaderProps {
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
}

export function TopHeader({ selectedNote, onSelectNote }: TopHeaderProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    showRightPanel,
    setShowRightPanel,
    searchInputRef,
  } = useUI();
  const { theme } = useTheme();
  const logoVariant = theme.mode === "light" ? "light" : "dark";

  return (
    <div className="top-header">
      <div className="top-header-title">
        <Logo height={24} variant={logoVariant} />
      </div>
      <div className="top-header-search">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes... (Ctrl+P)"
          className="top-header-search-input"
        />
        {searchQuery && (
          <>
            <button
              onClick={() => setSearchQuery("")}
              className="clear-search"
            >
              ×
            </button>
            <div className="search-dropdown">
              {isSearching ? (
                <div className="search-dropdown-item">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="search-dropdown-item">No results found</div>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.note.path}
                    onClick={() => {
                      onSelectNote(result.note);
                      setSearchQuery("");
                    }}
                    className={`search-dropdown-item ${selectedNote?.path === result.note.path ? "selected" : ""}`}
                  >
                    <div>{result.note.title}</div>
                    {result.snippet && (
                      <div className="search-snippet">{result.snippet}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <div className="top-header-actions">
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          className={`top-header-button ${showRightPanel ? "active" : ""}`}
          title="Toggle right panel (Ctrl+G)"
        >
          ☰ Panel
        </button>
      </div>
    </div>
  );
}
