import { useRef, useEffect } from "react";
import { styles } from "../styles/styles.js";

interface FindBarProps {
  findQuery: string;
  setFindQuery: (query: string) => void;
  findMatches: number[];
  currentMatchIndex: number;
  findNext: () => void;
  findPrevious: () => void;
  closeFindBar: () => void;
}

export function FindBar({
  findQuery,
  setFindQuery,
  findMatches,
  currentMatchIndex,
  findNext,
  findPrevious,
  closeFindBar,
}: FindBarProps) {
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    findInputRef.current?.focus();
  }, []);

  return (
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
  );
}
