import type { Note } from "../../shared/types.js";
import { styles } from "../styles/styles.js";
import { useUI } from "../state/contexts/UIContext.js";

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
  return (
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
                      onSelectNote(result.note);
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
  );
}
